import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { adCopyPrompt } from "@/lib/ai/prompts/ad-copy";
import { adHooksPrompt } from "@/lib/ai/prompts/ad-hooks";

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

    // Fetch offer with related market analysis
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

    const avatar = offer.market_analyses?.avatar || {};
    const market = offer.market_analyses?.market || "";

    // Generate ad copy variations
    const adCopyProm = adCopyPrompt(
      {
        offer_name: offer.offer_name,
        positioning: offer.positioning,
        unique_mechanism: offer.unique_mechanism,
        pricing: offer.pricing || { real_price: 0 },
      },
      avatar
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedAdCopy: any = await generateJSON({ prompt: adCopyProm, maxTokens: 4096 });

    // Generate ad hooks
    const hooksProm = adHooksPrompt(market, avatar);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedHooks: any = await generateJSON({ prompt: hooksProm, maxTokens: 4096 });

    // Save each ad variation to the database
    const adCreatives = [];

    for (const variation of generatedAdCopy.variations || []) {
      const { data: adCreative, error: saveError } = await supabase
        .from("ad_creatives")
        .insert({
          user_id: user.id,
          creative_type: "image",
          ad_copy: variation.body,
          headline: variation.headline,
          hook: variation.hook,
          cta: variation.cta,
          angle: variation.angle,
          target_audience: variation.target_audience,
          status: "draft",
        })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving ad creative:", saveError);
        continue;
      }

      adCreatives.push(adCreative);
    }

    return NextResponse.json({
      ad_creatives: adCreatives,
      hooks: generatedHooks.hooks || [],
    });
  } catch (error) {
    console.error("Error generating ads:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des publicités" },
      { status: 500 }
    );
  }
}
