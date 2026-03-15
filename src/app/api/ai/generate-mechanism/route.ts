import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { uniqueMechanismPrompt, type UniqueMechanismContext } from "@/lib/ai/prompts/unique-mechanism";
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

    const rl = await rateLimit(user.id, "generate-mechanism", { limit: 5, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 }
      );
    }

    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 }
      );
    }

    const body: UniqueMechanismContext = await req.json();
    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = uniqueMechanismPrompt(body);

    const result = await generateJSON<{
      mechanisms: {
        name: string;
        tagline: string;
        problem: string;
        root_cause: string;
        solution: string[];
        evidence: string[];
        uniqueness: string;
        elevator_pitch: string;
        score: number;
      }[];
      recommendation: string;
      recommended_index: number;
    }>({
      prompt: vaultContext ? basePrompt + "\n" + vaultContext : basePrompt,
      maxTokens: 4096,
      temperature: 0.7,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur : ${message}` },
      { status: 500 }
    );
  }
}
