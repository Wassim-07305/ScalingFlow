import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildPersonaForgePrompt,
  type PersonaForgeResult,
  type MarketAnalysisData,
  type VaultContextData,
  type YouTubeTranscriptData,
} from "@/lib/ai/prompts/persona-forge";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  isApifyConfigured,
  scrapeYouTubeTranscript,
} from "@/lib/scraping/apify";

export const maxDuration = 120;

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
    const rl = await rateLimit(user.id, "generate-persona", {
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

    const { market_analysis_id, competitors } = (await req.json()) as {
      market_analysis_id: string;
      competitors?: string[];
    };

    if (!market_analysis_id) {
      return NextResponse.json(
        { error: "market_analysis_id requis" },
        { status: 400 },
      );
    }

    // Récupérer l'analyse de marché
    const { data: marketAnalysis, error: maError } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("id", market_analysis_id)
      .eq("user_id", user.id)
      .single();

    if (maError || !marketAnalysis) {
      return NextResponse.json(
        { error: "Analyse de marché introuvable" },
        { status: 404 },
      );
    }

    // Récupérer le profil utilisateur pour le contexte vault
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, vault_skills, expertise_answers, situation, parcours")
      .eq("id", user.id)
      .single();

    const marketData: MarketAnalysisData = {
      market_name: marketAnalysis.market_name,
      market_description: marketAnalysis.market_description,
      problems: marketAnalysis.problems,
      recommended_positioning: marketAnalysis.recommended_positioning,
      target_avatar: marketAnalysis.target_avatar as Record<
        string,
        unknown
      > | null,
      country: marketAnalysis.country,
      language: marketAnalysis.language,
    };

    const vaultData: VaultContextData = {
      skills: profile?.skills ?? undefined,
      vaultSkills:
        (profile?.vault_skills as VaultContextData["vaultSkills"]) ?? undefined,
      expertiseAnswers:
        (profile?.expertise_answers as Record<string, string>) ?? undefined,
      situation: profile?.situation ?? undefined,
      parcours: profile?.parcours ?? undefined,
    };

    // Scraper YouTube transcripts si des concurrents sont fournis et Apify est configuré
    let youtubeTranscripts: YouTubeTranscriptData[] = [];

    if (competitors && competitors.length > 0 && isApifyConfigured()) {
      // Limiter à 10 concurrents max
      const limitedCompetitors = competitors.slice(0, 10);

      const scrapePromises = limitedCompetitors.map(async (competitor) => {
        try {
          // Construire l'URL de recherche YouTube pour ce concurrent
          const isUrl =
            competitor.startsWith("http://") ||
            competitor.startsWith("https://");
          const searchUrl = isUrl
            ? competitor
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(competitor)}+interview+client+témoignage+avis`;

          const result = await scrapeYouTubeTranscript(searchUrl);
          if (result && result.transcript) {
            return {
              competitor: isUrl ? result.channelName || competitor : competitor,
              title: result.title,
              channelName: result.channelName,
              viewCount: result.viewCount,
              transcript: result.transcript,
              url: result.url,
            } satisfies YouTubeTranscriptData;
          }
          return null;
        } catch (err) {
          console.warn(
            `[generate-persona] Erreur scraping YouTube pour "${competitor}":`,
            err,
          );
          return null;
        }
      });

      const results = await Promise.allSettled(scrapePromises);
      youtubeTranscripts = results
        .filter(
          (r): r is PromiseFulfilledResult<YouTubeTranscriptData | null> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value)
        .filter((v): v is YouTubeTranscriptData => v !== null);
    }

    const [basePrompt, vaultContext] = await Promise.all([
      Promise.resolve(
        buildPersonaForgePrompt({
          marketAnalysis: marketData,
          vaultData,
          youtubeTranscripts:
            youtubeTranscripts.length > 0 ? youtubeTranscripts : undefined,
        }),
      ),
      buildFullVaultContext(user.id),
    ]);
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const aiModel = getModelForGeneration("persona");

    const result = await generateJSON<PersonaForgeResult>({
      model: aiModel,
      prompt,
      maxTokens: 6000,
      temperature: 0.7,
    });

    // Sauvegarder le persona dans market_analyses
    await supabase
      .from("market_analyses")
      .update({ persona: result as unknown as Record<string, unknown> })
      .eq("id", market_analysis_id)
      .eq("user_id", user.id);

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.persona");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.persona");
    } catch {}

    incrementAIUsage(user.id, { generationType: "persona", model: aiModel }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la génération du persona" },
      { status: 500 },
    );
  }
}
