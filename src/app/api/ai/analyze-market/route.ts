import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  marketAnalysisPrompt,
  type MarketAnalysisContext,
} from "@/lib/ai/prompts/market-analysis";
import type { MarketAnalysisResult } from "@/types/ai";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  isApifyConfigured,
  scrapeGoogleMapsReviews,
  scrapeTrustpilotReviews,
  type GoogleMapsReview,
  type TrustpilotReview,
} from "@/lib/scraping/apify";

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

    // Rate limiting
    const rl = await rateLimit(user.id, "analyze-market", {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 },
      );
    }

    // Check AI usage limits (skip during onboarding — market analysis is required)
    const { data: prof } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (prof?.onboarding_completed) {
      const usage = await checkAIUsage(user.id);
      if (!usage.allowed) {
        return NextResponse.json(
          { error: "Limite de générations IA atteinte", usage },
          { status: 403 },
        );
      }
    }

    const body = await req.json();
    const {
      competitor_google_maps_urls,
      competitor_trustpilot_urls,
      ...marketContext
    } = body as MarketAnalysisContext & {
      competitor_google_maps_urls?: string[];
      competitor_trustpilot_urls?: string[];
    };

    // -----------------------------------------------------------------------
    // Scrape real customer reviews if Apify configured AND URLs provided
    // -----------------------------------------------------------------------
    let reviewsContext = "";
    const reviewsData: {
      source: string;
      count: number;
      averageRating: number;
    }[] = [];
    const allGoogleReviews: GoogleMapsReview[] = [];
    const allTrustpilotReviews: TrustpilotReview[] = [];

    if (isApifyConfigured()) {
      // Google Maps reviews
      if (
        competitor_google_maps_urls &&
        competitor_google_maps_urls.length > 0
      ) {
        const googlePromises = competitor_google_maps_urls
          .filter((u) => u && u.trim())
          .map((url) =>
            scrapeGoogleMapsReviews({ googleMapsUrl: url, limit: 30 }),
          );
        const googleResults = await Promise.allSettled(googlePromises);

        for (const r of googleResults) {
          if (r.status === "fulfilled" && r.value.length > 0) {
            allGoogleReviews.push(...r.value);
          }
        }

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
      }

      // Trustpilot reviews
      if (competitor_trustpilot_urls && competitor_trustpilot_urls.length > 0) {
        const tpPromises = competitor_trustpilot_urls
          .filter((u) => u && u.trim())
          .map((url) =>
            scrapeTrustpilotReviews({ trustpilotUrl: url, limit: 30 }),
          );
        const tpResults = await Promise.allSettled(tpPromises);

        for (const r of tpResults) {
          if (r.status === "fulfilled" && r.value.length > 0) {
            allTrustpilotReviews.push(...r.value);
          }
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
      }

      // Build verbatims context for the AI prompt
      if (allGoogleReviews.length > 0 || allTrustpilotReviews.length > 0) {
        reviewsContext = "\n\n## VERBATIMS CLIENTS RÉELS DES CONCURRENTS\n";
        reviewsContext +=
          "Voici des avis clients réels des concurrents. Utilise ces verbatims pour identifier les douleurs récurrentes, les frustrations, et les opportunités de différenciation.\n";

        if (allGoogleReviews.length > 0) {
          reviewsContext += "\n### Avis Google Maps\n";
          for (const r of allGoogleReviews.slice(0, 30)) {
            if (r.text) {
              reviewsContext += `- [${r.stars}/5] ${r.text.slice(0, 300)}${r.text.length > 300 ? "..." : ""}\n`;
            }
          }
        }

        if (allTrustpilotReviews.length > 0) {
          reviewsContext += "\n### Avis Trustpilot\n";
          for (const r of allTrustpilotReviews.slice(0, 30)) {
            if (r.text) {
              reviewsContext += `- [${r.rating}/5] ${r.title ? r.title + " — " : ""}${r.text.slice(0, 300)}${r.text.length > 300 ? "..." : ""}\n`;
            }
          }
        }
      }
    }

    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = marketAnalysisPrompt(marketContext);

    const fullPrompt = [basePrompt, reviewsContext, vaultContext]
      .filter(Boolean)
      .join("\n");

    const aiModel = getModelForGeneration("market_analysis");

    const result = await generateJSON<MarketAnalysisResult>({
      model: aiModel,
      prompt: fullPrompt,
      maxTokens: 8192,
      temperature: 0.7,
    });

    // Save each market analysis to the database
    for (let i = 0; i < result.markets.length; i++) {
      const market = result.markets[i];
      try {
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
          country: body.country || null,
          language: body.language || null,
        });
      } catch (insertErr) {
        console.error(
          `[analyze-market] Failed to save market ${i} (${market.name}):`,
          insertErr,
        );
      }
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.market_analysis");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.market_analysis");
    } catch {}

    // Build review verbatims for the UI (grouped by sentiment)
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

    incrementAIUsage(user.id, { generationType: "market_analysis", model: aiModel }).catch(() => {});

    return NextResponse.json({
      ...result,
      reviews_data: reviewsData.length > 0 ? reviewsData : undefined,
      review_verbatims:
        reviewVerbatims.length > 0 ? reviewVerbatims : undefined,
    });
  } catch (error) {
    console.error("[analyze-market] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de marché" },
      { status: 500 },
    );
  }
}
