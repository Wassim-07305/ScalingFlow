import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildInstagramProfilePrompt,
  type InstagramProfileResult,
} from "@/lib/ai/prompts/instagram-profile";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
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

    // Rate limiting
    const rl = await rateLimit(user.id, "optimize-instagram", {
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

    // Récupérer le profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Récupérer la dernière analyse de marché
    const { data: latestAnalysis } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Récupérer la dernière offre
    const { data: latestOffer } = await supabase
      .from("offers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const marketContext =
      latestAnalysis?.market ||
      profile?.target_market ||
      "Freelances et consultants IA";
    const offerContext = latestOffer
      ? `${latestOffer.offer_name} - ${latestOffer.positioning || ""}`
      : "Offre de consulting/formation";

    const body = await req.json();
    const brandContext =
      body.brand || profile?.full_name || "Expert en IA et automatisation";

    const vaultContext = await buildFullVaultContext(user.id);

    const basePrompt = buildInstagramProfilePrompt(
      marketContext,
      offerContext,
      brandContext,
    );
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const aiModel = getModelForGeneration("optimize_instagram");

    const { data: result, usage: aiUsage } = await generateJSON<InstagramProfileResult>({
      model: aiModel,
      prompt,
      maxTokens: 4096,
    });

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.content_strategy");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.content_strategy");
    } catch {}

    incrementAIUsage(user.id, { generationType: "optimize_instagram", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de l'optimisation du profil Instagram" },
      { status: 500 },
    );
  }
}
