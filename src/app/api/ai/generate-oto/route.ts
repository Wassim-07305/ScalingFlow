import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { otoOfferPrompt } from "@/lib/ai/prompts/oto-offer";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { awardXP } from "@/lib/gamification/xp-engine";
import { rateLimit } from "@/lib/utils/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const rl = await rateLimit(user.id, "generate-oto", {
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

    let prompt = otoOfferPrompt(
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

    const aiModel = getModelForGeneration("oto");

    const otoData = await generateJSON<Record<string, unknown>>({
      model: aiModel,
      prompt,
      maxTokens: 6000,
    });

    // Save OTO data to offer
    const { error: updateError } = await supabase
      .from("offers")
      .update({ oto_offer: otoData })
      .eq("id", offerId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("generate-oto: failed to update offer", updateError);
    }

    try {
      await awardXP(user.id, "generation.offer");
    } catch (e) {
      console.warn("generate-oto: XP award failed", e);
    }

    incrementAIUsage(user.id, { generationType: "oto", model: aiModel }).catch(() => {});

    return NextResponse.json(otoData);
  } catch (error) {
    console.error("[generate-oto] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'OTO" },
      { status: 500 },
    );
  }
}
