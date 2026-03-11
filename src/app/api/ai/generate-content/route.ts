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
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { rateLimit } from "@/lib/utils/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Rate limiting
    const rl = rateLimit(user.id, "generate-content", { limit: 5, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requetes. Reessaie dans quelques secondes." },
        { status: 429 }
      );
    }

    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de generations IA atteinte", usage },
        { status: 403 }
      );
    }


    const body = await req.json();
    const { contentType, market, platform, topic, batchNumber } = body;

    // Recuperer le profil + vault resources pour les prompts avances
    const [{ data: profile }, vaultContext] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      buildFullVaultContext(user.id),
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

    // Helper to enrich prompts with vault resources
    const withVault = (prompt: string) => vaultContext ? prompt + "\n" + vaultContext : prompt;

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

    // --- Strategie de contenu ---
    if (contentType === "strategy") {
      const prompt = withVault(buildContentStrategyPrompt(
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
        await supabase.from("content_pieces").insert({
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
      }

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.content_strategy"); } catch {}
    try { await notifyGeneration(user.id, "generation.content_strategy"); } catch {}

      return NextResponse.json({ contentType: "strategy", result });
    }

    // --- Scripts Reels ---
    if (contentType === "reels") {
      const prompt = withVault(buildReelsScriptsPrompt(
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
        await supabase.from("content_pieces").insert({
          user_id: user.id,
          content_type: "instagram_reel",
          title: `Reel #${script.numero} - ${script.angle}`,
          hook: script.hook,
          content: script.corps,
          hashtags: script.hashtags,
          published: false,
        });
      }

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.reels"); } catch {}
    try { await notifyGeneration(user.id, "generation.reels"); } catch {}

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
      const prompt = withVault(buildYouTubeScriptPrompt(marketContext, offerContext, topic));
      const result = await generateJSON<YouTubeScriptResult>({
        prompt,
        maxTokens: 8192,
      });

      await supabase.from("content_pieces").insert({
        user_id: user.id,
        content_type: "youtube_video",
        title: result.titre,
        hook: result.hook,
        content: result.script_complet,
        hashtags: result.tags,
        published: false,
      });

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.youtube"); } catch {}
    try { await notifyGeneration(user.id, "generation.youtube"); } catch {}

      return NextResponse.json({ contentType: "youtube", result });
    }

    // --- Stories ---
    if (contentType === "stories") {
      const prompt = withVault(buildStoriesPrompt(marketContext, offerContext));
      const result = await generateJSON<StoriesResult>({
        prompt,
        maxTokens: 4096,
      });

      for (const story of result.stories || []) {
        await supabase.from("content_pieces").insert({
          user_id: user.id,
          content_type: "instagram_story",
          title: `Story - ${story.type}`,
          content: JSON.stringify(story.slides),
          published: false,
        });
      }

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.stories"); } catch {}
    try { await notifyGeneration(user.id, "generation.stories"); } catch {}

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
      const prompt = withVault(buildCarouselPrompt(marketContext, offerContext, topic));
      const result = await generateJSON<CarouselResult>({
        prompt,
        maxTokens: 4096,
      });

      await supabase.from("content_pieces").insert({
        user_id: user.id,
        content_type: "instagram_carousel",
        title: result.titre,
        hook: result.hook_cover,
        content: result.caption,
        hashtags: result.hashtags,
        published: false,
      });

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.carousel"); } catch {}
    try { await notifyGeneration(user.id, "generation.carousel"); } catch {}

      return NextResponse.json({ contentType: "carousel", result });
    }

    // --- Mode par defaut : idees de contenu (existant) ---
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
          error: `Plateforme invalide. Plateformes acceptees : ${validPlatforms.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Generate content ideas using AI
    const prompt = withVault(contentIdeasPrompt(marketContext, platform));
    const generatedContent = await generateJSON<{ ideas?: string[] }>({ prompt, maxTokens: 4096 });

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.content_strategy"); } catch {}
    try { await notifyGeneration(user.id, "generation.content_strategy"); } catch {}

    return NextResponse.json({
      market: marketContext,
      platform,
      ideas: generatedContent.ideas || [],
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur lors de la generation du contenu: ${errMsg}` },
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
