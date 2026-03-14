import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  marketInsightsPrompt,
  type MarketInsightsContext,
  type MarketInsightsResult,
} from "@/lib/ai/prompts/market-insights";
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

    const rl = await rateLimit(user.id, "scrape-insights", {
      limit: 3,
      windowSeconds: 60,
    });
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

    const body: MarketInsightsContext = await req.json();

    if (!body.market || body.market.trim().length < 3) {
      return NextResponse.json(
        { error: "Le marché est requis (min 3 caractères)" },
        { status: 400 }
      );
    }

    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = marketInsightsPrompt(body);

    const result = await generateJSON<MarketInsightsResult>({
      prompt: vaultContext ? basePrompt + "\n" + vaultContext : basePrompt,
      maxTokens: 8192,
      temperature: 0.8,
    });

    // Award XP
    try {
      await awardXP(user.id, "generation.market_analysis");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.market_analysis");
    } catch {}

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur lors de la recherche : ${message}` },
      { status: 500 }
    );
  }
}
