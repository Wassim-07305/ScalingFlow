import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { awardXP } from "@/lib/gamification/xp-engine";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  isApifyConfigured,
  scrapeGoogleMapsReviews,
  scrapeTrustpilotReviews,
  type GoogleMapsReview,
  type TrustpilotReview,
} from "@/lib/scraping/apify";

export const maxDuration = 60;

interface VerbatimAnalysis {
  themes: Array<{
    theme: string;
    sentiment: "positif" | "négatif" | "neutre";
    frequency: number;
    quotes: string[];
  }>;
  top_pains: Array<{
    pain: string;
    intensity: "critique" | "forte" | "moderee" | "legere";
    quotes: string[];
  }>;
  top_satisfactions: Array<{
    satisfaction: string;
    quotes: string[];
  }>;
  opportunities: string[];
  summary: string;
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

    const rl = await rateLimit(user.id, "scrape-reviews", {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 },
      );
    }

    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      google_maps_urls,
      trustpilot_urls,
      market_name,
    } = body as {
      google_maps_urls?: string[];
      trustpilot_urls?: string[];
      market_name?: string;
    };

    const validGoogleUrls = (google_maps_urls || []).filter((u) => u?.trim());
    const validTrustpilotUrls = (trustpilot_urls || []).filter((u) => u?.trim());

    if (validGoogleUrls.length === 0 && validTrustpilotUrls.length === 0) {
      return NextResponse.json(
        { error: "Ajoute au moins une URL Google Maps ou Trustpilot." },
        { status: 400 },
      );
    }

    if (!isApifyConfigured()) {
      return NextResponse.json(
        { error: "Le scraping d'avis n'est pas configuré. Contacte le support." },
        { status: 503 },
      );
    }

    // ── Scrape reviews in parallel ──
    const allGoogleReviews: GoogleMapsReview[] = [];
    const allTrustpilotReviews: TrustpilotReview[] = [];

    const [googleResults, tpResults] = await Promise.all([
      validGoogleUrls.length > 0
        ? Promise.allSettled(
            validGoogleUrls.map((url) =>
              scrapeGoogleMapsReviews({ googleMapsUrl: url, limit: 30 }),
            ),
          )
        : Promise.resolve([]),
      validTrustpilotUrls.length > 0
        ? Promise.allSettled(
            validTrustpilotUrls.map((url) =>
              scrapeTrustpilotReviews({ trustpilotUrl: url, limit: 30 }),
            ),
          )
        : Promise.resolve([]),
    ]);

    for (const r of googleResults) {
      if (r.status === "fulfilled" && r.value.length > 0) {
        allGoogleReviews.push(...r.value);
      }
    }

    for (const r of tpResults) {
      if (r.status === "fulfilled" && r.value.length > 0) {
        allTrustpilotReviews.push(...r.value);
      }
    }

    if (allGoogleReviews.length === 0 && allTrustpilotReviews.length === 0) {
      return NextResponse.json({
        review_verbatims: [],
        reviews_data: [],
        analysis: null,
        message: "Aucun avis trouvé pour les URLs fournies.",
      });
    }

    // ── Build reviews context for AI analysis ──
    let reviewsText = "";

    if (allGoogleReviews.length > 0) {
      reviewsText += "## Avis Google Maps\n";
      for (const r of allGoogleReviews.slice(0, 40)) {
        if (r.text) {
          reviewsText += `- [${r.stars}/5] ${r.text.slice(0, 400)}\n`;
        }
      }
    }

    if (allTrustpilotReviews.length > 0) {
      reviewsText += "\n## Avis Trustpilot\n";
      for (const r of allTrustpilotReviews.slice(0, 40)) {
        if (r.text) {
          reviewsText += `- [${r.rating}/5] ${r.title ? r.title + " — " : ""}${r.text.slice(0, 400)}\n`;
        }
      }
    }

    const prompt = `Tu es un expert en analyse de verbatims clients. Analyse les avis clients suivants${market_name ? ` dans le marché "${market_name}"` : ""} et extrais les insights clés.

${reviewsText}

## Ta mission

Analyse ces ${allGoogleReviews.length + allTrustpilotReviews.length} avis et génère :
1. Les **thèmes récurrents** (positifs et négatifs) avec des citations exactes
2. Les **douleurs principales** classées par intensité
3. Les **satisfactions principales**
4. Les **opportunités** de différenciation identifiées
5. Un **résumé** de 2-3 phrases

Réponds UNIQUEMENT en JSON :
{
  "themes": [{ "theme": "...", "sentiment": "positif|négatif|neutre", "frequency": 80, "quotes": ["citation exacte..."] }],
  "top_pains": [{ "pain": "...", "intensity": "critique|forte|moderee|legere", "quotes": ["..."] }],
  "top_satisfactions": [{ "satisfaction": "...", "quotes": ["..."] }],
  "opportunities": ["..."],
  "summary": "..."
}

IMPORTANT : Tout en français. Utilise les MOTS EXACTS des avis dans les citations.`;

    const aiModel = getModelForGeneration("market_analysis");

    const { data: analysis, usage: aiUsage } =
      await generateJSON<VerbatimAnalysis>({
        model: aiModel,
        prompt,
        maxTokens: 4000,
        temperature: 0.5,
      });

    // ── Build response data ──
    const reviewsData = [];

    if (allGoogleReviews.length > 0) {
      const avgRating =
        allGoogleReviews.reduce((sum, r) => sum + (r.stars || 0), 0) /
        allGoogleReviews.length;
      reviewsData.push({
        source: "google_maps",
        count: allGoogleReviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
      });
    }

    if (allTrustpilotReviews.length > 0) {
      const avgRating =
        allTrustpilotReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
        allTrustpilotReviews.length;
      reviewsData.push({
        source: "trustpilot",
        count: allTrustpilotReviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
      });
    }

    const reviewVerbatims = [
      ...allGoogleReviews.map((r) => ({
        source: "google_maps" as const,
        name: r.name,
        text: r.text,
        rating: r.stars,
        date: r.publishedAtDate,
        sentiment:
          r.stars >= 4
            ? ("positif" as const)
            : r.stars <= 2
              ? ("négatif" as const)
              : ("neutre" as const),
      })),
      ...allTrustpilotReviews.map((r) => ({
        source: "trustpilot" as const,
        name: r.author,
        text: r.text,
        rating: r.rating,
        date: r.date,
        sentiment:
          r.rating >= 4
            ? ("positif" as const)
            : r.rating <= 2
              ? ("négatif" as const)
              : ("neutre" as const),
      })),
    ];

    // Award XP (non-blocking)
    awardXP(user.id, "generation.market_analysis").catch(() => {});

    incrementAIUsage(user.id, {
      generationType: "scrape_reviews",
      model: aiModel,
      inputTokens: aiUsage.inputTokens,
      outputTokens: aiUsage.outputTokens,
      cachedTokens: aiUsage.cachedTokens,
      costUsd: estimateCostUSD(
        aiModel,
        aiUsage.inputTokens,
        aiUsage.outputTokens,
        aiUsage.cachedTokens,
      ),
    }).catch(() => {});

    return NextResponse.json({
      review_verbatims: reviewVerbatims,
      reviews_data: reviewsData,
      analysis,
    });
  } catch (error) {
    console.error("[scrape-reviews] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse des avis clients" },
      { status: 500 },
    );
  }
}
