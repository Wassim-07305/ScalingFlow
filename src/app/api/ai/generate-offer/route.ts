import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { offerCreationPrompt } from "@/lib/ai/prompts/offer-creation";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
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
    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de generations IA atteinte", usage },
        { status: 403 }
      );
    }


    const body = await req.json();
    const { marketAnalysisId } = body;

    if (!marketAnalysisId) {
      return NextResponse.json(
        { error: "marketAnalysisId est requis" },
        { status: 400 }
      );
    }

    // Fetch market analysis from database
    const { data: marketAnalysis, error: fetchError } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("id", marketAnalysisId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !marketAnalysis) {
      return NextResponse.json(
        { error: "Analyse de marché introuvable" },
        { status: 404 }
      );
    }

    // Fetch user profile for skills
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .single();

    // Fetch vault resources context for personalization
    const vaultContext = await buildFullVaultContext(user.id);

    // Generate offer using AI
    const basePrompt = offerCreationPrompt(
      {
        name: marketAnalysis.market_name,
        problems: marketAnalysis.problems || [],
        avatar: (marketAnalysis.target_avatar as Record<string, unknown>) || {},
        positioning: marketAnalysis.recommended_positioning || "",
      },
      profile?.skills || []
    );
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedOffer: any = await generateJSON({ prompt, maxTokens: 8192 });

    // Save offer to database
    const { data: offer, error: saveError } = await supabase
      .from("offers")
      .insert({
        user_id: user.id,
        market_analysis_id: marketAnalysisId,
        offer_name: generatedOffer.packaging?.offer_name || "Nouvelle Offre",
        positioning: generatedOffer.packaging?.positioning,
        unique_mechanism: generatedOffer.packaging?.unique_mechanism?.name,
        pricing_strategy: generatedOffer.packaging?.pricing,
        guarantees: generatedOffer.packaging?.guarantees,
        no_brainer_element: generatedOffer.packaging?.no_brainer,
        risk_reversal: generatedOffer.packaging?.risk_reversal,
        delivery_structure: generatedOffer.delivery,
        oto_offer: generatedOffer.packaging?.oto,
        full_document: generatedOffer.full_document_markdown,
        ai_raw_response: generatedOffer,
        status: "draft",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving offer:", saveError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde de l'offre" },
        { status: 500 }
      );
    }

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.offer"); } catch {}

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Error generating offer:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'offre" },
      { status: 500 }
    );
  }
}
