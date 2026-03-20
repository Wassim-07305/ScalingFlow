import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
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
import { scrapeReddit } from "@/lib/scraping/apify";

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

    const body: MarketInsightsContext = await req.json();

    if (!body.market || body.market.trim().length < 3) {
      return NextResponse.json(
        { error: "Le marché est requis (min 3 caractères)" },
        { status: 400 },
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
        const searchPromises = queries
          .slice(0, 2)
          .map((q) => searchAndScrape(q, 3));
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
        console.warn(
          "Firecrawl scraping failed, falling back to AI-only:",
          err,
        );
        scrapedPages = [];
        sourceUrls = [];
      }
    }

    // ─── Phase 1b: Reddit scraping (public API) ───
    let apifyContext = "";
    {
      try {
        const redditPosts = await scrapeReddit({
          query: `${body.niche || body.market} problème aide conseil`,
          limit: 10,
        });

        if (redditPosts.length > 0) {
          const redditText = redditPosts
            .slice(0, 10)
            .map(
              (p) =>
                `- r/${p.subreddit} | "${p.title.slice(0, 100)}" (${p.score} upvotes)\n  ${p.text?.slice(0, 150) || ""}`,
            )
            .join("\n");

          apifyContext = `\n\n## DONNÉES REDDIT RÉELLES (${redditPosts.length} posts)\n${redditText}`;
        }
      } catch (err) {
        console.warn("[scrape-insights] Reddit scraping failed:", err);
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

    const aiModel = getModelForGeneration("scrape_insights");

    const { data: result, usage: aiUsage } = await generateJSON<MarketInsightsResult>({
      model: aiModel,
      prompt: fullPrompt,
      maxTokens: 6000,
      temperature: 0.8,
    });

    // Award XP
    try {
      await awardXP(user.id, "generation.market_analysis");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.market_analysis");
    } catch {}

    incrementAIUsage(user.id, { generationType: "scrape_insights", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json({
      result,
      sources: sourceUrls.length > 0 ? sourceUrls : undefined,
      scraping_used: useRealScraping && scrapedPages.length > 0,
    });
  } catch (error) {
    console.error("[scrape-insights] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 },
    );
  }
}
