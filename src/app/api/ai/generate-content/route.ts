import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { contentIdeasPrompt } from "@/lib/ai/prompts/content-ideas";
import {
  buildContentStrategyPrompt,
  type ContentStrategyResult,
} from "@/lib/ai/prompts/content-strategy";
import {
  buildReelsScriptsPrompt,
  type ReelsScriptsResult,
} from "@/lib/ai/prompts/reels-scripts";
import {
  buildYouTubeScriptPrompt,
  type YouTubeScriptResult,
} from "@/lib/ai/prompts/youtube-scripts";
import {
  buildStoriesPrompt,
  type StoriesResult,
} from "@/lib/ai/prompts/stories-scripts";
import {
  buildCarouselPrompt,
  type CarouselResult,
} from "@/lib/ai/prompts/carousel-content";
import { contentSpyPrompt } from "@/lib/ai/prompts/content-spy";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import {
  isFirecrawlConfigured,
  scrapeUrl,
  searchAndScrape,
  type ScrapeResult,
} from "@/lib/scraping/firecrawl";
import {
  isApifyConfigured,
  scrapeInstagramProfile,
  scrapeInstagramPosts,
  scrapeTikTok,
  scrapeYouTubeTranscript,
  scrapeFacebookPosts,
  type InstagramProfileResult,
  type InstagramPostResult,
  type TikTokResult,
  type YouTubeTranscriptResult,
  type FacebookPostResult,
} from "@/lib/scraping/apify";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { rateLimit } from "@/lib/utils/rate-limit";
import { SupabaseClient } from "@supabase/supabase-js";

export const maxDuration = 60;

// ─── #74 + #75 : Fetch ad performance + sales insights for content enrichment ───

async function fetchAdInsights(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Top performing ad creatives (by CTR)
  const { data: topAds } = await supabase
    .from("ad_creatives")
    .select("headline, hook, angle, ctr, roas, ad_copy")
    .eq("user_id", userId)
    .gt("ctr", 0)
    .order("ctr", { ascending: false })
    .limit(5);

  // Recent daily metrics for trend
  const { data: metrics } = await supabase
    .from("ad_daily_metrics")
    .select("date, spend, roas, ctr, conversions")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if ((!topAds || topAds.length === 0) && (!metrics || metrics.length === 0))
    return "";

  let insight = "\n## DONNEES PUBLICITAIRES (adaptation intelligente)\n";

  if (topAds && topAds.length > 0) {
    insight += "### Creatives les plus performantes (par CTR) :\n";
    for (const ad of topAds) {
      insight += `- Hook: "${ad.hook || ad.headline}" | Angle: ${ad.angle || "N/A"} | CTR: ${ad.ctr}% | ROAS: ${ad.roas || "N/A"}\n`;
    }
    insight +=
      "\n→ Utilise ces angles et hooks performants comme inspiration pour le contenu organique.\n";
  }

  if (metrics && metrics.length > 0) {
    const avgRoas =
      metrics.reduce((s, m) => s + (m.roas || 0), 0) / metrics.length;
    const avgCtr =
      metrics.reduce((s, m) => s + (m.ctr || 0), 0) / metrics.length;
    const totalConversions = metrics.reduce(
      (s, m) => s + (m.conversions || 0),
      0,
    );
    insight += `### Performance des 7 derniers jours :\n`;
    insight += `- ROAS moyen : ${avgRoas.toFixed(2)} | CTR moyen : ${avgCtr.toFixed(2)}% | Conversions totales : ${totalConversions}\n`;
    if (avgRoas < 1.5) {
      insight +=
        "→ Le ROAS est faible — privilegie du contenu organique qui renforce la confiance et l'autorite.\n";
    }
    if (avgCtr > 2) {
      insight +=
        "→ Le CTR est bon — les hooks fonctionnent, decline-les en contenu organique.\n";
    }
  }

  return insight;
}

async function fetchSalesInsights(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  // Recent call analyses
  const { data: callAnalyses } = await supabase
    .from("sales_assets")
    .select("title, content, metadata, created_at")
    .eq("user_id", userId)
    .eq("asset_type", "sales_script")
    .order("created_at", { ascending: false })
    .limit(3);

  // Recent sales scripts for objection/pain point data
  const { data: salesAssets } = await supabase
    .from("sales_assets")
    .select("asset_type, ai_raw_response, metadata")
    .eq("user_id", userId)
    .in("asset_type", ["sales_script", "sales_letter", "lead_magnet"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (
    (!callAnalyses || callAnalyses.length === 0) &&
    (!salesAssets || salesAssets.length === 0)
  )
    return "";

  let insight = "\n## DONNEES DE VENTE (contenu depuis data vente)\n";

  if (callAnalyses && callAnalyses.length > 0) {
    insight += "### Analyses d'appels recents :\n";
    for (const call of callAnalyses) {
      const meta = call.metadata as {
        original_type?: string;
        call_type?: string;
      } | null;
      if (meta?.original_type === "call_analysis") {
        let parsed = null;
        try {
          parsed =
            typeof call.content === "string"
              ? JSON.parse(call.content)
              : call.content;
        } catch {
          /* ignore */
        }

        if (parsed) {
          const objections = parsed.objections_detected || [];
          const signals = parsed.client_signals || {};
          if (objections.length > 0) {
            insight += `- Objections detectees : ${objections.map((o: { objection: string }) => o.objection).join(", ")}\n`;
          }
          if (signals.buying_signals) {
            insight += `- Signaux d'achat : ${Array.isArray(signals.buying_signals) ? signals.buying_signals.join(", ") : signals.buying_signals}\n`;
          }
          if (signals.emotional_triggers) {
            insight += `- Declencheurs emotionnels : ${Array.isArray(signals.emotional_triggers) ? signals.emotional_triggers.join(", ") : signals.emotional_triggers}\n`;
          }
        }
      }
    }
    insight +=
      "\n→ Crée du contenu qui adresse directement ces objections et active ces déclencheurs émotionnels.\n";
  }

  if (salesAssets && salesAssets.length > 0) {
    const types = salesAssets.map((a) => a.asset_type);
    const uniqueTypes = [...new Set(types)];
    insight += `### Assets de vente disponibles : ${uniqueTypes.join(", ")}\n`;
    insight +=
      "→ Aligne le contenu organique avec les arguments de vente existants pour une coherence maximale.\n";
  }

  return insight;
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
    const rl = await rateLimit(user.id, "generate-content", {
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
    const {
      contentType,
      market,
      platform,
      topic,
      batchNumber,
      competitor,
      handle,
    } = body;

    // Récupérer le profil + vault + ad insights + sales insights en parallele
    const [{ data: profile }, vaultContext, adInsights, salesInsights] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, skills, target_market, niche, situation, parcours, target_revenue, industries, objectives",
          )
          .eq("id", user.id)
          .single(),
        buildFullVaultContext(user.id),
        fetchAdInsights(supabase, user.id),
        fetchSalesInsights(supabase, user.id),
      ]);

    const { data: latestAnalysis } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: latestOffer } = await supabase
      .from("offers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Helper to enrich prompts with vault + ad insights + sales insights
    const withContext = (prompt: string) => {
      let enriched = prompt;
      if (adInsights) enriched += adInsights;
      if (salesInsights) enriched += salesInsights;
      if (vaultContext) enriched += "\n" + vaultContext;
      return enriched;
    };

    const marketContext =
      market ||
      latestAnalysis?.market ||
      profile?.target_market ||
      "Freelances et consultants IA";
    const offerContext = latestOffer
      ? `${latestOffer.offer_name} - ${latestOffer.positioning || ""}`
      : "Offre de consulting/formation";
    const personaContext = latestAnalysis?.avatar
      ? JSON.stringify(latestAnalysis.avatar, null, 2)
      : "Freelances et consultants qui veulent scaler leur business";
    const parcoursContext = latestAnalysis?.market
      ? `Analyse de marche disponible : ${latestAnalysis.market}`
      : "Parcours client standard";

    // --- Content Spy (#44) — avec scraping Apify + Firecrawl hybride ---
    if (contentType === "content_spy") {
      if (!competitor || !platform) {
        return NextResponse.json(
          { error: "competitor et platform sont requis" },
          { status: 400 },
        );
      }

      // Phase 1 : Scraping réel via Apify (prioritaire) puis Firecrawl (fallback)
      let scrapedContext = "";
      let sourceUrls: string[] = [];
      let dataSource:
        | "instagram_api"
        | "tiktok_api"
        | "youtube_api"
        | "facebook_api"
        | "web_scraping"
        | "ai_only" = "ai_only";
      let scrapedPosts: {
        caption: string;
        likes: number;
        comments: number;
        shares?: number;
        ownerUsername?: string;
      }[] = [];
      let profileData: InstagramProfileResult | null = null;
      let transcriptData: {
        title: string;
        channelName: string;
        viewCount: number;
        likeCount: number;
        duration: string;
        uploadDate: string;
        transcript: string;
        url: string;
      } | null = null;

      const apifyReady = isApifyConfigured();
      const firecrawlReady = isFirecrawlConfigured();

      // --- Apify: Instagram ---
      if (apifyReady && platform === "instagram") {
        try {
          const cleanHandle = handle
            ? handle
                .replace(/^@/, "")
                .replace(/https?:\/\/(www\.)?instagram\.com\//, "")
                .replace(/\/.*$/, "")
                .trim()
            : "";

          // Scrape le profil Instagram si handle fourni
          if (cleanHandle) {
            profileData = await scrapeInstagramProfile(cleanHandle);
            if (profileData) {
              scrapedContext += `## PROFIL INSTAGRAM RÉEL — @${profileData.username}
- Nom : ${profileData.fullName}
- Bio : ${profileData.bio}
- Followers : ${profileData.followers.toLocaleString("fr-FR")}
- Following : ${profileData.following.toLocaleString("fr-FR")}
- Nombre de posts : ${profileData.posts.toLocaleString("fr-FR")}

### Posts récents du profil :
${profileData.recentPosts
  .slice(0, 10)
  .map(
    (p, i) =>
      `${i + 1}. "${p.caption.slice(0, 200)}" — ${p.likes} likes, ${p.comments} commentaires`,
  )
  .join("\n")}
`;
              scrapedPosts = profileData.recentPosts.slice(0, 10).map((p) => ({
                caption: p.caption,
                likes: p.likes,
                comments: p.comments,
              }));
              sourceUrls.push(
                `https://www.instagram.com/${profileData.username}/`,
              );
            }
          }

          // Scrape les posts par hashtag lié au concurrent
          const hashtagPosts: InstagramPostResult[] =
            await scrapeInstagramPosts({
              hashtag: competitor.replace(/\s+/g, ""),
              limit: 15,
            });
          if (hashtagPosts.length > 0) {
            scrapedContext += `\n### Posts Instagram trouvés via hashtag #${competitor.replace(/\s+/g, "")} :
${hashtagPosts
  .slice(0, 10)
  .map(
    (p, i) =>
      `${i + 1}. @${p.ownerUsername}: "${p.caption.slice(0, 200)}" — ${p.likes} likes, ${p.comments} commentaires | Hashtags: ${p.hashtags.join(", ")}`,
  )
  .join("\n")}
`;
            // Ajouter au tableau de posts si pas de profil
            if (scrapedPosts.length === 0) {
              scrapedPosts = hashtagPosts.slice(0, 10).map((p) => ({
                caption: p.caption,
                likes: p.likes,
                comments: p.comments,
                ownerUsername: p.ownerUsername,
              }));
            }
          }

          if (scrapedContext.length > 0) {
            dataSource = "instagram_api";
          }
        } catch (err) {
          console.warn("Apify Instagram scraping failed for content_spy:", err);
        }
      }

      // --- Apify: TikTok ---
      if (apifyReady && platform === "tiktok" && dataSource === "ai_only") {
        try {
          const isTikTokUrl = handle && handle.includes("tiktok.com");
          const tiktokResults: TikTokResult[] = await scrapeTikTok({
            profileUrl: isTikTokUrl ? handle : undefined,
            hashtag: !isTikTokUrl ? competitor.replace(/\s+/g, "") : undefined,
            limit: 15,
          });

          if (tiktokResults.length > 0) {
            scrapedContext += `## DONNÉES TIKTOK RÉELLES
### Vidéos TikTok trouvées (${tiktokResults.length} résultats) :
${tiktokResults
  .slice(0, 10)
  .map(
    (v, i) =>
      `${i + 1}. @${v.authorName}: "${v.description.slice(0, 200)}" — ${v.likes} likes, ${v.comments} commentaires, ${v.shares} partages, ${v.plays.toLocaleString("fr-FR")} vues | Hashtags: ${v.hashtags.join(", ")}`,
  )
  .join("\n")}
`;
            scrapedPosts = tiktokResults.slice(0, 10).map((v) => ({
              caption: v.description,
              likes: v.likes,
              comments: v.comments,
              ownerUsername: v.authorName,
            }));
            dataSource = "tiktok_api";
          }
        } catch (err) {
          console.warn("Apify TikTok scraping failed for content_spy:", err);
        }
      }

      // --- Apify: YouTube ---
      if (apifyReady && platform === "youtube" && dataSource === "ai_only") {
        try {
          const videoUrl =
            handle &&
            (handle.includes("youtube.com") || handle.includes("youtu.be"))
              ? handle
              : `https://www.youtube.com/results?search_query=${encodeURIComponent(competitor)}`;

          const ytResult: YouTubeTranscriptResult | null =
            await scrapeYouTubeTranscript(videoUrl);

          if (ytResult && (ytResult.title || ytResult.transcript)) {
            scrapedContext += `## DONNÉES YOUTUBE RÉELLES — ${ytResult.title}
- Chaîne : ${ytResult.channelName}
- Vues : ${ytResult.viewCount.toLocaleString("fr-FR")}
- Likes : ${ytResult.likeCount.toLocaleString("fr-FR")}
- Durée : ${ytResult.duration}
- Date de publication : ${ytResult.uploadDate}

### Transcription de la vidéo :
${ytResult.transcript.slice(0, 5000)}
`;
            transcriptData = {
              title: ytResult.title,
              channelName: ytResult.channelName,
              viewCount: ytResult.viewCount,
              likeCount: ytResult.likeCount,
              duration: ytResult.duration,
              uploadDate: ytResult.uploadDate,
              transcript: ytResult.transcript,
              url: ytResult.url,
            };
            sourceUrls.push(ytResult.url);
            dataSource = "youtube_api";
          }
        } catch (err) {
          console.warn("Apify YouTube scraping failed for content_spy:", err);
        }
      }

      // --- Apify: Facebook ---
      if (apifyReady && platform === "facebook" && dataSource === "ai_only") {
        try {
          const fbUrl =
            handle && handle.includes("facebook.com")
              ? handle
              : `https://www.facebook.com/${competitor.replace(/\s+/g, "")}`;

          const fbResults: FacebookPostResult[] = await scrapeFacebookPosts(
            fbUrl,
            15,
          );

          if (fbResults.length > 0) {
            scrapedContext += `## DONNÉES FACEBOOK RÉELLES
### Posts Facebook trouvés (${fbResults.length} résultats) :
${fbResults
  .slice(0, 10)
  .map(
    (p, i) =>
      `${i + 1}. "${p.text.slice(0, 200)}" — ${p.likes} likes, ${p.comments} commentaires, ${p.shares} partages | Type: ${p.type}`,
  )
  .join("\n")}
`;
            scrapedPosts = fbResults.slice(0, 10).map((p) => ({
              caption: p.text,
              likes: p.likes,
              comments: p.comments,
              shares: p.shares,
            }));
            for (const p of fbResults) {
              if (p.url && !sourceUrls.includes(p.url)) sourceUrls.push(p.url);
            }
            dataSource = "facebook_api";
          }
        } catch (err) {
          console.warn("Apify Facebook scraping failed for content_spy:", err);
        }
      }

      // --- Fallback Firecrawl ---
      if (firecrawlReady && dataSource === "ai_only") {
        try {
          const scrapedPages: ScrapeResult[] = [];

          // Scraper l'URL/handle si c'est une URL complète
          if (handle && handle.startsWith("http")) {
            const scraped = await scrapeUrl(handle);
            if (scraped) {
              scrapedPages.push(scraped);
              sourceUrls.push(scraped.url);
            }
          }

          // Rechercher du contenu du concurrent sur la plateforme
          const searchQuery = `${competitor} ${platform} contenu stratégie ${handle ? handle.replace("@", "") : ""}`;
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
            dataSource = "web_scraping";
          }
        } catch (err) {
          console.warn(
            "Firecrawl scraping failed for content_spy, falling back to AI-only:",
            err,
          );
          scrapedContext = "";
          sourceUrls = [];
        }
      }

      // Phase 2 : Analyse IA (enrichie par les données scrapées si disponibles)
      const prompt = withContext(
        contentSpyPrompt(
          {
            name: competitor,
            handle,
            platform,
          },
          scrapedContext || undefined,
        ),
      );

      const result = await generateJSON<Record<string, unknown>>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
        temperature: 0.8,
      });

      try {
        await awardXP(user.id, "generation.content_strategy");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.content_strategy");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({
        contentType: "content_spy",
        result,
        sources: sourceUrls.length > 0 ? sourceUrls : undefined,
        scraping_used: dataSource !== "ai_only",
        data_source: dataSource,
        scraped_posts:
          scrapedPosts.length > 0 ? scrapedPosts.slice(0, 5) : undefined,
        profile_data: profileData
          ? {
              username: profileData.username,
              fullName: profileData.fullName,
              bio: profileData.bio,
              followers: profileData.followers,
              posts: profileData.posts,
            }
          : undefined,
        transcript_data: transcriptData || undefined,
      });
    }

    // --- Strategie de contenu ---
    if (contentType === "strategy") {
      const prompt = withContext(
        buildContentStrategyPrompt(
          marketContext,
          offerContext,
          personaContext,
          parcoursContext,
        ),
      );
      const result = await generateJSON<ContentStrategyResult>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
      });

      // Sauvegarder chaque element du calendrier comme content_piece
      for (const item of result.calendrier || []) {
        const { error: insertErr } = await supabase
          .from("content_pieces")
          .insert({
            user_id: user.id,
            content_type: mapFormatToContentType(item.format),
            title: item.titre,
            hook: item.hook,
            content: JSON.stringify({
              pilier: item.pilier,
              type_contenu: item.type_contenu,
              plateforme: item.plateforme,
              format: item.format,
            }),
            scheduled_date: getScheduledDate(item.jour),
            published: false,
          });
        if (insertErr)
          console.error(
            "generate-content: failed to save calendar item",
            insertErr,
          );
      }

      // Award XP (non-blocking)
      try {
        await awardXP(user.id, "generation.content_strategy");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.content_strategy");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({ contentType: "strategy", result });
    }

    // --- Scripts Reels ---
    if (contentType === "reels") {
      const prompt = withContext(
        buildReelsScriptsPrompt(
          marketContext,
          offerContext,
          personaContext,
          batchNumber || 1,
        ),
      );
      const result = await generateJSON<ReelsScriptsResult>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
      });

      // Sauvegarder chaque script
      for (const script of result.scripts || []) {
        const { error: insertErr } = await supabase
          .from("content_pieces")
          .insert({
            user_id: user.id,
            content_type: "instagram_reel",
            title: `Reel #${script.numero} - ${script.angle}`,
            hook: script.hook,
            content: script.corps,
            hashtags: script.hashtags,
            published: false,
          });
        if (insertErr)
          console.error(
            "generate-content: failed to save reel script",
            insertErr,
          );
      }

      // Award XP (non-blocking)
      try {
        await awardXP(user.id, "generation.reels");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.reels");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({ contentType: "reels", result });
    }

    // --- Script YouTube ---
    if (contentType === "youtube") {
      if (!topic) {
        return NextResponse.json(
          { error: "Le sujet (topic) est requis pour YouTube" },
          { status: 400 },
        );
      }
      const prompt = withContext(
        buildYouTubeScriptPrompt(marketContext, offerContext, topic),
      );
      const result = await generateJSON<YouTubeScriptResult>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
      });

      const { error: ytErr } = await supabase.from("content_pieces").insert({
        user_id: user.id,
        content_type: "youtube_video",
        title: result.titre,
        hook: result.hook,
        content: result.script_complet,
        hashtags: result.tags,
        published: false,
      });
      if (ytErr)
        console.error("generate-content: failed to save youtube script", ytErr);

      // Award XP (non-blocking)
      try {
        await awardXP(user.id, "generation.youtube");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.youtube");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({ contentType: "youtube", result });
    }

    // --- Stories ---
    if (contentType === "stories") {
      const prompt = withContext(
        buildStoriesPrompt(marketContext, offerContext),
      );
      const result = await generateJSON<StoriesResult>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
      });

      for (const story of result.stories || []) {
        const { error: insertErr } = await supabase
          .from("content_pieces")
          .insert({
            user_id: user.id,
            content_type: "instagram_story",
            title: `Story - ${story.type}`,
            content: JSON.stringify(story.slides),
            published: false,
          });
        if (insertErr)
          console.error("generate-content: failed to save story", insertErr);
      }

      // Award XP (non-blocking)
      try {
        await awardXP(user.id, "generation.stories");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.stories");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({ contentType: "stories", result });
    }

    // --- Carousel ---
    if (contentType === "carousel") {
      if (!topic) {
        return NextResponse.json(
          { error: "Le sujet (topic) est requis pour le carousel" },
          { status: 400 },
        );
      }
      const prompt = withContext(
        buildCarouselPrompt(marketContext, offerContext, topic),
      );
      const result = await generateJSON<CarouselResult>({
        model: aiModel,
        prompt,
        maxTokens: 4096,
      });

      const { error: carouselErr } = await supabase
        .from("content_pieces")
        .insert({
          user_id: user.id,
          content_type: "instagram_carousel",
          title: result.titre,
          hook: result.hook_cover,
          content: result.caption,
          hashtags: result.hashtags,
          published: false,
        });
      if (carouselErr)
        console.error("generate-content: failed to save carousel", carouselErr);

      // Award XP (non-blocking)
      try {
        await awardXP(user.id, "generation.carousel");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }
      try {
        await notifyGeneration(user.id, "generation.carousel");
      } catch (e) {
        console.warn("Non-blocking op failed:", e);
      }

      incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

      return NextResponse.json({ contentType: "carousel", result });
    }

    // --- Mode par défaut : idees de contenu (existant) ---
    if (!platform) {
      return NextResponse.json(
        { error: "contentType ou platform est requis" },
        { status: 400 },
      );
    }

    const validPlatforms = [
      "linkedin",
      "instagram",
      "tiktok",
      "youtube",
      "twitter",
      "facebook",
      "blog",
    ];

    if (!validPlatforms.includes(platform.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Plateforme invalide. Plateformes acceptées : ${validPlatforms.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Generate content ideas using AI
    const prompt = withContext(contentIdeasPrompt(marketContext, platform));
    const generatedContent = await generateJSON<{ ideas?: string[] }>({
      model: aiModel,
      prompt,
      maxTokens: 4096,
    });

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.content_strategy");
    } catch (e) {
      console.warn("Non-blocking op failed:", e);
    }
    try {
      await notifyGeneration(user.id, "generation.content_strategy");
    } catch (e) {
      console.warn("Non-blocking op failed:", e);
    }

    incrementAIUsage(user.id, { generationType: "post_social", model: aiModel }).catch(() => {});

    return NextResponse.json({
      market: marketContext,
      platform,
      ideas: generatedContent.ideas || [],
    });
  } catch (error) {
    console.error("[generate-content] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du contenu" },
      { status: 500 },
    );
  }
}

function mapFormatToContentType(format: string): string {
  const lower = format.toLowerCase();
  if (lower.includes("reel") || lower.includes("video courte"))
    return "instagram_reel";
  if (lower.includes("carousel")) return "instagram_carousel";
  if (lower.includes("story")) return "instagram_story";
  if (lower.includes("youtube") || lower.includes("video longue"))
    return "youtube_video";
  if (lower.includes("short")) return "youtube_short";
  if (lower.includes("linkedin")) return "linkedin_post";
  if (lower.includes("tiktok")) return "tiktok_video";
  if (lower.includes("blog") || lower.includes("article")) return "blog_post";
  return "instagram_post";
}

function getScheduledDate(dayOfMonth: number): string {
  const now = new Date();
  const scheduled = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOfMonth,
  );
  return scheduled.toISOString().split("T")[0];
}
