import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  objectionToContentPrompt,
  type ObjectionContentResult,
  type ObjectionContext,
} from "@/lib/ai/prompts/objection-content";
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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Rate limiting
    const rl = await rateLimit(user.id, "objections-to-content", {
      limit: 3,
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

    const body = await req.json();
    const { objections } = body;

    if (!objections || !Array.isArray(objections) || objections.length === 0) {
      return NextResponse.json(
        { error: "Au moins une objection est requise" },
        { status: 400 },
      );
    }

    // Fetch profile + vault context
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

    // Build context
    const context: ObjectionContext = {
      niche:
        profile?.niche ||
        profile?.selected_market ||
        latestAnalysis?.market ||
        "Freelances et consultants",
      offer: latestOffer
        ? `${latestOffer.offer_name} - ${latestOffer.positioning || ""}`
        : "Offre de consulting/formation",
      persona: latestAnalysis?.avatar
        ? JSON.stringify(latestAnalysis.avatar, null, 2)
        : "Freelances et consultants qui veulent scaler leur business",
      objections: objections.map((o: { text: string; frequency?: number }) => ({
        text: o.text,
        frequency: o.frequency || 5,
      })),
    };

    let prompt = objectionToContentPrompt(context);
    if (vaultContext) prompt += "\n" + vaultContext;

    const result = await generateJSON<ObjectionContentResult>({
      prompt,
      maxTokens: 8192,
      temperature: 0.7,
    });

    // Save generated content pieces
    for (const item of result.contenus || []) {
      // Save reel
      const { error: reelErr } = await supabase.from("content_pieces").insert({
        user_id: user.id,
        content_type: "instagram_reel",
        title: `Objection → Reel : "${item.objection.slice(0, 50)}"`,
        hook: item.reel.hook,
        content: item.reel.script,
        hashtags: item.reel.hashtags,
        published: false,
        ai_raw_response: item.reel,
      });
      if (reelErr)
        console.error("objections-to-content: failed to save reel", reelErr);

      // Save carousel
      const { error: carouselErr } = await supabase
        .from("content_pieces")
        .insert({
          user_id: user.id,
          content_type: "instagram_carousel",
          title: `Objection → Carousel : "${item.objection.slice(0, 50)}"`,
          hook: item.carousel.hook_cover,
          content: item.carousel.caption,
          hashtags: item.carousel.hashtags,
          published: false,
          ai_raw_response: item.carousel,
        });
      if (carouselErr)
        console.error(
          "objections-to-content: failed to save carousel",
          carouselErr,
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

    return NextResponse.json({ result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur lors de la transformation des objections: ${errMsg}` },
      { status: 500 },
    );
  }
}
