import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildPersonaForgePrompt,
  type PersonaForgeResult,
  type MarketAnalysisData,
  type VaultContextData,
} from "@/lib/ai/prompts/persona-forge";
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
    const rl = await rateLimit(user.id, "generate-persona", { limit: 5, windowSeconds: 60 });
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


    const { market_analysis_id } = (await req.json()) as {
      market_analysis_id: string;
    };

    if (!market_analysis_id) {
      return NextResponse.json(
        { error: "market_analysis_id requis" },
        { status: 400 }
      );
    }

    // Récupérer l'analyse de marché
    const { data: marketAnalysis, error: maError } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("id", market_analysis_id)
      .eq("user_id", user.id)
      .single();

    if (maError || !marketAnalysis) {
      return NextResponse.json(
        { error: "Analyse de marché introuvable" },
        { status: 404 }
      );
    }

    // Récupérer le profil utilisateur pour le contexte vault
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

    const [basePrompt, vaultContext] = await Promise.all([
      Promise.resolve(buildPersonaForgePrompt({ marketAnalysis: marketData, vaultData })),
      buildFullVaultContext(user.id),
    ]);
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

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
    try { await notifyGeneration(user.id, "generation.persona"); } catch {}

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la génération du persona" },
      { status: 500 }
    );
  }
}
