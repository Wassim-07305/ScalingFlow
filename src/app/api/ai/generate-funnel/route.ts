import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { funnelCopyPrompt } from "@/lib/ai/prompts/funnel-copy";
import { awardXP } from "@/lib/gamification/xp-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId est requis" },
        { status: 400 }
      );
    }

    // Fetch offer from database
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*, market_analyses(*)")
      .eq("id", offerId)
      .eq("user_id", user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    // Extract avatar from market analysis
    const avatar = offer.market_analyses?.avatar || {};

    // Generate funnel copy using AI
    const prompt = funnelCopyPrompt(
      {
        offer_name: offer.offer_name,
        positioning: offer.positioning,
        unique_mechanism: offer.unique_mechanism,
      },
      avatar
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedFunnel: any = await generateJSON({ prompt, maxTokens: 4096 });

    // Save funnel to database
    const { data: funnel, error: saveError } = await supabase
      .from("funnels")
      .insert({
        user_id: user.id,
        offer_id: offerId,
        funnel_name: `Funnel — ${offer.offer_name}`,
        optin_page: generatedFunnel.optin_page,
        vsl_page: generatedFunnel.vsl_page,
        thankyou_page: generatedFunnel.thankyou_page,
        status: "draft",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving funnel:", saveError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du funnel" },
        { status: 500 }
      );
    }

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.funnel"); } catch {}

    return NextResponse.json(funnel);
  } catch (error) {
    console.error("Error generating funnel:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du funnel" },
      { status: 500 }
    );
  }
}
