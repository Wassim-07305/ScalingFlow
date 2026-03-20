import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { rateLimit } from "@/lib/utils/rate-limit";
import { awardXP } from "@/lib/gamification/xp-engine";
import {
  buildAdsScoringPrompt,
  type AdsScoreResult,
  type AdsDataForScoring,
} from "@/lib/ai/prompts/ads-scoring";

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
    const rl = await rateLimit(user.id, "score-ads", {
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

    // Fetch ads data + user niche
    const [
      { data: campaigns },
      { data: creatives },
      { data: dailyMetrics },
      { data: profile },
    ] = await Promise.all([
      supabase
        .from("ad_campaigns")
        .select(
          "campaign_name, status, daily_budget, total_budget, total_spend, total_impressions, total_clicks, total_conversions, roas, meta_campaign_id",
        )
        .eq("user_id", user.id)
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("ad_creatives")
        .select(
          "creative_type, status, impressions, clicks, ctr, spend, conversions, cpa, meta_ad_id",
        )
        .eq("user_id", user.id)
        .order("spend", { ascending: false })
        .limit(30),
      supabase
        .from("ad_daily_metrics")
        .select("date, spend, impressions, clicks, conversions, roas, ctr, cpm, cpa")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30),
      supabase
        .from("profiles")
        .select("niche")
        .eq("id", user.id)
        .single(),
    ]);

    // Return early if no data at all
    if (
      (!campaigns || campaigns.length === 0) &&
      (!creatives || creatives.length === 0)
    ) {
      return NextResponse.json({
        has_data: false,
        message:
          "Aucune donnée publicitaire trouvée. Connecte ton compte Meta Ads ou crée des campagnes pour scorer tes publicités.",
      });
    }

    const scoringData: AdsDataForScoring = {
      campaigns: campaigns ?? [],
      creatives: creatives ?? [],
      daily_metrics: dailyMetrics ?? [],
      niche: profile?.niche ?? null,
    };

    const prompt = buildAdsScoringPrompt(scoringData);

    const aiModel = getModelForGeneration("scoring");

    const score = await generateJSON<AdsScoreResult>({
      model: aiModel,
      prompt,
      maxTokens: 4096,
    });

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "validation.ads");
    } catch {}

    incrementAIUsage(user.id, { generationType: "scoring", model: aiModel }).catch(() => {});

    return NextResponse.json(score);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du scoring des publicités" },
      { status: 500 },
    );
  }
}
