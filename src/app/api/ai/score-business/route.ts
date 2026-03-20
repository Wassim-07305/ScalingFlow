import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildBusinessScoringPrompt,
  type BusinessScoringContext,
  type BusinessScoreResult,
} from "@/lib/ai/prompts/business-scoring";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 60;

async function fetchBusinessData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<BusinessScoringContext> {
  const [
    profileRes,
    offerRes,
    funnelsCountRes,
    leadsCountRes,
    pipelineLeadsRes,
    adCampaignsRes,
    marketRes,
    connectionsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "current_revenue, target_revenue, experience_level, niche, objectives, selected_market",
      )
      .eq("id", userId)
      .single(),
    supabase
      .from("offers")
      .select(
        "offer_name, positioning, unique_mechanism, pricing_strategy, guarantees",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("funnels")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("funnel_leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("pipeline_leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("ad_campaigns")
      .select("total_spend, roas, total_conversions")
      .eq("user_id", userId),
    supabase
      .from("market_analyses")
      .select("selected_market")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("connected_accounts")
      .select("provider")
      .eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  const offer = offerRes.data;
  const campaigns = adCampaignsRes.data ?? [];

  const totalAdSpend = campaigns.reduce((s, c) => s + (c.total_spend || 0), 0);
  const avgRoas =
    campaigns.length > 0
      ? campaigns.reduce((s, c) => s + (c.roas || 0), 0) / campaigns.length
      : 0;
  const totalConversions = campaigns.reduce(
    (s, c) => s + (c.total_conversions || 0),
    0,
  );
  const avgCpl =
    totalConversions > 0 ? totalAdSpend / totalConversions : 0;

  return {
    current_revenue: profile?.current_revenue ?? null,
    target_revenue: profile?.target_revenue ?? null,
    experience_level: profile?.experience_level ?? null,
    niche: profile?.niche ?? null,
    objectives: profile?.objectives ?? null,
    has_offer: !!offer,
    offer_name: offer?.offer_name ?? null,
    positioning: offer?.positioning ?? null,
    unique_mechanism: offer?.unique_mechanism ?? null,
    pricing_strategy: offer?.pricing_strategy ?? null,
    guarantees: offer?.guarantees ?? null,
    funnels_count: funnelsCountRes.count ?? 0,
    leads_count: leadsCountRes.count ?? 0,
    pipeline_leads_count: pipelineLeadsRes.count ?? 0,
    has_ads: campaigns.length > 0,
    ad_campaigns_count: campaigns.length,
    total_ad_spend: Math.round(totalAdSpend * 100) / 100,
    avg_roas: Math.round(avgRoas * 100) / 100,
    avg_cpl: Math.round(avgCpl * 100) / 100,
    selected_market:
      marketRes.data?.selected_market ?? profile?.selected_market ?? null,
    connected_providers:
      connectionsRes.data?.map((c) => c.provider) ?? [],
  };
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

    // Rate limiting — 3 req/hour (scoring IA lourd)
    const rl = await rateLimit(user.id, "score-business", {
      limit: 3,
      windowSeconds: 3600,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Limite atteinte. Réessaie dans une heure." },
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

    // Fetch all business data
    const ctx: BusinessScoringContext = await fetchBusinessData(
      supabase,
      user.id,
    );

    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = buildBusinessScoringPrompt(ctx);
    const fullPrompt = vaultContext
      ? basePrompt + "\n\n" + vaultContext
      : basePrompt;

    const aiModel = getModelForGeneration("scoring");

    const { data: result, usage: aiUsage } = await generateJSON<BusinessScoreResult>({
      model: aiModel,
      prompt: fullPrompt,
      maxTokens: 4096,
      temperature: 0.3,
    });

    // Persist score in DB
    const { error: insertError } = await supabase
      .from("business_scores")
      .insert({
        user_id: user.id,
        acquisition_score: result.acquisition.score,
        offer_score: result.offre.score,
        delivery_score: result.delivery.score,
        global_score: result.global_score,
        details: result as unknown as Record<string, unknown>,
      });

    if (insertError) {
      console.error("Failed to save business score:", insertError);
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "validation.business_score");
    } catch {}
    try {
      await notifyGeneration(user.id, "validation.business_score");
    } catch {}

    incrementAIUsage(user.id, { generationType: "scoring", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json({
      ...result,
      last_scored_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur scoring business : ${message}` },
      { status: 500 },
    );
  }
}
