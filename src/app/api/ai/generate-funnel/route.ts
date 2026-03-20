import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { funnelCopyPrompt } from "@/lib/ai/prompts/funnel-copy";
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
    const rl = await rateLimit(user.id, "generate-funnel", {
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

    // Fetch offer from database
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*, market_analyses(*)")
      .eq("id", offerId)
      .eq("user_id", user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    // Extract avatar from market analysis
    const avatar = offer.market_analyses?.avatar || {};

    // Generate funnel copy using AI
    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = funnelCopyPrompt(
      {
        offer_name: offer.offer_name,
        positioning: offer.positioning,
        unique_mechanism: offer.unique_mechanism,
      },
      avatar,
    );
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;
    interface GeneratedFunnel {
      optin_page?: Record<string, unknown>;
      vsl_page?: Record<string, unknown>;
      thankyou_page?: Record<string, unknown>;
    }
    const aiModel = getModelForGeneration("funnel");

    const generatedFunnel = await generateJSON<GeneratedFunnel>({
      model: aiModel,
      prompt,
      maxTokens: 4096,
    });

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
      console.error("[generate-funnel] Supabase save error:", saveError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du funnel", detail: saveError.message },
        { status: 500 },
      );
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.funnel");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.funnel");
    } catch {}

    incrementAIUsage(user.id, { generationType: "funnel", model: aiModel }).catch(() => {});

    return NextResponse.json(funnel);
  } catch (error) {
    console.error("[generate-funnel] Unhandled error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du funnel" },
      { status: 500 },
    );
  }
}
