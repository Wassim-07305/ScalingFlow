import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildVaultAnalysisPrompt,
  type VaultData,
  type VaultAnalysis,
} from "@/lib/ai/prompts/vault-analysis";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { rateLimit } from "@/lib/utils/rate-limit";

/** Compare les scores radar entre deux analyses et retourne les deltas */
function computeChanges(
  current: VaultAnalysis,
  previous: VaultAnalysis | null,
): Record<string, number> | null {
  if (!previous?.radar || !current?.radar) return null;
  const changes: Record<string, number> = {};
  for (const key of Object.keys(current.radar) as Array<
    keyof VaultAnalysis["radar"]
  >) {
    const cur = current.radar[key] ?? 0;
    const prev = previous.radar[key] ?? 0;
    changes[key] = cur - prev;
  }
  changes["score_avantage_competitif"] =
    (current.score_avantage_competitif ?? 0) -
    (previous.score_avantage_competitif ?? 0);
  return changes;
}

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
    const rl = await rateLimit(user.id, "analyze-vault", {
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

    const body: VaultData = await req.json();

    // Recuperer l'analyse precedente pour comparaison
    const { data: profileData } = await supabase
      .from("profiles")
      .select("vault_analysis")
      .eq("id", user.id)
      .single();

    const previousAnalysis =
      (profileData?.vault_analysis as VaultAnalysis | null) ?? null;
    const existingHistory: Array<{
      analysis: VaultAnalysis;
      created_at: string;
      changes_since_last: Record<string, number> | null;
    }> = [];

    const { systemPrompt, userPrompt } = buildVaultAnalysisPrompt(body);

    const aiModel = getModelForGeneration("vault_analysis");

    const result = await generateJSON<VaultAnalysis>({
      model: aiModel,
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.7,
    });

    // Calculer les deltas par rapport a l'analyse precedente
    const changesSinceLast = computeChanges(result, previousAnalysis);

    // Construire l'historique (garder les 10 dernieres analyses max)
    const newHistoryEntry = {
      analysis: result,
      created_at: new Date().toISOString(),
      changes_since_last: changesSinceLast,
    };
    const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 10);

    // Sauvegarder l'analyse dans le profil utilisateur
    await supabase
      .from("profiles")
      .update({
        vault_analysis: result,
      })
      .eq("id", user.id);

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.vault_analysis");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.vault_analysis");
    } catch {}

    incrementAIUsage(user.id, { generationType: "vault_analysis", model: aiModel }).catch(() => {});

    return NextResponse.json({
      ...result,
      changes_since_last: changesSinceLast,
      history: updatedHistory.slice(0, 5),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du vault" },
      { status: 500 },
    );
  }
}
