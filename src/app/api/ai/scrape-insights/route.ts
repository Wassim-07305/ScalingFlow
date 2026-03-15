import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  marketInsightsPrompt,
  type MarketInsightsContext,
  type MarketInsightsResult,
} from "@/lib/ai/prompts/market-insights";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  isFirecrawlConfigured,
  searchAndScrape,
  type ScrapeResult,
} from "@/lib/scraping/firecrawl";
import {
  isApifyConfigured,
  scrapeYouTubeTranscript,
  scrapeFacebookPosts,
  scrapeGoogleMapsReviews,
  scrapeTrustpilotReviews,
} from "@/lib/scraping/apify";

// Env vars: FIRECRAWL_API_KEY, APIFY_TOKEN

export const maxDuration = 60;

/**
 * Build search queries relevant to the market/niche for web scraping
 */
function buildSearchQueries(ctx: MarketInsightsContext): string[] {
  const base = ctx.niche || ctx.market;
  const queries = [
    `${base} avis clients problèmes`,
    `${base} forum discussion frustrations`,
    `${base} Reddit expérience témoignage`,
  ];

  if (ctx.targetAvatar) {
    queries.push(`${ctx.targetAvatar} ${ctx.market} difficultés`);
  }

  return queries;
}

/**
 * Format scraped content into a context block for the AI prompt
 */
function buildScrapedContext(scrapedPages: ScrapeResult[]): string {
  if (scrapedPages.length === 0) return "";

  let context = `\n\n## DONNÉES RÉELLES SCRAPÉES DU WEB\n`;
  context += `Les données ci-dessous proviennent de VRAIES pages web scrapées. Utilise-les comme base pour ton analyse.\n`;
  context += `Base ton analyse sur ces données réelles plutôt que de simuler des conversations.\n\n`;

  for (const page of scrapedPages) {
    context += `### Source : ${page.title}\n`;
    context += `URL : ${page.url}\n`;
    context += `Contenu :\n${page.content}\n\n---\n\n`;
  }

  context += `\nIMPORTANT : Utilise les données réelles ci-dessus pour :\n`;
  context += `- Extraire les vraies douleurs, désirs et objections mentionnées\n`;
  context += `- Capturer le langage exact utilisé par les vrais utilisateurs\n`;
  context += `- Identifier les patterns récurrents dans les conversations réelles\n`;
  context += `- Compléter avec des insights supplémentaires si les données scrapées ne couvrent pas tous les aspects demandés\n`;

  return context;
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

    const rl = await rateLimit(user.id, "scrape-insights", {
      limit: 3,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 }
      );
    }

    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 }
      );
    }

    const body: MarketInsightsContext = await req.json();

    if (!body.market || body.market.trim().length < 3) {
      return NextResponse.json(
        { error: "Le marché est requis (min 3 caractères)" },
        { status: 400 }
      );
    }

    // ─── Phase 1: Real web scraping via Firecrawl (if configured) ───
    let scrapedPages: ScrapeResult[] = [];
    let sourceUrls: string[] = [];
    const useRealScraping = isFirecrawlConfigured();

    if (useRealScraping) {
      try {
        const queries = buildSearchQueries(body);

        // Run search queries in parallel (limit to first 2 to stay fast)
        const searchPromises = queries.slice(0, 2).map((q) =>
          searchAndScrape(q, 3)
        );
        const searchResults = await Promise.all(searchPromises);

        // Collect all scraped content, deduplicate by URL
        const seenUrls = new Set<string>();
        for (const { results, scrapedContent } of searchResults) {
          // Track all source URLs
          for (const r of results) {
            if (!seenUrls.has(r.url)) {
              seenUrls.add(r.url);
              sourceUrls.push(r.url);
            }
          }
          // Collect scraped content (deduplicated)
          for (const page of scrapedContent) {
            if (!seenUrls.has(`scraped:${page.url}`)) {
              seenUrls.add(`scraped:${page.url}`);
              scrapedPages.push(page);
            }
          }
        }

        // Keep only top 5 scraped pages to avoid token overflow
        scrapedPages = scrapedPages.slice(0, 5);
      } catch (err) {
        console.warn("Firecrawl scraping failed, falling back to AI-only:", err);
        scrapedPages = [];
        sourceUrls = [];
      }
    }

    // ─── Phase 1b: Apify real scraping (Reddit, YouTube, Reviews) ───
    let apifyContext = "";
    if (isApifyConfigured()) {
      try {
        const apifyResults = await Promise.allSettled([
          // YouTube : chercher des vidéos pertinentes et récupérer les commentaires
          scrapeYouTubeTranscript(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(body.niche || body.market)}+avis+problème`
          ).then((r) => r ? `### YouTube Transcript\n${JSON.stringify(r).slice(0, 3000)}` : ""),

          // Google Maps Reviews
          scrapeGoogleMapsReviews({
            googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(body.niche || body.market)}`,
            limit: 10,
          }).then((reviews) =>
            reviews && reviews.length > 0
              ? `### Google Maps Reviews (${reviews.length} avis)\n${reviews.map((r) => `- ${r.stars}★ : "${r.text}" (${r.name})`).join("\n")}`
              : ""
          ),

          // Trustpilot Reviews
          scrapeTrustpilotReviews({
            trustpilotUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(body.niche || body.market)}`,
            limit: 10,
          }).then((reviews) =>
            reviews && reviews.length > 0
              ? `### Trustpilot Reviews (${reviews.length} avis)\n${reviews.map((r) => `- ${r.rating}★ : "${r.text}" (${r.author})`).join("\n")}`
              : ""
          ),

          // Facebook posts/groups
          scrapeFacebookPosts(
            `https://www.facebook.com/search/posts/?q=${encodeURIComponent((body.niche || body.market) + " problème aide")}`,
            10,
          ).then((posts) =>
            posts && posts.length > 0
              ? `### Facebook Posts (${posts.length} posts)\n${posts.map((p) => `- "${p.text?.slice(0, 200)}" (${p.likes} likes, ${p.comments} commentaires)`).join("\n")}`
              : ""
          ),
        ]);

        const apifyParts = apifyResults
          .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled" && !!r.value)
          .map((r) => r.value)
          .filter(Boolean);

        if (apifyParts.length > 0) {
          apifyContext = `\n\n## DONNÉES SCRAPÉES VIA APIFY (sources réelles)\n${apifyParts.join("\n\n")}`;
        }
      } catch (err) {
        console.warn("[scrape-insights] Apify scraping failed:", err);
      }
    }

    // ─── Phase 2: AI analysis ───
    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = marketInsightsPrompt(body);
    const scrapedContext = buildScrapedContext(scrapedPages);

    const fullPrompt = [
      basePrompt,
      scrapedContext,
      apifyContext,
      vaultContext || "",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await generateJSON<MarketInsightsResult>({
      prompt: fullPrompt,
      maxTokens: 8192,
      temperature: 0.8,
    });

    // Award XP
    try {
      await awardXP(user.id, "generation.market_analysis");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.market_analysis");
    } catch {}

    return NextResponse.json({
      result,
      sources: sourceUrls.length > 0 ? sourceUrls : undefined,
      scraping_used: useRealScraping && scrapedPages.length > 0,
    });
  } catch (error) {
    console.error("[scrape-insights] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
