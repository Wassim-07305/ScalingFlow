import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { buildBrandIdentityPrompt, type BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";
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

    // Fetch user's selected market analysis
    const { data: marketAnalysis } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("user_id", user.id)
      .eq("selected", true)
      .single();

    if (!marketAnalysis) {
      return NextResponse.json(
        { error: "Aucune analyse de marche selectionnee" },
        { status: 400 }
      );
    }

    // Optionally fetch offer if provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let offer: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let categoryOS: any = null;

    if (offerId) {
      const { data: offerData } = await supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .eq("user_id", user.id)
        .single();

      if (offerData) {
        offer = offerData;
        // Extract category OS from ai_raw_response if available
        const rawResponse = offerData.ai_raw_response as Record<string, unknown> | null;
        if (rawResponse && typeof rawResponse === "object" && "category_os" in rawResponse) {
          categoryOS = rawResponse.category_os;
        }
      }
    }

    const vaultContext = await buildFullVaultContext(user.id);

    const basePrompt = buildBrandIdentityPrompt({
      marketAnalysis: {
        market_name: marketAnalysis.market_name,
        problems: marketAnalysis.problems || [],
        positioning: marketAnalysis.recommended_positioning || "",
        target_avatar: marketAnalysis.target_avatar,
      },
      offer: offer
        ? {
            offer_name: offer.offer_name,
            positioning: offer.positioning || "",
            unique_mechanism: offer.unique_mechanism || "",
          }
        : undefined,
      categoryOS: categoryOS
        ? {
            category_name: categoryOS.new_game?.category_name,
            tagline: categoryOS.identite?.tagline,
            tone_of_voice: categoryOS.identite?.tone_of_voice,
          }
        : undefined,
    });

    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const brandIdentity = await generateJSON<BrandIdentityResult>({
      prompt,
      maxTokens: 8192,
    });

    // Save to brand_identities table
    const { data: brand, error: saveError } = await supabase
      .from("brand_identities")
      .insert({
        user_id: user.id,
        offer_id: offerId || null,
        brand_names: brandIdentity.noms as unknown as Record<string, unknown>,
        art_direction: brandIdentity.direction_artistique as unknown as Record<string, unknown>,
        logo_concept: JSON.stringify(brandIdentity.logo_concept),
        brand_kit: brandIdentity.brand_kit as unknown as Record<string, unknown>,
        status: "draft" as const,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving brand identity:", saveError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde de l'identite de marque" },
        { status: 500 }
      );
    }

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.brand"); } catch {}

    return NextResponse.json({ ...brand, generated: brandIdentity });
  } catch (error) {
    console.error("Error generating brand identity:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation de l'identite de marque" },
      { status: 500 }
    );
  }
}
