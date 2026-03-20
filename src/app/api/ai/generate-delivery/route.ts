import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { deliveryStructurePrompt } from "@/lib/ai/prompts/delivery-structure";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { awardXP } from "@/lib/gamification/xp-engine";
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

    const rl = await rateLimit(user.id, "generate-delivery", {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 },
      );
    }

    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId est requis" },
        { status: 400 },
      );
    }

    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*, market_analyses(*)")
      .eq("id", offerId)
      .eq("user_id", user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    const avatar = offer.market_analyses?.avatar || {};

    let prompt = deliveryStructurePrompt(
      {
        offer_name: offer.offer_name,
        positioning: offer.positioning,
        unique_mechanism: offer.unique_mechanism,
        pricing_strategy: offer.pricing_strategy,
      },
      avatar,
    );

    const vaultContext = await buildFullVaultContext(user.id);
    if (vaultContext) {
      prompt = prompt + "\n" + vaultContext;
    }

    const aiModel = getModelForGeneration("delivery");

    const { data: delivery, usage: aiUsage } = await generateJSON<Record<string, unknown>>({
      model: aiModel,
      prompt,
      maxTokens: 6000,
    });

    // Save delivery data to offer
    const { error: updateError } = await supabase
      .from("offers")
      .update({ delivery_data: delivery })
      .eq("id", offerId);

    if (updateError) {
      console.error("generate-delivery: failed to update offer", updateError);
    }

    try {
      await awardXP(user.id, "generation.offer");
    } catch (e) {
      console.warn("generate-delivery: XP award failed", e);
    }

    incrementAIUsage(user.id, { generationType: "delivery", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json(delivery);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur lors de la génération du delivery: ${errMsg}` },
      { status: 500 },
    );
  }
}
