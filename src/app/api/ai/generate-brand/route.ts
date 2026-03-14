import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { buildBrandIdentityPrompt, type BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
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

    // Rate limiting
    const rl = await rateLimit(user.id, "generate-brand", { limit: 5, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 }
      );
    }

    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
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
        { error: "Aucune analyse de marché sélectionnée" },
        { status: 400 }
      );
    }

    // Optionally fetch offer if provided
    interface OfferData {
      offer_name: string;
      positioning?: string | null;
      unique_mechanism?: string | null;
      ai_raw_response?: Record<string, unknown> | null;
    }
    interface CategoryOSData {
      new_game?: { category_name?: string };
      identite?: { tagline?: string; tone_of_voice?: string };
    }
    let offer: OfferData | null = null;
    let categoryOS: CategoryOSData | null = null;

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
          categoryOS = rawResponse.category_os as CategoryOSData;
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
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde de l'identité de marque" },
        { status: 500 }
      );
    }

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.brand"); } catch {}
    try { await notifyGeneration(user.id, "generation.brand"); } catch {}

    return NextResponse.json({ ...brand, generated: brandIdentity });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'identité de marque" },
      { status: 500 }
    );
  }
}
