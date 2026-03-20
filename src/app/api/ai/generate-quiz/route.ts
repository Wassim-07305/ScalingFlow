import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { rateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 60;

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface QuizResult {
  questions: QuizQuestion[];
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

    // Rate limiting
    const rl = await rateLimit(user.id, "generate-quiz", {
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

    const body = await req.json();
    const { moduleId, moduleTitle } = body as {
      moduleId: string;
      moduleTitle: string;
    };

    if (!moduleId || !moduleTitle) {
      return NextResponse.json(
        { error: "moduleId et moduleTitle sont requis" },
        { status: 400 },
      );
    }

    const systemPrompt = `Tu es un formateur expert en business et scaling. Tu crées des quiz pour tester les connaissances des élèves.

INSTRUCTIONS :
- Génère exactement 5 questions à choix multiples en français
- Chaque question doit avoir exactement 4 options
- Les questions doivent être pertinentes pour le module "${moduleTitle}"
- Inclus une explication claire pour chaque bonne réponse
- Les questions doivent tester la compréhension, pas la mémorisation
- Varie la difficulté : 2 faciles, 2 moyennes, 1 difficile
- correct_index est l'index (0-3) de la bonne réponse

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "..."
    }
  ]
}`;

    const aiModel = getModelForGeneration("quiz");

    const { data: result, usage: aiUsage } = await generateJSON<QuizResult>({
      model: aiModel,
      prompt: `Génère un quiz de 5 questions pour le module de formation intitulé : "${moduleTitle}". Les questions doivent couvrir les concepts clés enseignés dans ce module.`,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.8,
    });

    incrementAIUsage(user.id, { generationType: "quiz", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur lors de la génération du quiz : ${errMsg}` },
      { status: 500 },
    );
  }
}
