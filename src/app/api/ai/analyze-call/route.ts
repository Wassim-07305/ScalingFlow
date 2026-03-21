import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { callAnalysisPrompt } from "@/lib/ai/prompts/call-analysis";
import { awardXP } from "@/lib/gamification/xp-engine";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getJourney, buildJourneySummary } from "@/lib/services/attribution-engine";

export const maxDuration = 120;

const MAX_TRANSCRIPT_LENGTH = 30_000;

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
    const rl = await rateLimit(user.id, "analyze-call", {
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

    const {
      transcript: rawTranscript,
      call_type,
      recording_url,
      prospect_origin,
      analysis_focus,
      call_result,
      lead_id,
    } = await req.json();

    const transcript =
      typeof rawTranscript === "string"
        ? rawTranscript.slice(0, MAX_TRANSCRIPT_LENGTH)
        : "";

    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: "Le transcript doit contenir au moins 50 caractères" },
        { status: 400 },
      );
    }

    // Get user's latest offer for context
    const { data: offer } = await supabase
      .from("offers")
      .select("offer_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch lead attribution journey if lead_id provided
    let attributionContext: string | undefined;
    let journeySummary: string | undefined;
    let leadChannelInfo: { source_channel?: string; source_campaign?: string; source_creative?: string } = {};

    if (lead_id) {
      try {
        const journey = await getJourney(supabase, { leadId: lead_id });
        if (journey.length > 0) {
          journeySummary = buildJourneySummary(journey);
          const firstTp = journey[0];
          const lastTp = journey[journey.length - 1];
          leadChannelInfo = {
            source_channel: firstTp.channel,
            source_campaign: firstTp.campaign || undefined,
            source_creative: firstTp.content || firstTp.meta_ad_id || undefined,
          };
          attributionContext = `- Parcours complet : ${journeySummary}
- Canal d'acquisition (first-touch) : ${firstTp.channel} (${firstTp.source})
- Dernier touchpoint : ${lastTp.channel} (${lastTp.event_type})
- Nombre de touchpoints : ${journey.length}
${firstTp.campaign ? `- Campagne : ${firstTp.campaign}` : ""}
${firstTp.content ? `- Créative : ${firstTp.content}` : ""}`;
        }
      } catch {
        // Non-blocking — don't fail the analysis if attribution fetch fails
      }
    }

    const prompt = callAnalysisPrompt(transcript, {
      offer_name: offer?.offer_name || undefined,
      call_type: call_type || "Discovery call",
      recording_url: recording_url || undefined,
      prospect_origin: prospect_origin || undefined,
      analysis_focus: analysis_focus || "global",
      call_result: call_result || undefined,
      attribution_context: attributionContext,
    });

    const aiModel = getModelForGeneration("call_analysis");

    const { data: result, usage: aiUsage } = await generateJSON({ model: aiModel, prompt, maxTokens: 6000 });

    // Build metadata with enriched data (including transcript for history reload)
    const metadata: Record<string, unknown> = {
      original_type: "call_analysis",
      call_type: call_type || "discovery",
      transcript: transcript.slice(0, 50_000),
    };
    if (recording_url) metadata.recording_url = recording_url;
    if (prospect_origin) metadata.prospect_origin = prospect_origin;
    if (analysis_focus) metadata.analysis_focus = analysis_focus;
    if (call_result) metadata.call_result = call_result;
    if (journeySummary) metadata.journey_summary = journeySummary;
    if (leadChannelInfo.source_channel) metadata.source_channel = leadChannelInfo.source_channel;
    if (leadChannelInfo.source_campaign) metadata.source_campaign = leadChannelInfo.source_campaign;
    if (leadChannelInfo.source_creative) metadata.source_creative = leadChannelInfo.source_creative;

    // Save to sales_assets for history
    await supabase.from("sales_assets").insert({
      user_id: user.id,
      offer_id: null,
      asset_type: "call_analysis",
      lead_id: lead_id || null,
      title: `Analyse call — ${call_type || "Discovery"} — ${new Date().toLocaleDateString("fr-FR")}`,
      content: JSON.stringify(result),
      ai_raw_response: result,
      metadata,
      status: "draft",
    });

    try {
      await awardXP(user.id, "generation.call_analysis");
    } catch {
      /* ignore XP errors */
    }

    const responseData =
      typeof result === "object" && result !== null ? (result as Record<string, unknown>) : {};

    incrementAIUsage(user.id, { generationType: "call_analysis", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json({
      ...responseData,
      // Attribution enrichment (present only when lead_id was provided)
      ...(lead_id && {
        attribution: {
          source_channel: leadChannelInfo.source_channel,
          source_campaign: leadChannelInfo.source_campaign,
          source_creative: leadChannelInfo.source_creative,
          journey_summary: journeySummary,
        },
      }),
    });
  } catch (error) {
    console.error("Call analysis error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse" },
      { status: 500 },
    );
  }
}
