import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { bleedingNeckPainsPrompt } from "@/lib/ai/prompts/bleeding-neck-pains";
import { awardXP } from "@/lib/gamification/xp-engine";

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

    const { market_analysis_id } = (await req.json()) as {
      market_analysis_id: string;
    };

    if (!market_analysis_id) {
      return NextResponse.json(
        { error: "market_analysis_id requis" },
        { status: 400 },
      );
    }

    const { data: analysis, error: fetchError } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("id", market_analysis_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: "Analyse introuvable" },
        { status: 404 },
      );
    }

    const avatar = (analysis.persona as Record<string, unknown>) || {};

    const prompt = bleedingNeckPainsPrompt(
      {
        market_name: analysis.market_name,
        market_description: analysis.market_description || undefined,
        problems: (analysis.problems as string[]) || undefined,
        recommended_positioning: analysis.recommended_positioning || undefined,
      },
      avatar,
    );

    const result = await generateJSON({ prompt, maxTokens: 4096 });

    // Sauvegarder les pains dans l'analyse de marché
    await supabase
      .from("market_analyses")
      .update({ bleeding_neck_pains: result } as Record<string, unknown>)
      .eq("id", market_analysis_id);

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.market");
    } catch {
      // silently ignore XP errors
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Identify pains error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'identification des pains" },
      { status: 500 },
    );
  }
}
