import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  guaranteeGeneratorPrompt,
  type GuaranteeContext,
  type GuaranteeResult,
} from "@/lib/ai/prompts/guarantee-generator";
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

    const rl = await rateLimit(user.id, "generate-guarantee", {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 },
      );
    }

    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 },
      );
    }

    const body: GuaranteeContext = await req.json();
    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = guaranteeGeneratorPrompt(body);

    const aiModel = getModelForGeneration("guarantee");

    const result = await generateJSON<GuaranteeResult>({
      model: aiModel,
      prompt: vaultContext ? basePrompt + "\n" + vaultContext : basePrompt,
      maxTokens: 4096,
      temperature: 0.7,
    });

    incrementAIUsage(user.id, { generationType: "guarantee", model: aiModel }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Erreur : ${message}` }, { status: 500 });
  }
}
