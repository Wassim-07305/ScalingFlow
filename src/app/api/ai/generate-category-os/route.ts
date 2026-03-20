import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildCategoryOSPrompt,
  type CategoryOSResult,
} from "@/lib/ai/prompts/category-os";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 120;

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
    const rl = await rateLimit(user.id, "generate-category-os", {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
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

    const body = await req.json();
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId est requis" },
        { status: 400 },
      );
    }

    // Fetch offer
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*, market_analyses(*)")
      .eq("id", offerId)
      .eq("user_id", user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    interface MarketAnalysisData {
      market_name?: string;
      problems?: string[];
      recommended_positioning?: string;
      competitors?: unknown;
      target_avatar?: unknown;
    }
    const marketAnalysis = (offer as Record<string, unknown>)
      .market_analyses as MarketAnalysisData | undefined;

    // Fetch user profile for vault data
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, vault_skills, expertise_answers")
      .eq("id", user.id)
      .single();

    const vaultContext = await buildFullVaultContext(user.id);

    const basePrompt = buildCategoryOSPrompt({
      marketAnalysis: {
        market_name: marketAnalysis?.market_name || "Non défini",
        problems: marketAnalysis?.problems || [],
        positioning: marketAnalysis?.recommended_positioning || "",
        competitors: marketAnalysis?.competitors,
        target_avatar: marketAnalysis?.target_avatar,
      },
      offer: {
        offer_name: offer.offer_name,
        positioning: offer.positioning || "",
        unique_mechanism: offer.unique_mechanism || "",
      },
      vaultData: {
        skills: profile?.skills || [],
        expertise: profile?.expertise_answers,
      },
    });

    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const aiModel = getModelForGeneration("category_os");

    const categoryOS = await generateJSON<CategoryOSResult>({
      model: aiModel,
      prompt,
      maxTokens: 6000,
    });

    // Update the offer with category_os data
    const { error: updateError } = await supabase
      .from("offers")
      .update({
        ai_raw_response: {
          ...(typeof offer.ai_raw_response === "object" &&
          offer.ai_raw_response !== null
            ? offer.ai_raw_response
            : {}),
          category_os: categoryOS,
        },
      })
      .eq("id", offerId);

    if (updateError) {
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du Category OS" },
        { status: 500 },
      );
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.category_os");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.category_os");
    } catch {}

    incrementAIUsage(user.id, { generationType: "category_os", model: aiModel }).catch(() => {});

    return NextResponse.json(categoryOS);
  } catch (error) {
    console.error("Category OS generation error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la génération du Category OS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
