import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { marketAnalysisPrompt, type OnboardingData } from "@/lib/ai/prompts/market-analysis";
import type { MarketAnalysisResult } from "@/types/ai";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body: OnboardingData = await req.json();

    const result = await generateJSON<MarketAnalysisResult>({
      prompt: marketAnalysisPrompt(body),
      maxTokens: 8192,
      temperature: 0.7,
    });

    // Save each market analysis to the database
    for (let i = 0; i < result.markets.length; i++) {
      const market = result.markets[i];
      await supabase.from("market_analyses").insert({
        user_id: user.id,
        market_name: market.name,
        market_description: market.description,
        problems: market.problems,
        competitors: market.competitors,
        demand_signals: market.demand_signals,
        viability_score: market.viability_score,
        recommended_positioning: market.positioning,
        target_avatar: market.avatar,
        ai_raw_response: market,
        selected: i === result.recommended_market_index,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Market analysis error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de marché" },
      { status: 500 }
    );
  }
}
