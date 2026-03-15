import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { callAnalysisPrompt } from "@/lib/ai/prompts/call-analysis";
import { awardXP } from "@/lib/gamification/xp-engine";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const {
      transcript,
      call_type,
      recording_url,
      prospect_origin,
      analysis_focus,
      call_result,
    } = await req.json();

    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: "Le transcript doit contenir au moins 50 caractères" },
        { status: 400 }
      );
    }

    // Get user's latest offer for context
    const { data: offer } = await supabase
      .from("offers")
      .select("offer_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const prompt = callAnalysisPrompt(transcript, {
      offer_name: offer?.offer_name || undefined,
      call_type: call_type || "Discovery call",
      recording_url: recording_url || undefined,
      prospect_origin: prospect_origin || undefined,
      analysis_focus: analysis_focus || "global",
      call_result: call_result || undefined,
    });

    const result = await generateJSON({ prompt, maxTokens: 6000 });

    // Build metadata with enriched data
    const metadata: Record<string, unknown> = {
      original_type: "call_analysis",
      call_type: call_type || "discovery",
    };
    if (recording_url) metadata.recording_url = recording_url;
    if (prospect_origin) metadata.prospect_origin = prospect_origin;
    if (analysis_focus) metadata.analysis_focus = analysis_focus;
    if (call_result) metadata.call_result = call_result;

    // Save to sales_assets for history
    await supabase.from("sales_assets").insert({
      user_id: user.id,
      offer_id: null,
      asset_type: "sales_script",
      title: `Analyse call — ${call_type || "Discovery"} — ${new Date().toLocaleDateString("fr-FR")}`,
      content: JSON.stringify(result),
      ai_raw_response: result,
      metadata,
      status: "draft",
    });

    try { await awardXP(user.id, "generation.ads"); } catch { /* ignore XP errors */ }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Call analysis error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse" },
      { status: 500 }
    );
  }
}
