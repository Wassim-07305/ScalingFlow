import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  continuousContentPrompt,
  type WeeklyBatchResult,
  type ContinuousContentContext,
} from "@/lib/ai/prompts/continuous-content";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { rateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isLibrary = searchParams.get("library") === "1";

    if (!isLibrary) {
      return NextResponse.json(
        { error: "Paramètre manquant" },
        { status: 400 },
      );
    }

    const { data: pieces, error } = await supabase
      .from("content_pieces")
      .select(
        "id, content_type, title, hook, content, hashtags, published, ai_raw_response, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors du chargement de la bibliothèque" },
        { status: 500 },
      );
    }

    return NextResponse.json({ pieces: pieces || [] });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur bibliothèque: ${errMsg}` },
      { status: 500 },
    );
  }
}

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
    const rl = await rateLimit(user.id, "generate-weekly-content", {
      limit: 3,
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
    const { performance_data, objections, preferences } = body;

    // Fetch profile + vault context
    const [{ data: profile }, vaultContext] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      buildFullVaultContext(user.id),
    ]);

    const { data: latestAnalysis } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: latestOffer } = await supabase
      .from("offers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Build context
    const context: ContinuousContentContext = {
      niche:
        profile?.niche ||
        profile?.selected_market ||
        latestAnalysis?.market ||
        "Freelances et consultants",
      offer: latestOffer
        ? `${latestOffer.offer_name} - ${latestOffer.positioning || ""}`
        : "Offre de consulting/formation",
      persona: latestAnalysis?.avatar
        ? JSON.stringify(latestAnalysis.avatar, null, 2)
        : "Freelances et consultants qui veulent scaler leur business",
      topPerformingTypes:
        performance_data?.top_types || preferences?.topTypes || undefined,
      engagementMetrics: performance_data?.metrics || undefined,
      salesObjections: objections
        ? objections
            .map(
              (o: { text: string; frequency: number }) =>
                `- "${o.text}" (fréquence : ${o.frequency}/10)`,
            )
            .join("\n")
        : undefined,
    };

    // Fetch ad insights for enrichment
    const { data: topAds } = await supabase
      .from("ad_creatives")
      .select("headline, hook, angle, ctr")
      .eq("user_id", user.id)
      .gt("ctr", 0)
      .order("ctr", { ascending: false })
      .limit(3);

    if (topAds && topAds.length > 0) {
      context.adInsights = topAds
        .map(
          (ad) =>
            `- Hook: "${ad.hook || ad.headline}" | Angle: ${ad.angle || "N/A"} | CTR: ${ad.ctr}%`,
        )
        .join("\n");
    }

    let prompt = continuousContentPrompt(context);
    if (vaultContext) prompt += "\n" + vaultContext;

    const aiModel = getModelForGeneration("weekly_content");

    const { data: result, usage: aiUsage } = await generateJSON<WeeklyBatchResult>({
      model: aiModel,
      prompt,
      maxTokens: 4096,
      temperature: 0.8,
    });

    // Save each content piece
    for (const piece of result.contenus || []) {
      const contentType =
        piece.type === "reel"
          ? "instagram_reel"
          : piece.type === "carousel"
            ? "instagram_carousel"
            : piece.type === "story"
              ? "instagram_story"
              : "instagram_post";

      const { error: insertErr } = await supabase
        .from("content_pieces")
        .insert({
          user_id: user.id,
          content_type: contentType,
          title: `Batch hebdo - ${piece.pillar} - ${piece.type}`,
          hook: piece.hook,
          content: piece.script,
          hashtags: piece.hashtags,
          published: false,
          ai_raw_response: piece,
        });
      if (insertErr)
        console.error(
          "generate-weekly-content: failed to save piece",
          insertErr,
        );
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.content_strategy");
    } catch (e) {
      console.warn("Non-blocking op failed:", e);
    }
    try {
      await notifyGeneration(user.id, "generation.content_strategy");
    } catch (e) {
      console.warn("Non-blocking op failed:", e);
    }

    incrementAIUsage(user.id, { generationType: "weekly_content", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json({ result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur lors de la génération du batch hebdo: ${errMsg}` },
      { status: 500 },
    );
  }
}
