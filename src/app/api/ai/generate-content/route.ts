import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
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
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { rateLimit } from "@/lib/utils/rate-limit";
import { SupabaseClient } from "@supabase/supabase-js";

// ─── #74 + #75 : Fetch ad performance + sales insights for content enrichment ───

async function fetchAdInsights(supabase: SupabaseClient, userId: string): Promise<string> {
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

  if ((!topAds || topAds.length === 0) && (!metrics || metrics.length === 0)) return "";

  let insight = "\n## DONNEES PUBLICITAIRES (adaptation intelligente)\n";

  if (topAds && topAds.length > 0) {
    insight += "### Creatives les plus performantes (par CTR) :\n";
    for (const ad of topAds) {
      insight += `- Hook: "${ad.hook || ad.headline}" | Angle: ${ad.angle || "N/A"} | CTR: ${ad.ctr}% | ROAS: ${ad.roas || "N/A"}\n`;
    }
    insight += "\n→ Utilise ces angles et hooks performants comme inspiration pour le contenu organique.\n";
  }

  if (metrics && metrics.length > 0) {
    const avgRoas = metrics.reduce((s, m) => s + (m.roas || 0), 0) / metrics.length;
    const avgCtr = metrics.reduce((s, m) => s + (m.ctr || 0), 0) / metrics.length;
    const totalConversions = metrics.reduce((s, m) => s + (m.conversions || 0), 0);
    insight += `### Performance des 7 derniers jours :\n`;
    insight += `- ROAS moyen : ${avgRoas.toFixed(2)} | CTR moyen : ${avgCtr.toFixed(2)}% | Conversions totales : ${totalConversions}\n`;
    if (avgRoas < 1.5) {
      insight += "→ Le ROAS est faible — privilegie du contenu organique qui renforce la confiance et l'autorite.\n";
    }
    if (avgCtr > 2) {
      insight += "→ Le CTR est bon — les hooks fonctionnent, decline-les en contenu organique.\n";
    }
  }

  return insight;
}

async function fetchSalesInsights(supabase: SupabaseClient, userId: string): Promise<string> {
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

  if ((!callAnalyses || callAnalyses.length === 0) && (!salesAssets || salesAssets.length === 0)) return "";

  let insight = "\n## DONNEES DE VENTE (contenu depuis data vente)\n";

  if (callAnalyses && callAnalyses.length > 0) {
    insight += "### Analyses d'appels recents :\n";
    for (const call of callAnalyses) {
      const meta = call.metadata as { original_type?: string; call_type?: string } | null;
      if (meta?.original_type === "call_analysis") {
        let parsed = null;
        try {
          parsed = typeof call.content === "string" ? JSON.parse(call.content) : call.content;
        } catch { /* ignore */ }

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
    insight += "\n→ Crée du contenu qui adresse directement ces objections et active ces déclencheurs émotionnels.\n";
  }

  if (salesAssets && salesAssets.length > 0) {
    const types = salesAssets.map((a) => a.asset_type);
    const uniqueTypes = [...new Set(types)];
    insight += `### Assets de vente disponibles : ${uniqueTypes.join(", ")}\n`;
    insight += "→ Aligne le contenu organique avec les arguments de vente existants pour une coherence maximale.\n";
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
    const rl = await rateLimit(user.id, "generate-content", { limit: 5, windowSeconds: 60 });
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


    const body = await req.json();
    const { contentType, market, platform, topic, batchNumber, competitor, handle } = body;

    // Récupérer le profil + vault + ad insights + sales insights en parallele
    const [{ data: profile }, vaultContext, adInsights, salesInsights] = await Promise.all([
      supabase.from("profiles").select("id, full_name, skills, target_market, niche, situation, parcours, target_revenue, industries, objectives").eq("id", user.id).single(),
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
      market || latestAnalysis?.market || profile?.target_market || "Freelances et consultants IA";
    const offerContext =
      latestOffer
        ? `${latestOffer.offer_name} - ${latestOffer.positioning || ""}`
        : "Offre de consulting/formation";
    const personaContext =
      latestAnalysis?.avatar
        ? JSON.stringify(latestAnalysis.avatar, null, 2)
        : "Freelances et consultants qui veulent scaler leur business";
    const parcoursContext =
      latestAnalysis?.market
        ? `Analyse de marche disponible : ${latestAnalysis.market}`
        : "Parcours client standard";

    // --- Content Spy (#44) ---
    if (contentType === "content_spy") {
      if (!competitor || !platform) {
        return NextResponse.json(
          { error: "competitor et platform sont requis" },
          { status: 400 }
        );
      }
      const prompt = withContext(contentSpyPrompt({
        name: competitor,
        handle,
        platform,
      }));

      const result = await generateJSON<Record<string, unknown>>({
        prompt,
        maxTokens: 4096,
        temperature: 0.8,
      });

      try { await awardXP(user.id, "generation.content_strategy"); } catch (e) { console.warn("Non-blocking op failed:", e); }
      try { await notifyGeneration(user.id, "generation.content_strategy"); } catch (e) { console.warn("Non-blocking op failed:", e); }

      return NextResponse.json({ contentType: "content_spy", result });
    }

    // --- Strategie de contenu ---
    if (contentType === "strategy") {
      const prompt = withContext(buildContentStrategyPrompt(
        marketContext,
        offerContext,
        personaContext,
        parcoursContext
      ));
      const result = await generateJSON<ContentStrategyResult>({
        prompt,
        maxTokens: 8192,
      });

      // Sauvegarder chaque element du calendrier comme content_piece
      for (const item of result.calendrier || []) {
        const { error: insertErr } = await supabase.from("content_pieces").insert({
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
        if (insertErr) console.error("generate-content: failed to save calendar item", insertErr);
      }

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.content_strategy"); } catch (e) { console.warn("Non-blocking op failed:", e); }
    try { await notifyGeneration(user.id, "generation.content_strategy"); } catch (e) { console.warn("Non-blocking op failed:", e); }

      return NextResponse.json({ contentType: "strategy", result });
    }

    // --- Scripts Reels ---
    if (contentType === "reels") {
      const prompt = withContext(buildReelsScriptsPrompt(
        marketContext,
        offerContext,
        personaContext,
        batchNumber || 1
      ));
      const result = await generateJSON<ReelsScriptsResult>({
        prompt,
        maxTokens: 8192,
      });

      // Sauvegarder chaque script
      for (const script of result.scripts || []) {
        const { error: insertErr } = await supabase.from("content_pieces").insert({
          user_id: user.id,
          content_type: "instagram_reel",
          title: `Reel #${script.numero} - ${script.angle}`,
          hook: script.hook,
          content: script.corps,
          hashtags: script.hashtags,
          published: false,
        });
        if (insertErr) console.error("generate-content: failed to save reel script", insertErr);
      }

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.reels"); } catch (e) { console.warn("Non-blocking op failed:", e); }
    try { await notifyGeneration(user.id, "generation.reels"); } catch (e) { console.warn("Non-blocking op failed:", e); }

      return NextResponse.json({ contentType: "reels", result });
    }

    // --- Script YouTube ---
    if (contentType === "youtube") {
      if (!topic) {
        return NextResponse.json(
          { error: "Le sujet (topic) est requis pour YouTube" },
          { status: 400 }
        );
      }
      const prompt = withContext(buildYouTubeScriptPrompt(marketContext, offerContext, topic));
      const result = await generateJSON<YouTubeScriptResult>({
        prompt,
        maxTokens: 8192,
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
      if (ytErr) console.error("generate-content: failed to save youtube script", ytErr);

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.youtube"); } catch (e) { console.warn("Non-blocking op failed:", e); }
    try { await notifyGeneration(user.id, "generation.youtube"); } catch (e) { console.warn("Non-blocking op failed:", e); }

      return NextResponse.json({ contentType: "youtube", result });
    }

    // --- Stories ---
    if (contentType === "stories") {
      const prompt = withContext(buildStoriesPrompt(marketContext, offerContext));
      const result = await generateJSON<StoriesResult>({
        prompt,
        maxTokens: 4096,
      });

      for (const story of result.stories || []) {
        const { error: insertErr } = await supabase.from("content_pieces").insert({
          user_id: user.id,
          content_type: "instagram_story",
          title: `Story - ${story.type}`,
          content: JSON.stringify(story.slides),
          published: false,
        });
        if (insertErr) console.error("generate-content: failed to save story", insertErr);
      }

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.stories"); } catch (e) { console.warn("Non-blocking op failed:", e); }
    try { await notifyGeneration(user.id, "generation.stories"); } catch (e) { console.warn("Non-blocking op failed:", e); }

      return NextResponse.json({ contentType: "stories", result });
    }

    // --- Carousel ---
    if (contentType === "carousel") {
      if (!topic) {
        return NextResponse.json(
          { error: "Le sujet (topic) est requis pour le carousel" },
          { status: 400 }
        );
      }
      const prompt = withContext(buildCarouselPrompt(marketContext, offerContext, topic));
      const result = await generateJSON<CarouselResult>({
        prompt,
        maxTokens: 4096,
      });

      const { error: carouselErr } = await supabase.from("content_pieces").insert({
        user_id: user.id,
        content_type: "instagram_carousel",
        title: result.titre,
        hook: result.hook_cover,
        content: result.caption,
        hashtags: result.hashtags,
        published: false,
      });
      if (carouselErr) console.error("generate-content: failed to save carousel", carouselErr);

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.carousel"); } catch (e) { console.warn("Non-blocking op failed:", e); }
    try { await notifyGeneration(user.id, "generation.carousel"); } catch (e) { console.warn("Non-blocking op failed:", e); }

      return NextResponse.json({ contentType: "carousel", result });
    }

    // --- Mode par défaut : idees de contenu (existant) ---
    if (!platform) {
      return NextResponse.json(
        { error: "contentType ou platform est requis" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    // Generate content ideas using AI
    const prompt = withContext(contentIdeasPrompt(marketContext, platform));
    const generatedContent = await generateJSON<{ ideas?: string[] }>({ prompt, maxTokens: 4096 });

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.content_strategy"); } catch (e) { console.warn("Non-blocking op failed:", e); }
    try { await notifyGeneration(user.id, "generation.content_strategy"); } catch (e) { console.warn("Non-blocking op failed:", e); }

    return NextResponse.json({
      market: marketContext,
      platform,
      ideas: generatedContent.ideas || [],
    });
  } catch (error) {
    console.error("[generate-content] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du contenu" },
      { status: 500 }
    );
  }
}

function mapFormatToContentType(format: string): string {
  const lower = format.toLowerCase();
  if (lower.includes("reel") || lower.includes("video courte")) return "instagram_reel";
  if (lower.includes("carousel")) return "instagram_carousel";
  if (lower.includes("story")) return "instagram_story";
  if (lower.includes("youtube") || lower.includes("video longue")) return "youtube_video";
  if (lower.includes("short")) return "youtube_short";
  if (lower.includes("linkedin")) return "linkedin_post";
  if (lower.includes("tiktok")) return "tiktok_video";
  if (lower.includes("blog") || lower.includes("article")) return "blog_post";
  return "instagram_post";
}

function getScheduledDate(dayOfMonth: number): string {
  const now = new Date();
  const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOfMonth);
  return scheduled.toISOString().split("T")[0];
}
