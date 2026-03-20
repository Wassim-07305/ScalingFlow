import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  adCopyPrompt,
  adCopyMassivePrompt,
  type MassiveAdBatch,
} from "@/lib/ai/prompts/ad-copy";
import { adHooksPrompt } from "@/lib/ai/prompts/ad-hooks";
import {
  buildVideoAdScriptPrompt,
  type VideoAdScriptResult,
} from "@/lib/ai/prompts/video-ad-scripts";
import {
  buildDMScriptsPrompt,
  type DMScriptsResult,
} from "@/lib/ai/prompts/dm-scripts";
import { adSpyPrompt } from "@/lib/ai/prompts/ad-spy";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import {
  isFirecrawlConfigured,
  scrapeUrl,
  searchAndScrape,
  type ScrapeResult,
} from "@/lib/scraping/firecrawl";
import {
  isApifyConfigured,
  scrapeMetaAdLibrary,
  type MetaAdResult,
} from "@/lib/scraping/apify";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { rateLimit } from "@/lib/utils/rate-limit";

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
    const rl = await rateLimit(user.id, "generate-ads", {
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

    const aiModel = getModelForGeneration("post_social");

    const body = await req.json();
    const { offerId, adType } = body;

    // Récupérer le profil + vault resources pour le contexte
    const [{ data: profile }, vaultContext] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, skills, target_market, niche, situation, parcours, target_revenue, industries, objectives",
        )
        .eq("id", user.id)
        .single(),
      buildFullVaultContext(user.id),
    ]);

    // Récupérer la dernière offre si offerId pas fourni
    let offer;
    if (offerId) {
      const { data, error: offerError } = await supabase
        .from("offers")
        .select("*, market_analyses(*)")
        .eq("id", offerId)
        .eq("user_id", user.id)
        .single();

      if (offerError || !data) {
        return NextResponse.json(
          { error: "Offre introuvable" },
          { status: 404 },
        );
      }
      offer = data;
    } else {
      const { data } = await supabase
        .from("offers")
        .select("*, market_analyses(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      offer = data;
    }

    const avatar = offer?.market_analyses?.avatar || {};
    const market =
      offer?.market_analyses?.market || profile?.target_market || "";
    const offerContext = offer
      ? `${offer.offer_name} - ${offer.positioning || ""} - ${offer.unique_mechanism || ""}`
      : "Offre de consulting/formation";
    const avatarContext =
      typeof avatar === "object"
        ? JSON.stringify(avatar, null, 2)
        : String(avatar);

    // --- Ad Spy (#43) — avec scraping Apify > Firecrawl > AI-only ---
    if (adType === "ad_spy") {
      const {
        competitor,
        url: competitorUrl,
        industry,
        platform: adPlatform,
      } = body;
      if (!competitor || !industry || !adPlatform) {
        return NextResponse.json(
          { error: "competitor, industry et platform sont requis" },
          { status: 400 },
        );
      }

      let scrapedContext = "";
      let sourceUrls: string[] = [];
      let realAds: MetaAdResult[] = [];
      let scrapingSource: "apify" | "firecrawl" | "ai_only" = "ai_only";

      // Priorité 1 : Apify Meta Ad Library (données réelles des pubs)
      if (isApifyConfigured()) {
        try {
          const searchQuery = competitor.trim();
          const apifyResults = await scrapeMetaAdLibrary({
            searchQuery,
            country: "FR",
            limit: 20,
          });

          if (apifyResults.length > 0) {
            realAds = apifyResults;
            scrapingSource = "apify";

            // Construire un contexte textuel pour enrichir le prompt IA
            scrapedContext = realAds
              .slice(0, 10)
              .map((ad, i) => {
                const parts = [`### Publicité réelle #${i + 1}`];
                if (ad.brand) parts.push(`Marque : ${ad.brand}`);
                if (ad.body) parts.push(`Texte : ${ad.body}`);
                if (ad.headline) parts.push(`Titre : ${ad.headline}`);
                if (ad.ctaText) parts.push(`CTA : ${ad.ctaText}`);
                if (ad.ctaUrl) parts.push(`URL CTA : ${ad.ctaUrl}`);
                if (ad.format) parts.push(`Format : ${ad.format}`);
                if (ad.platforms?.length)
                  parts.push(`Plateformes : ${ad.platforms.join(", ")}`);
                if (ad.startDate) parts.push(`Date de début : ${ad.startDate}`);
                return parts.join("\n");
              })
              .join("\n\n---\n\n");
          }
        } catch (err) {
          console.warn(
            "Apify scraping failed for ad_spy, trying Firecrawl fallback:",
            err,
          );
        }
      }

      // Priorité 2 : Firecrawl web scraping (fallback)
      if (!scrapedContext && isFirecrawlConfigured()) {
        try {
          const scrapedPages: ScrapeResult[] = [];

          // Scraper l'URL du concurrent si fournie
          if (competitorUrl) {
            const scraped = await scrapeUrl(competitorUrl);
            if (scraped) {
              scrapedPages.push(scraped);
              sourceUrls.push(scraped.url);
            }
          }

          // Rechercher des infos complémentaires sur le concurrent
          const searchQuery = `${competitor} ${industry} ${adPlatform === "meta" ? "Facebook ads" : adPlatform} publicité`;
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

          // Construire le contexte scrapé (max 5 pages)
          if (scrapedPages.length > 0) {
            const pages = scrapedPages.slice(0, 5);
            scrapedContext = pages
              .map(
                (p) => `### Source : ${p.title}\nURL : ${p.url}\n${p.content}`,
              )
              .join("\n\n---\n\n");
            scrapingSource = "firecrawl";
          }
        } catch (err) {
          console.warn(
            "Firecrawl scraping failed for ad_spy, falling back to AI-only:",
            err,
          );
          scrapedContext = "";
          sourceUrls = [];
        }
      }

      // Phase finale : Analyse IA (enrichie par les données scrapées si disponibles)
      const prompt =
        adSpyPrompt(
          {
            name: competitor,
            url: competitorUrl,
            industry,
            platform: adPlatform,
          },
          scrapedContext || undefined,
        ) + (vaultContext ? "\n" + vaultContext : "");

      const result = await generateJSON<Record<string, unknown>>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
        temperature: 0.8,
      });

      try {
        await awardXP(user.id, "generation.ads");
      } catch (e) {
        console.warn("XP award failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.ads");
      } catch (e) {
        console.warn("Notification failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({
        adType: "ad_spy",
        result,
        sources: sourceUrls.length > 0 ? sourceUrls : undefined,
        scraping_used: scrapingSource !== "ai_only",
        scraping_source: scrapingSource,
        real_ads: realAds.length > 0 ? realAds : undefined,
      });
    }

    // --- Video Ad Scripts ---
    if (adType === "video_ad") {
      const prompt =
        buildVideoAdScriptPrompt(offerContext, avatarContext) +
        (vaultContext ? "\n" + vaultContext : "");
      const result = await generateJSON<VideoAdScriptResult>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
      });

      // Sauvegarder chaque script video
      for (const script of result.scripts || []) {
        const { error: insertErr } = await supabase
          .from("ad_creatives")
          .insert({
            user_id: user.id,
            creative_type: "video_script",
            ad_copy: script.corps,
            headline: `Video Ad ${script.duree}`,
            hook: script.hook,
            cta: script.cta,
            angle: script.angle,
            status: "draft",
          });
        if (insertErr)
          console.error("generate-ads: failed to save video script", insertErr);
      }

      // Award XP (non-blocking)
      try {
        await awardXP(user.id, "generation.ads");
      } catch (e) {
        console.warn("XP award failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.ads");
      } catch (e) {
        console.warn("Notification failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({ adType: "video_ad", result });
    }

    // --- DM Scripts ---
    if (adType === "dm_scripts") {
      const prompt =
        buildDMScriptsPrompt(offerContext, avatarContext) +
        (vaultContext ? "\n" + vaultContext : "");
      const result = await generateJSON<DMScriptsResult>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
      });

      // Sauvegarder les sequences de prospection
      for (let i = 0; i < (result.prospection || []).length; i++) {
        const seq = result.prospection[i];
        const { error: insertErr } = await supabase
          .from("ad_creatives")
          .insert({
            user_id: user.id,
            creative_type: "dm_script",
            ad_copy: `Opener: ${seq.opener}\n\nFollow-up 1: ${seq.follow_up_1}\n\nFollow-up 2: ${seq.follow_up_2}\n\nClosing: ${seq.closing}`,
            headline: `Sequence DM #${i + 1}`,
            hook: seq.opener,
            cta: seq.closing,
            status: "draft",
          });
        if (insertErr)
          console.error("generate-ads: failed to save DM script", insertErr);
      }

      // Award XP (non-blocking)
      try {
        await awardXP(user.id, "generation.ads");
      } catch (e) {
        console.warn("XP award failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.ads");
      } catch (e) {
        console.warn("Notification failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({ adType: "dm_scripts", result });
    }

    // --- Génération massive : un batch de 15 variations (#45) ---
    if (adType === "massive_batch") {
      const { massiveBatch } = body;
      if (!massiveBatch) {
        return NextResponse.json(
          {
            error:
              "massiveBatch est requis (cold_audience, warm_audience, hot_audience, hooks_controverses, storytelling)",
          },
          { status: 400 },
        );
      }
      if (!offer) {
        return NextResponse.json(
          { error: "Aucune offre trouvée. Crée d'abord une offre." },
          { status: 400 },
        );
      }

      const prompt =
        adCopyMassivePrompt(
          {
            offer_name: offer.offer_name,
            positioning: offer.positioning,
            unique_mechanism: offer.unique_mechanism,
            pricing: offer.pricing || { real_price: 0 },
          },
          avatar,
          massiveBatch as MassiveAdBatch,
        ) + (vaultContext ? "\n" + vaultContext : "");

      interface AdVariation {
        body?: string;
        headline?: string;
        hook?: string;
        cta?: string;
        angle?: string;
        target_audience?: string;
      }

      const result = await generateJSON<{ variations?: AdVariation[] }>({
        model: aiModel,
        prompt,
        maxTokens: 8192,
        temperature: 0.85,
      });

      // Sauvegarder les variations
      const savedCreatives = [];
      for (const variation of result.variations || []) {
        const { data: adCreative, error: saveError } = await supabase
          .from("ad_creatives")
          .insert({
            user_id: user.id,
            creative_type: "image",
            ad_copy: variation.body,
            headline: variation.headline,
            hook: variation.hook,
            cta: variation.cta,
            angle: variation.angle,
            target_audience: variation.target_audience,
            status: "draft",
          })
          .select()
          .single();

        if (saveError) {
          console.error("[generate-ads] Failed to save creative:", saveError.message);
        } else if (adCreative) {
          savedCreatives.push(adCreative);
        }
      }

      try {
        await awardXP(user.id, "generation.ads");
      } catch (e) {
        console.warn("XP award failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.ads");
      } catch (e) {
        console.warn("Notification failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({
        adType: "massive_batch",
        batch: massiveBatch,
        ad_creatives: savedCreatives,
        ai_raw_response: result,
      });
    }

    // --- Mode par défaut : Ad copy + hooks (existant) ---
    if (!offer) {
      return NextResponse.json(
        { error: "Aucune offre trouvée. Creez d'abord une offre." },
        { status: 400 },
      );
    }

    // Generate ad copy variations
    const adCopyProm = adCopyPrompt(
      {
        offer_name: offer.offer_name,
        positioning: offer.positioning,
        unique_mechanism: offer.unique_mechanism,
        pricing: offer.pricing || { real_price: 0 },
      },
      avatar,
    );
    interface AdVariation {
      body?: string;
      headline?: string;
      hook?: string;
      cta?: string;
      angle?: string;
      target_audience?: string;
    }
    const generatedAdCopy = await generateJSON<{ variations?: AdVariation[] }>({
      model: aiModel,
      prompt: adCopyProm,
      maxTokens: 4096,
    });

    // Generate ad hooks
    const hooksProm = adHooksPrompt(market, avatar);
    const generatedHooks = await generateJSON<{ hooks?: string[] }>({
      model: aiModel,
      prompt: hooksProm,
      maxTokens: 4096,
    });

    // Save each ad variation to the database
    const adCreatives = [];

    for (const variation of generatedAdCopy.variations || []) {
      const { data: adCreative, error: saveError } = await supabase
        .from("ad_creatives")
        .insert({
          user_id: user.id,
          creative_type: "image",
          ad_copy: variation.body,
          headline: variation.headline,
          hook: variation.hook,
          cta: variation.cta,
          angle: variation.angle,
          target_audience: variation.target_audience,
          status: "draft",
        })
        .select()
        .single();

      if (saveError) {
        continue;
      }

      adCreatives.push(adCreative);
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.ads");
    } catch (e) {
      console.warn("XP award failed:", e);
    }
    try {
      await notifyGeneration(user.id, "generation.ads");
    } catch (e) {
      console.warn("Notification failed:", e);
    }

    incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

    return NextResponse.json({
      ad_creatives: adCreatives,
      hooks: generatedHooks.hooks || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la génération des publicités" },
      { status: 500 },
    );
  }
}
