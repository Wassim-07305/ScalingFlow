import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildPersonaForgePrompt,
  type PersonaForgeResult,
  type MarketAnalysisData,
  type VaultContextData,
} from "@/lib/ai/prompts/persona-forge";
import { awardXP } from "@/lib/gamification/xp-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
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

    // Recuperer le profil utilisateur pour le contexte vault
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, vault_skills, expertise_answers, situation, parcours")
      .eq("id", user.id)
      .single();

    const marketData: MarketAnalysisData = {
      market_name: marketAnalysis.market_name,
      market_description: marketAnalysis.market_description,
      problems: marketAnalysis.problems,
      recommended_positioning: marketAnalysis.recommended_positioning,
      target_avatar: marketAnalysis.target_avatar as Record<string, unknown> | null,
      country: marketAnalysis.country,
      language: marketAnalysis.language,
    };

    const vaultData: VaultContextData = {
      skills: profile?.skills ?? undefined,
      vaultSkills: (profile?.vault_skills as VaultContextData["vaultSkills"]) ?? undefined,
      expertiseAnswers: (profile?.expertise_answers as Record<string, string>) ?? undefined,
      situation: profile?.situation ?? undefined,
      parcours: profile?.parcours ?? undefined,
    };

    const prompt = buildPersonaForgePrompt({
      marketAnalysis: marketData,
      vaultData,
    });

    const result = await generateJSON<PersonaForgeResult>({
      prompt,
      maxTokens: 8192,
      temperature: 0.7,
    });

    // Sauvegarder le persona dans market_analyses
    await supabase
      .from("market_analyses")
      .update({ persona: result as unknown as Record<string, unknown> })
      .eq("id", market_analysis_id)
      .eq("user_id", user.id);

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.persona"); } catch {}

    return NextResponse.json(result);
  } catch (error) {
    console.error("Persona generation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du persona" },
      { status: 500 }
    );
  }
}
