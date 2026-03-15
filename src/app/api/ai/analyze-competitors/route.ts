import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
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
    const rl = await rateLimit(user.id, "analyze-competitors", { limit: 5, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 }
      );
    }

    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 }
      );
    }


    const { market_analysis_id, competitor_urls } = (await req.json()) as {
      market_analysis_id: string;
      competitor_urls?: string[];
    };

    if (!market_analysis_id) {
      return NextResponse.json(
        { error: "market_analysis_id requis" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Récupérer le profil utilisateur pour les competences
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .single();

    // Phase 1 : Scraping réel via Firecrawl (si configuré)
    let scrapedContext = "";
    let sourceUrls: string[] = [];
    const useRealScraping = isFirecrawlConfigured();

    if (useRealScraping) {
      try {
        const scrapedPages: ScrapeResult[] = [];

        // Scraper les URLs de concurrents fournies par l'utilisateur
        if (competitor_urls && competitor_urls.length > 0) {
          const scrapePromises = competitor_urls.slice(0, 5).map((url) => scrapeUrl(url));
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
        const { results, scrapedContent } = await searchAndScrape(searchQuery, 3);

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
          scrapedContext = pages
            .map((p) => `### Source : ${p.title}\nURL : ${p.url}\n${p.content}`)
            .join("\n\n---\n\n");
        }
      } catch (err) {
        console.warn("Firecrawl scraping failed for analyze-competitors, falling back to AI-only:", err);
        scrapedContext = "";
        sourceUrls = [];
      }
    }

    const [basePrompt, vaultContext] = await Promise.all([
      Promise.resolve(buildCompetitorAnalysisPrompt(
        {
          market_name: marketAnalysis.market_name,
          market_description: marketAnalysis.market_description,
          recommended_positioning: marketAnalysis.recommended_positioning,
          country: marketAnalysis.country,
          language: marketAnalysis.language,
          user_skills: profile?.skills ?? undefined,
        },
        scrapedContext || undefined,
      )),
      buildFullVaultContext(user.id),
    ]);
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const result = await generateJSON<CompetitorAnalysisResult>({
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
    try { await awardXP(user.id, "generation.competitors"); } catch (e) { console.warn("XP award failed", e); }
    try { await notifyGeneration(user.id, "generation.competitors"); } catch (e) { console.warn("Notification failed", e); }

    return NextResponse.json({
      ...result,
      sources: sourceUrls.length > 0 ? sourceUrls : undefined,
      scraping_used: useRealScraping && scrapedContext.length > 0,
    });
  } catch (error) {
    console.error("[analyze-competitors] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse concurrentielle" },
      { status: 500 }
    );
  }
}
