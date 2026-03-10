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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de generations IA atteinte", usage },
        { status: 403 }
      );
    }


    const body = await req.json();

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("parcours, situation, skills, experience_level, objectives, hours_per_week, deadline")
      .eq("id", user.id)
      .single();

    // Check current progress
    const [
      { count: offerCount },
      { count: funnelCount },
      { count: adCount },
      { count: contentCount },
    ] = await Promise.all([
      supabase.from("offers").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("funnels").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("ad_creatives").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("content_pieces").select("*", { count: "exact", head: true }).eq("user_id", user.id),
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

    // Insert new tasks
    const tasksToInsert = result.tasks.map((task) => ({
      user_id: user.id,
      title: task.title,
      description: task.description,
      task_type: task.task_type as "action" | "video" | "review" | "launch",
      related_module: task.related_module,
      estimated_minutes: task.estimated_minutes,
      task_order: task.task_order,
      completed: false,
    }));

    const { error: insertError } = await supabase
      .from("tasks")
      .insert(tasksToInsert);

    if (insertError) {
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde des tâches" },
        { status: 500 }
      );
    }

    // Award XP (non-blocking)
    try { await awardXP(user.id, "milestone.completed"); } catch {}
    try { await notifyGeneration(user.id, "milestone.completed"); } catch {}

    return NextResponse.json({
      tasks_count: result.tasks.length,
      total_estimated_hours: result.total_estimated_hours,
      recommended_pace: result.recommended_pace,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la génération de la roadmap" },
      { status: 500 }
    );
  }
}
