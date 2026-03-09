import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildVaultAnalysisPrompt,
  type VaultData,
  type VaultAnalysis,
} from "@/lib/ai/prompts/vault-analysis";
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
    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de generations IA atteinte", usage },
        { status: 403 }
      );
    }


    const body: VaultData = await req.json();

    const { systemPrompt, userPrompt } = buildVaultAnalysisPrompt(body);

    const result = await generateJSON<VaultAnalysis>({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.7,
    });

    // Sauvegarder l'analyse dans le profil utilisateur
    await supabase
      .from("profiles")
      .update({ vault_analysis: result })
      .eq("id", user.id);

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.vault_analysis"); } catch {}

    return NextResponse.json(result);
  } catch (error) {
    console.error("Vault analysis error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du vault" },
      { status: 500 }
    );
  }
}
