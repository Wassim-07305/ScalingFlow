import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { rateLimit } from "@/lib/utils/rate-limit";
import { generateJSON } from "@/lib/ai/generate";
import { awardXP } from "@/lib/gamification/xp-engine";
import {
  buildKnowledgeExtractionPrompt,
  type ExtractedKnowledge,
} from "@/lib/ai/prompts/knowledge-extraction";

export const maxDuration = 120;

// ~190K chars ≈ 50K tokens (4 chars/token average)
const MAX_CONTENT_CHARS = 190_000;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Rate limiting — 10 extractions/jour
    const rl = await rateLimit(user.id, "claude-extract", {
      limit: 10,
      windowSeconds: 86400,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Limite d'extractions atteinte pour aujourd'hui." },
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

    const body = await req.json();
    const { content, api_key } = body as {
      content: string;
      api_key?: string;
    };

    if (!content || typeof content !== "string" || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Contenu trop court ou invalide (minimum 50 caractères)." },
        { status: 400 },
      );
    }

    // Validate api_key in-memory if provided (NEVER persist it here)
    if (api_key && typeof api_key === "string" && api_key.startsWith("sk-ant-")) {
      try {
        const testRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1,
            messages: [{ role: "user", content: "test" }],
          }),
        });
        if (!testRes.ok && testRes.status === 401) {
          return NextResponse.json(
            { error: "Clé API Anthropic invalide." },
            { status: 401 },
          );
        }
      } catch {
        // Network error — continue with platform key
      }
    }

    // Trim content if over limit
    const trimmedContent =
      content.length > MAX_CONTENT_CHARS
        ? content.slice(0, MAX_CONTENT_CHARS) +
          "\n\n[Contenu tronqué à 50 000 tokens]"
        : content;

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "niche, selected_market, vault_extraction, situation",
      )
      .eq("id", user.id)
      .single();

    const offerRes = await supabase
      .from("offers")
      .select("offer_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const userProfile = {
      niche: profile?.niche ?? profile?.selected_market ?? null,
      offer_name: offerRes.data?.offer_name ?? null,
      situation: profile?.situation ?? null,
    };

    const prompt = buildKnowledgeExtractionPrompt(trimmedContent, userProfile);

    const { data: extracted } = await generateJSON<ExtractedKnowledge>({
      prompt,
      maxTokens: 4096,
      temperature: 0.3,
    });

    // Merge with existing vault_extraction if present
    const existingExtraction = profile?.vault_extraction as ExtractedKnowledge | null;
    const merged: ExtractedKnowledge = existingExtraction
      ? {
          frameworks: [
            ...(existingExtraction.frameworks ?? []),
            ...extracted.frameworks,
          ],
          case_studies: [
            ...(existingExtraction.case_studies ?? []),
            ...extracted.case_studies,
          ],
          delivery_process: [
            ...(existingExtraction.delivery_process ?? []),
            ...extracted.delivery_process,
          ],
          objection_responses: [
            ...(existingExtraction.objection_responses ?? []),
            ...extracted.objection_responses,
          ],
          unique_insights: [
            ...(existingExtraction.unique_insights ?? []),
            ...extracted.unique_insights,
          ],
          communication_style:
            extracted.communication_style.tone
              ? extracted.communication_style
              : existingExtraction.communication_style,
        }
      : extracted;

    // Save to vault_extraction
    await supabase
      .from("profiles")
      .update({
        vault_extraction: merged as unknown as Record<string, unknown>,
        vault_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.vault_analysis", {}, 75);
    } catch {}

    return NextResponse.json({
      extracted,
      stats: {
        frameworks: extracted.frameworks?.length ?? 0,
        case_studies: extracted.case_studies?.length ?? 0,
        objection_responses: extracted.objection_responses?.length ?? 0,
        unique_insights: extracted.unique_insights?.length ?? 0,
        delivery_process: extracted.delivery_process?.length ?? 0,
      },
      merged_into_vault: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur extraction : ${message}` },
      { status: 500 },
    );
  }
}
