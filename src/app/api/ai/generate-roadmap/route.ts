import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildRoadmapPrompt,
  type RoadmapResult,
} from "@/lib/ai/prompts/roadmap-generator";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Rate limiting
    const rl = await rateLimit(user.id, "generate-roadmap", {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 },
      );
    }

    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 },
      );
    }

    const body = await req.json();

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "parcours, situation, skills, experience_level, objectives, hours_per_week, deadline",
      )
      .eq("id", user.id)
      .single();

    // Check current progress
    const [
      { count: offerCount },
      { count: funnelCount },
      { count: adCount },
      { count: contentCount },
    ] = await Promise.all([
      supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("funnels")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("ad_creatives")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("content_pieces")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const vaultContext = await buildFullVaultContext(user.id);

    const { systemPrompt, userPrompt } = buildRoadmapPrompt({
      parcours: profile?.parcours || body.parcours || "",
      situation: profile?.situation || "",
      skills: profile?.skills || [],
      experienceLevel: profile?.experience_level || "",
      objectives: profile?.objectives || [],
      hoursPerWeek: profile?.hours_per_week || 10,
      deadline: profile?.deadline || "3 mois",
      hasOffer: (offerCount || 0) > 0,
      hasFunnel: (funnelCount || 0) > 0,
      hasAds: (adCount || 0) > 0,
      hasContent: (contentCount || 0) > 0,
    });

    const result = await generateJSON<RoadmapResult>({
      prompt: vaultContext ? userPrompt + "\n" + vaultContext : userPrompt,
      systemPrompt,
      maxTokens: 4096,
    });

    // Delete existing tasks for this user (regenerate fresh)
    await supabase.from("tasks").delete().eq("user_id", user.id);

    // Calculate due_dates based on user's hours/week and task order
    const hoursPerWeek = profile?.hours_per_week || 10;
    const minutesPerWeek = hoursPerWeek * 60;
    const startDate = new Date();
    let accumulatedMinutes = 0;

    const tasksToInsert = result.tasks.map((task) => {
      accumulatedMinutes += task.estimated_minutes;
      const weeksOffset = accumulatedMinutes / minutesPerWeek;
      const dueDate = new Date(
        startDate.getTime() + weeksOffset * 7 * 24 * 60 * 60 * 1000,
      );

      return {
        user_id: user.id,
        title: task.title,
        description: task.description,
        task_type: task.task_type as "action" | "video" | "review" | "launch",
        related_module: task.related_module,
        estimated_minutes: task.estimated_minutes,
        task_order: task.task_order,
        phase: task.phase || null,
        due_date: dueDate.toISOString().split("T")[0],
        completed: false,
      };
    });

    const { error: insertError } = await supabase
      .from("tasks")
      .insert(tasksToInsert);

    if (insertError) {
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde des tâches" },
        { status: 500 },
      );
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.roadmap");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.roadmap");
    } catch {}

    return NextResponse.json({
      tasks_count: result.tasks.length,
      total_estimated_hours: result.total_estimated_hours,
      recommended_pace: result.recommended_pace,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la génération de la roadmap" },
      { status: 500 },
    );
  }
}
