import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { awardXP } from "@/lib/gamification/xp-engine";

export const maxDuration = 60;

interface CompetitiveAdvantageResult {
  overall_score: number;
  top_niche: string;
  unique_positioning: string;
  key_differentiators: string[];
  niches: Array<{
    niche: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
    opportunity: string;
    recommendation: string;
  }>;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "skills, vault_skills, situation, experience_level, industries, objectives, vault_analysis, vault_extraction, formations",
      )
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 },
      );
    }

    const prompt = `Tu es un expert en strategie de positionnement et analyse concurrentielle pour les freelances et consultants.

## Profil a analyser
- Competences : ${(profile.skills as string[])?.join(", ") || "Non renseignees"}
- Competences detaillees : ${JSON.stringify(profile.vault_skills || {})}
- Situation : ${profile.situation || "Non renseignee"}
- Niveau : ${profile.experience_level || "Non renseigne"}
- Industries cibles : ${(profile.industries as string[])?.join(", ") || "Non renseignees"}
- Objectifs : ${(profile.objectives as string[])?.join(", ") || "Non renseignes"}
- Formations : ${(profile.formations as string[])?.join(", ") || "Non renseignees"}
- Analyse vault : ${typeof profile.vault_analysis === "string" ? profile.vault_analysis : JSON.stringify(profile.vault_analysis || {})}
- Extraction expertise : ${typeof profile.vault_extraction === "string" ? profile.vault_extraction : JSON.stringify(profile.vault_extraction || {})}

## Ta mission
Analyse ce profil et calcule un score d'avantage competitif pour 4-6 niches pertinentes. Pour chaque niche, evalue les forces, faiblesses, opportunites et donne une recommandation.

## Format de reponse
Reponds UNIQUEMENT en JSON valide :
{
  "overall_score": 75,
  "top_niche": "Nom de la meilleure niche",
  "unique_positioning": "Phrase de positionnement unique basee sur le profil",
  "key_differentiators": ["Differenciateur 1", "Differenciateur 2", "Differenciateur 3"],
  "niches": [
    {
      "niche": "Nom de la niche",
      "score": 85,
      "strengths": ["Force 1", "Force 2"],
      "weaknesses": ["Faiblesse 1"],
      "opportunity": "Description de l'opportunite dans cette niche",
      "recommendation": "Recommandation actionnable"
    }
  ]
}`;

    const aiModel = getModelForGeneration("competitive_advantage");

    const { data: result, usage: aiUsage } = await generateJSON<CompetitiveAdvantageResult>({
      model: aiModel,
      prompt,
      maxTokens: 4096,
    });

    // Save to profile
    await supabase
      .from("profiles")
      .update({ competitive_advantage: result })
      .eq("id", user.id);

    try {
      await awardXP(user.id, "generation.vault_analysis");
    } catch {
      /* ignore xp errors */
    }

    incrementAIUsage(user.id, { generationType: "competitive_advantage", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    console.error("Competitive advantage error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse" },
      { status: 500 },
    );
  }
}
