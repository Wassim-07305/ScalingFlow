import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildSchwartzAnalysisPrompt,
  type SchwartzAnalysisInput,
  type SchwartzAnalysisResult,
} from "@/lib/ai/prompts/schwartz-analysis";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
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
    const rl = await rateLimit(user.id, "analyze-schwartz", {
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
    const { market_analysis_id } = body;

    if (!market_analysis_id) {
      return NextResponse.json(
        { error: "market_analysis_id requis" },
        { status: 400 },
      );
    }

    // Get the market analysis
    const { data: marketAnalysis, error: maError } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("id", market_analysis_id)
      .eq("user_id", user.id)
      .single();

    if (maError || !marketAnalysis) {
      return NextResponse.json(
        { error: "Analyse de marché introuvable" },
        { status: 404 },
      );
    }

    // Build the prompt input
    const promptInput: SchwartzAnalysisInput = {
      market_name: marketAnalysis.market_name,
      market_description: marketAnalysis.market_description,
      problems: marketAnalysis.problems,
      recommended_positioning: marketAnalysis.recommended_positioning,
      country: marketAnalysis.country,
    };

    const prompt = buildSchwartzAnalysisPrompt(promptInput);

    const aiModel = getModelForGeneration("schwartz");

    const { data: result, usage: aiUsage } = await generateJSON<SchwartzAnalysisResult>({
      model: aiModel,
      prompt,
      maxTokens: 2048,
      temperature: 0.5,
    });

    // Save the Schwartz analysis to the market analysis record
    await supabase
      .from("market_analyses")
      .update({
        schwartz_analysis: result,
      })
      .eq("id", market_analysis_id);

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.market_analysis");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.market_analysis");
    } catch {}

    incrementAIUsage(user.id, { generationType: "schwartz", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur analyse Schwartz : ${message}` },
      { status: 500 },
    );
  }
}
