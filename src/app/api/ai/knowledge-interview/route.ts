import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { generateText, generateJSON } from "@/lib/ai/generate";
import { awardXP } from "@/lib/gamification/xp-engine";
import {
  buildKnowledgeExtractionPrompt,
  buildInterviewNextQuestionPrompt,
  DEFAULT_INTERVIEW_QUESTIONS,
  INTERVIEW_QUESTIONS_COUNT,
  type ExtractedKnowledge,
} from "@/lib/ai/prompts/knowledge-extraction";

export const maxDuration = 120;

interface InterviewState {
  status: "in_progress" | "completed";
  current_question: number;
  answers: Record<number, string>;
  started_at: string;
  updated_at: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action, answer } = body as {
      action: "start" | "answer" | "resume" | "finalize";
      answer?: string;
    };

    // Fetch current profile + interview state
    const [profileRes, offerRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("interview_state, niche, selected_market, situation")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("offers")
        .select("offer_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const profile = profileRes.data;
    const userProfile = {
      niche: profile?.niche ?? profile?.selected_market ?? null,
      offer_name: offerRes.data?.offer_name ?? null,
      situation: profile?.situation ?? null,
    };

    let state: InterviewState = (profile?.interview_state as InterviewState) ?? {
      status: "in_progress",
      current_question: 0,
      answers: {},
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // === START ===
    if (action === "start") {
      state = {
        status: "in_progress",
        current_question: 0,
        answers: {},
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabase
        .from("profiles")
        .update({ interview_state: state as unknown as Record<string, unknown> })
        .eq("id", user.id);

      return NextResponse.json({
        state,
        question: DEFAULT_INTERVIEW_QUESTIONS[0],
        question_index: 0,
        total_questions: INTERVIEW_QUESTIONS_COUNT,
      });
    }

    // === RESUME ===
    if (action === "resume") {
      if (!state || state.status === "completed") {
        return NextResponse.json({ completed: true, state });
      }
      const currentQ = state.current_question ?? 0;
      const question =
        DEFAULT_INTERVIEW_QUESTIONS[currentQ] ??
        DEFAULT_INTERVIEW_QUESTIONS[INTERVIEW_QUESTIONS_COUNT - 1];

      return NextResponse.json({
        state,
        question,
        question_index: currentQ,
        total_questions: INTERVIEW_QUESTIONS_COUNT,
      });
    }

    // === ANSWER ===
    if (action === "answer") {
      if (!answer || typeof answer !== "string" || answer.trim().length < 5) {
        return NextResponse.json(
          { error: "Réponse trop courte (minimum 5 caractères)." },
          { status: 400 },
        );
      }

      const currentQ = state.current_question ?? 0;
      const updatedAnswers = { ...state.answers, [currentQ]: answer.trim() };
      const nextQ = currentQ + 1;
      const isLast = nextQ >= INTERVIEW_QUESTIONS_COUNT;

      const updatedState: InterviewState = {
        ...state,
        answers: updatedAnswers,
        current_question: isLast ? currentQ : nextQ,
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("profiles")
        .update({
          interview_state: updatedState as unknown as Record<string, unknown>,
        })
        .eq("id", user.id);

      if (isLast) {
        return NextResponse.json({
          state: updatedState,
          question: null,
          question_index: nextQ,
          total_questions: INTERVIEW_QUESTIONS_COUNT,
          ready_to_finalize: true,
        });
      }

      // Generate next adaptive question
      let nextQuestion = DEFAULT_INTERVIEW_QUESTIONS[nextQ];
      try {
        const usage = await checkAIUsage(user.id);
        if (usage.allowed) {
          const { text: adaptiveQ } = await generateText({
            prompt: buildInterviewNextQuestionPrompt(
              updatedAnswers,
              nextQ,
              userProfile,
            ),
            maxTokens: 200,
            temperature: 0.6,
          });
          if (adaptiveQ && adaptiveQ.trim().length > 10) {
            nextQuestion = adaptiveQ.trim();
          }
        }
      } catch {
        // Fallback to default question
      }

      return NextResponse.json({
        state: updatedState,
        question: nextQuestion,
        question_index: nextQ,
        total_questions: INTERVIEW_QUESTIONS_COUNT,
        ready_to_finalize: false,
      });
    }

    // === FINALIZE ===
    if (action === "finalize") {
      const usage = await checkAIUsage(user.id);
      if (!usage.allowed) {
        return NextResponse.json(
          { error: "Limite de générations IA atteinte", usage },
          { status: 403 },
        );
      }

      const answersText = Object.entries(state.answers)
        .map(
          ([idx, ans]) =>
            `**${DEFAULT_INTERVIEW_QUESTIONS[Number(idx)] ?? `Question ${Number(idx) + 1}`}**\n${ans}`,
        )
        .join("\n\n");

      const aiModel = getModelForGeneration("knowledge_extract");

      const { data: extracted, usage: aiUsage } = await generateJSON<ExtractedKnowledge>({
        model: aiModel,
        prompt: buildKnowledgeExtractionPrompt(answersText, userProfile),
        maxTokens: 4096,
        temperature: 0.3,
      });

      const finalState: InterviewState = {
        ...state,
        status: "completed",
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("profiles")
        .update({
          interview_state: finalState as unknown as Record<string, unknown>,
          vault_extraction: extracted as unknown as Record<string, unknown>,
          vault_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // Award XP (non-blocking)
      try {
        await awardXP(user.id, "generation.vault_analysis", {}, 100);
      } catch {}

      incrementAIUsage(user.id, { generationType: "knowledge_extract", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

      return NextResponse.json({
        state: finalState,
        extracted,
        stats: {
          frameworks: extracted.frameworks?.length ?? 0,
          case_studies: extracted.case_studies?.length ?? 0,
          objection_responses: extracted.objection_responses?.length ?? 0,
          unique_insights: extracted.unique_insights?.length ?? 0,
          delivery_process: extracted.delivery_process?.length ?? 0,
        },
        vault_updated: true,
      });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur interview : ${message}` },
      { status: 500 },
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("interview_state")
      .eq("id", user.id)
      .maybeSingle();

    const state = profile?.interview_state as InterviewState | null;

    if (!state || state.status !== "in_progress") {
      return NextResponse.json({ state: null, in_progress: false });
    }

    const currentQ = state.current_question ?? 0;
    return NextResponse.json({
      state,
      in_progress: true,
      question: DEFAULT_INTERVIEW_QUESTIONS[currentQ],
      question_index: currentQ,
      total_questions: INTERVIEW_QUESTIONS_COUNT,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
