import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildCompetitorAnalysisPrompt,
  type CompetitorAnalysisResult,
} from "@/lib/ai/prompts/competitor-analysis";
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
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Rate limiting
    const rl = rateLimit(user.id, "analyze-competitors", { limit: 5, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requetes. Reessaie dans quelques secondes." },
        { status: 429 }
      );
    }

    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de generations IA atteinte", usage },
        { status: 403 }
      );
    }


    const { market_analysis_id } = (await req.json()) as {
      market_analysis_id: string;
    };

    if (!market_analysis_id) {
      return NextResponse.json(
        { error: "market_analysis_id requis" },
        { status: 400 }
      );
    }

    // Recuperer l'analyse de marche
    const { data: marketAnalysis, error: maError } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("id", market_analysis_id)
      .eq("user_id", user.id)
      .single();

    if (maError || !marketAnalysis) {
      return NextResponse.json(
        { error: "Analyse de marche introuvable" },
        { status: 404 }
      );
    }

    // Recuperer le profil utilisateur pour les competences
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .single();

    const [basePrompt, vaultContext] = await Promise.all([
      Promise.resolve(buildCompetitorAnalysisPrompt({
        market_name: marketAnalysis.market_name,
        market_description: marketAnalysis.market_description,
        recommended_positioning: marketAnalysis.recommended_positioning,
        country: marketAnalysis.country,
        language: marketAnalysis.language,
        user_skills: profile?.skills ?? undefined,
      })),
      buildFullVaultContext(user.id),
    ]);
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const result = await generateJSON<CompetitorAnalysisResult>({
      prompt,
      maxTokens: 8192,
      temperature: 0.7,
    });

    // Sauvegarder chaque concurrent dans la table competitors
    for (const competitor of result.competitors) {
      await supabase.from("competitors").insert({
        user_id: user.id,
        market_analysis_id,
        competitor_name: competitor.name,
        positioning: competitor.positioning,
        pricing: competitor.pricing_estimate,
        strengths: competitor.strengths,
        weaknesses: competitor.weaknesses,
        gap_opportunity: competitor.differentiation,
        source: "ai_analysis",
      });
    }

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.competitors"); } catch {}
    try { await notifyGeneration(user.id, "generation.competitors"); } catch {}

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de l'analyse concurrentielle" },
      { status: 500 }
    );
  }
}
