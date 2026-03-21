import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { rateLimit } from "@/lib/utils/rate-limit";
import { generateJSON } from "@/lib/ai/generate";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import {
  getCurrentTier,
  getProgressToNextTier,
} from "@/lib/services/growth-tiers";
import {
  buildGrowthRecommendationsPrompt,
  type GrowthRecommendationsContext,
  type GrowthRecommendationsResult,
} from "@/lib/ai/prompts/growth-recommendations";

export const maxDuration = 60;

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Rate limiting — 5 req/jour (IA coûteuse)
    const rl = await rateLimit(user.id, "growth-recommendations", {
      limit: 5,
      windowSeconds: 86400,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Limite atteinte. Réessaie demain." },
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

    // Fetch all data in parallel
    const [profileRes, adsRes, pipelineRes, funnelsRes, leadsRes, scoresRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "current_revenue, target_revenue, niche, experience_level, selected_market",
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("ad_campaigns")
          .select("total_spend, roas, total_conversions")
          .eq("user_id", user.id),
        supabase
          .from("pipeline_leads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("funnels")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("funnel_leads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("business_scores")
          .select(
            "global_score, acquisition_score, offer_score, delivery_score",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("offers")
          .select("offer_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const offerRes = await supabase
      .from("offers")
      .select("offer_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const profile = profileRes.data;
    const campaigns = adsRes.data ?? [];
    const latestScore = scoresRes.data;

    const currentRevenue = profile?.current_revenue ?? 0;
    const currentTier = getCurrentTier(currentRevenue);
    const { percent, nextTier } = getProgressToNextTier(currentRevenue);

    const totalAdSpend = campaigns.reduce(
      (s, c) => s + (c.total_spend || 0),
      0,
    );
    const avgRoas =
      campaigns.length > 0
        ? campaigns.reduce((s, c) => s + (c.roas || 0), 0) / campaigns.length
        : 0;
    const totalConversions = campaigns.reduce(
      (s, c) => s + (c.total_conversions || 0),
      0,
    );
    const avgCpl =
      totalConversions > 0
        ? Math.round((totalAdSpend / totalConversions) * 100) / 100
        : 0;

    const ctx: GrowthRecommendationsContext = {
      current_revenue: currentRevenue,
      target_revenue: profile?.target_revenue ?? null,
      niche: profile?.niche ?? profile?.selected_market ?? null,
      experience_level: profile?.experience_level ?? null,
      current_tier: currentTier,
      next_tier: nextTier,
      progress_percent: percent,
      business_score_global: latestScore?.global_score ?? null,
      acquisition_score: latestScore?.acquisition_score ?? null,
      offer_score: latestScore?.offer_score ?? null,
      delivery_score: latestScore?.delivery_score ?? null,
      has_ads: campaigns.length > 0,
      ad_campaigns_count: campaigns.length,
      avg_roas: Math.round(avgRoas * 100) / 100,
      avg_cpl: avgCpl,
      pipeline_leads_count: pipelineRes.count ?? 0,
      funnels_count: funnelsRes.count ?? 0,
      leads_count: leadsRes.count ?? 0,
      offer_name: offerRes.data?.offer_name ?? null,
      has_offer: !!offerRes.data,
    };

    const aiModel = getModelForGeneration("growth_recs");

    const prompt = buildGrowthRecommendationsPrompt(ctx);
    const { data: result, usage: aiUsage } = await generateJSON<GrowthRecommendationsResult>({
      model: aiModel,
      prompt,
      maxTokens: 3000,
      temperature: 0.4,
    });

    // Persist recommendations
    await supabase
      .from("profiles")
      .update({
        growth_recommendations: result as unknown as Record<string, unknown>,
      })
      .eq("id", user.id);

    // Award XP & notify (non-blocking)
    try {
      await awardXP(user.id, "generation.growth_recommendations", {}, 75);
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.growth_recommendations");
    } catch {}

    incrementAIUsage(user.id, { generationType: "growth_recs", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json({
      ...result,
      current_tier_data: currentTier,
      next_tier_data: nextTier,
      progress_percent: percent,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur recommandations croissance : ${message}` },
      { status: 500 },
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("growth_recommendations, current_revenue")
      .eq("id", user.id)
      .maybeSingle();

    const currentRevenue = profile?.current_revenue ?? 0;
    const currentTier = getCurrentTier(currentRevenue);
    const { percent, nextTier, missingRevenue } =
      getProgressToNextTier(currentRevenue);

    return NextResponse.json({
      cached_recommendations: profile?.growth_recommendations ?? null,
      current_revenue: currentRevenue,
      current_tier: currentTier,
      next_tier: nextTier,
      progress_percent: percent,
      missing_revenue: missingRevenue,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
