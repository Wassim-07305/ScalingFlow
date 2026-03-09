import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { buildOfferScoringPrompt, type OfferScoreResult } from "@/lib/ai/prompts/offer-scoring";
import { awardXP } from "@/lib/gamification/xp-engine";
import { buildFullVaultContext } from "@/lib/ai/vault-context";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
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
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId est requis" },
        { status: 400 }
      );
    }

    // Fetch offer
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .eq("user_id", user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    const vaultContext = await buildFullVaultContext(user.id);

    const basePrompt = buildOfferScoringPrompt({
      offer_name: offer.offer_name,
      positioning: offer.positioning,
      unique_mechanism: offer.unique_mechanism,
      pricing_strategy: offer.pricing_strategy,
      guarantees: offer.guarantees,
      no_brainer_element: offer.no_brainer_element,
      risk_reversal: offer.risk_reversal,
      delivery_structure: offer.delivery_structure,
      oto_offer: offer.oto_offer,
      ai_raw_response: offer.ai_raw_response,
    });

    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const score = await generateJSON<OfferScoreResult>({
      prompt,
      maxTokens: 4096,
    });

    // Award XP (non-blocking)
    try { await awardXP(user.id, "validation.offer"); } catch {}

    return NextResponse.json(score);
  } catch (error) {
    console.error("Error scoring offer:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'evaluation de l'offre" },
      { status: 500 }
    );
  }
}
