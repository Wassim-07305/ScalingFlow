import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildCompetitorAnalysisPrompt,
  type CompetitorAnalysisResult,
} from "@/lib/ai/prompts/competitor-analysis";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  isFirecrawlConfigured,
  scrapeUrl,
  searchAndScrape,
  type ScrapeResult,
} from "@/lib/scraping/firecrawl";
import {
  isApifyConfigured,
  crawlWebsite,
  scrapeGoogleTrends,
  scrapeMetaAdLibrary,
  screenshotWebsite,
  detectTechStack,
  type WebCrawlResult,
  type GoogleTrendsResult,
  type MetaAdResult,
  type WebsiteScreenshot,
  type TechStackResult,
} from "@/lib/scraping/apify";

export const maxDuration = 60;

function buildMetaAdsContext(ads: MetaAdResult[]): string {
  let ctx = `\n## DONNÉES RÉELLES META AD LIBRARY (${ads.length} annonces actives)\n`;
  ctx += `Ces annonces sont actuellement actives sur Meta (Facebook/Instagram).\n\n`;
  for (const ad of ads) {
    ctx += `- **${ad.brand || "Inconnu"}** | Format: ${ad.format} | Plateformes: ${ad.platforms.join(", ")}\n`;
    if (ad.headline) ctx += `  Titre: "${ad.headline.slice(0, 100)}"\n`;
    if (ad.body) ctx += `  Corps: "${ad.body.slice(0, 200)}"\n`;
    if (ad.ctaText)
      ctx += `  CTA: "${ad.ctaText}" → ${ad.ctaUrl?.slice(0, 80) || "N/A"}\n`;
    ctx += "\n";
  }
  ctx += `IMPORTANT: Utilise ces données pour renseigner les ad_insights de chaque concurrent identifié.\n`;
  return ctx;
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
    const rl = await rateLimit(user.id, "analyze-competitors", {
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

    const { market_analysis_id, competitor_urls } = (await req.json()) as {
      market_analysis_id: string;
      competitor_urls?: string[];
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

    // Récupérer le profil utilisateur pour les competences
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .single();

    // Phase 1 : Scraping réel via Apify (prioritaire) puis Firecrawl (fallback)
    let scrapedContext = "";
    let sourceUrls: string[] = [];
    let dataSource:
      | "apify_crawl"
      | "google_trends"
      | "web_scraping"
      | "ai_only" = "ai_only";
    let trendsData: GoogleTrendsResult[] = [];

    const apifyReady = isApifyConfigured();
    const firecrawlReady = isFirecrawlConfigured();
    let metaAdsContext = "";

    // --- Apify : crawl des URLs concurrents + Google Trends ---
    if (apifyReady) {
      try {
        const apifyPromises: Promise<unknown>[] = [];

        // Crawl des URLs de concurrents (max 3 en parallèle)
        const urlsToCrawl = (competitor_urls || [])
          .filter((u) => u.startsWith("http"))
          .slice(0, 3);
        if (urlsToCrawl.length > 0) {
          for (const url of urlsToCrawl) {
            apifyPromises.push(
              crawlWebsite(url).then((result: WebCrawlResult | null) => {
                if (result) {
                  scrapedContext += `### Source Apify : ${result.title}\nURL : ${result.url}\n${result.markdown.slice(0, 4000)}\n\n---\n\n`;
                  if (!sourceUrls.includes(result.url))
                    sourceUrls.push(result.url);
                  dataSource = "apify_crawl";
                }
              }),
            );
          }
        }

        // Google Trends pour les noms de concurrents
        const competitorNames = (competitor_urls || [])
          .map((u) => {
            try {
              const hostname = new URL(u).hostname
                .replace("www.", "")
                .split(".")[0];
              return hostname.charAt(0).toUpperCase() + hostname.slice(1);
            } catch {
              return "";
            }
          })
          .filter(Boolean)
          .slice(0, 5);

        // Ajouter le nom du marché comme terme de tendance
        const trendsTerms =
          competitorNames.length > 0
            ? [marketAnalysis.market_name, ...competitorNames].slice(0, 5)
            : [marketAnalysis.market_name];

        apifyPromises.push(
          scrapeGoogleTrends({
            terms: trendsTerms,
            geo:
              marketAnalysis.country === "France"
                ? "FR"
                : marketAnalysis.country || "FR",
            maxWaitSecs: 30,
          }).then((results: GoogleTrendsResult[]) => {
            if (results.length > 0) {
              trendsData = results;
              scrapedContext += `\n## TENDANCES GOOGLE TRENDS (données réelles)\n`;
              for (const trend of results) {
                const avgValue =
                  trend.timelineData.length > 0
                    ? Math.round(
                        trend.timelineData.reduce((s, d) => s + d.value, 0) /
                          trend.timelineData.length,
                      )
                    : 0;
                scrapedContext += `- **${trend.term}** : intérêt moyen ${avgValue}/100`;
                if (trend.relatedQueries.length > 0) {
                  scrapedContext += ` | Requêtes liées : ${trend.relatedQueries.slice(0, 5).join(", ")}`;
                }
                scrapedContext += "\n";
              }
              scrapedContext += "\n";
              if (dataSource === "ai_only") dataSource = "google_trends";
            }
          }),
        );

        // Meta Ad Library — annonces actives sur ce marché
        apifyPromises.push(
          scrapeMetaAdLibrary({
            searchQuery: marketAnalysis.market_name,
            country:
              marketAnalysis.country === "France"
                ? "FR"
                : marketAnalysis.country || "FR",
            limit: 15,
            maxWaitSecs: 30,
          })
            .then((ads: MetaAdResult[]) => {
              if (ads.length > 0) {
                metaAdsContext = buildMetaAdsContext(ads);
                if (dataSource === "ai_only") dataSource = "apify_crawl";
              }
            })
            .catch((err) => {
              console.warn(
                "[analyze-competitors] Meta Ad Library failed (non-blocking):",
                err,
              );
            }),
        );

        await Promise.all(apifyPromises);
      } catch (err) {
        console.warn("Apify scraping failed for analyze-competitors:", err);
      }
    }

    // --- Fallback Firecrawl ---
    if (firecrawlReady && dataSource === "ai_only") {
      try {
        const scrapedPages: ScrapeResult[] = [];

        // Scraper les URLs de concurrents fournies par l'utilisateur
        if (competitor_urls && competitor_urls.length > 0) {
          const scrapePromises = competitor_urls
            .slice(0, 5)
            .map((url) => scrapeUrl(url));
          const scrapeResults = await Promise.all(scrapePromises);
          for (const scraped of scrapeResults) {
            if (scraped) {
              scrapedPages.push(scraped);
              sourceUrls.push(scraped.url);
            }
          }
        }

        // Recherche complémentaire sur le marché
        const searchQuery = `${marketAnalysis.market_name} concurrents avis ${marketAnalysis.country || "France"}`;
        const { results, scrapedContent } = await searchAndScrape(
          searchQuery,
          3,
        );

        for (const r of results) {
          if (!sourceUrls.includes(r.url)) sourceUrls.push(r.url);
        }
        for (const page of scrapedContent) {
          if (!sourceUrls.includes(page.url)) {
            scrapedPages.push(page);
            sourceUrls.push(page.url);
          }
        }

        // Construire le contexte scrapé (max 8 pages)
        if (scrapedPages.length > 0) {
          const pages = scrapedPages.slice(0, 8);
          scrapedContext += pages
            .map((p) => `### Source : ${p.title}\nURL : ${p.url}\n${p.content}`)
            .join("\n\n---\n\n");
          dataSource = "web_scraping";
        }
      } catch (err) {
        console.warn(
          "Firecrawl scraping failed for analyze-competitors, falling back to AI-only:",
          err,
        );
        scrapedContext = "";
        sourceUrls = [];
      }
    }

    // Phase 2 : Screenshots & Tech Stack (bonus, non-blocking)
    let screenshots: { url: string; screenshotUrl: string }[] = [];
    let techStacks: {
      url: string;
      technologies: { name: string; category: string }[];
    }[] = [];

    if (apifyReady) {
      const urlsForBonus = (competitor_urls || [])
        .filter((u) => u.startsWith("http"))
        .slice(0, 3);
      if (urlsForBonus.length > 0) {
        try {
          const [screenshotResults, techStackResults] =
            await Promise.allSettled([
              Promise.allSettled(urlsForBonus.map((u) => screenshotWebsite(u))),
              Promise.allSettled(urlsForBonus.map((u) => detectTechStack(u))),
            ]);

          // Collect screenshot results
          if (screenshotResults.status === "fulfilled") {
            for (const r of screenshotResults.value) {
              if (r.status === "fulfilled" && r.value) {
                screenshots.push({
                  url: r.value.url,
                  screenshotUrl: r.value.screenshotUrl,
                });
              }
            }
          }

          // Collect tech stack results
          if (techStackResults.status === "fulfilled") {
            for (const r of techStackResults.value) {
              if (
                r.status === "fulfilled" &&
                r.value &&
                r.value.technologies.length > 0
              ) {
                techStacks.push({
                  url: r.value.url,
                  technologies: r.value.technologies,
                });
              }
            }
          }
        } catch (err) {
          console.warn(
            "Screenshot/TechStack bonus phase failed (non-blocking):",
            err,
          );
        }
      }
    }

    // Merge all scraped context (website crawl + trends + Meta Ads)
    const fullScrapedContext = [scrapedContext, metaAdsContext]
      .filter(Boolean)
      .join("\n");

    const [basePrompt, vaultContext] = await Promise.all([
      Promise.resolve(
        buildCompetitorAnalysisPrompt(
          {
            market_name: marketAnalysis.market_name,
            market_description: marketAnalysis.market_description,
            recommended_positioning: marketAnalysis.recommended_positioning,
            country: marketAnalysis.country,
            language: marketAnalysis.language,
            user_skills: profile?.skills ?? undefined,
          },
          fullScrapedContext || undefined,
        ),
      ),
      buildFullVaultContext(user.id),
    ]);
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const aiModel = getModelForGeneration("competitors");

    const result = await generateJSON<CompetitorAnalysisResult>({
      model: aiModel,
      prompt,
      maxTokens: 8192,
      temperature: 0.7,
    });

    // Sauvegarder chaque concurrent dans la table competitors
    for (const competitor of result.competitors) {
      try {
        await supabase.from("competitors").insert({
          user_id: user.id,
          market_analysis_id,
          competitor_name: competitor.name,
          positioning: competitor.positioning,
          pricing: competitor.pricing_estimate,
          strengths: competitor.strengths,
          weaknesses: competitor.weaknesses,
          gap_opportunity: competitor.differentiation,
          source: "ai_analysis",
        });
      } catch (e) {
        console.warn("analyze-competitors: failed to insert competitor", e);
      }
    }

    // Save full analysis result (with ad/content insights & benchmarks) on market_analyses
    try {
      await supabase
        .from("market_analyses")
        .update({ competitor_analysis: result })
        .eq("id", market_analysis_id);
    } catch (e) {
      console.warn("analyze-competitors: failed to save full analysis", e);
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.competitors");
    } catch (e) {
      console.warn("XP award failed", e);
    }
    try {
      await notifyGeneration(user.id, "generation.competitors");
    } catch (e) {
      console.warn("Notification failed", e);
    }

    incrementAIUsage(user.id, { generationType: "competitors", model: aiModel }).catch(() => {});

    return NextResponse.json({
      ...result,
      sources: sourceUrls.length > 0 ? sourceUrls : undefined,
      scraping_used: dataSource !== "ai_only",
      data_source: dataSource,
      trends_data: trendsData.length > 0 ? trendsData : undefined,
      screenshots: screenshots.length > 0 ? screenshots : undefined,
      tech_stacks: techStacks.length > 0 ? techStacks : undefined,
    });
  } catch (error) {
    console.error("[analyze-competitors] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse concurrentielle" },
      { status: 500 },
    );
  }
}
