import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { adCopyPrompt } from "@/lib/ai/prompts/ad-copy";
import { adHooksPrompt } from "@/lib/ai/prompts/ad-hooks";
import {
  buildVideoAdScriptPrompt,
  type VideoAdScriptResult,
} from "@/lib/ai/prompts/video-ad-scripts";
import {
  buildDMScriptsPrompt,
  type DMScriptsResult,
} from "@/lib/ai/prompts/dm-scripts";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
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
    const { offerId, adType } = body;

    // Recuperer le profil + vault resources pour le contexte
    const [{ data: profile }, vaultContext] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      buildFullVaultContext(user.id),
    ]);

    // Recuperer la derniere offre si offerId pas fourni
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
          { status: 404 }
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
    const market = offer?.market_analyses?.market || profile?.target_market || "";
    const offerContext = offer
      ? `${offer.offer_name} - ${offer.positioning || ""} - ${offer.unique_mechanism || ""}`
      : "Offre de consulting/formation";
    const avatarContext =
      typeof avatar === "object" ? JSON.stringify(avatar, null, 2) : String(avatar);

    // --- Video Ad Scripts ---
    if (adType === "video_ad") {
      const prompt = buildVideoAdScriptPrompt(offerContext, avatarContext) + (vaultContext ? "\n" + vaultContext : "");
      const result = await generateJSON<VideoAdScriptResult>({
        prompt,
        maxTokens: 4096,
      });

      // Sauvegarder chaque script video
      for (const script of result.scripts || []) {
        await supabase.from("ad_creatives").insert({
          user_id: user.id,
          creative_type: "video",
          ad_copy: script.corps,
          headline: `Video Ad ${script.duree}`,
          hook: script.hook,
          cta: script.cta,
          angle: script.angle,
          status: "draft",
        });
      }

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.ads"); } catch {}
    try { await notifyGeneration(user.id, "generation.ads"); } catch {}

      return NextResponse.json({ adType: "video_ad", result });
    }

    // --- DM Scripts ---
    if (adType === "dm_scripts") {
      const prompt = buildDMScriptsPrompt(offerContext, avatarContext) + (vaultContext ? "\n" + vaultContext : "");
      const result = await generateJSON<DMScriptsResult>({
        prompt,
        maxTokens: 4096,
      });

      // Sauvegarder les sequences de prospection
      for (let i = 0; i < (result.prospection || []).length; i++) {
        const seq = result.prospection[i];
        await supabase.from("ad_creatives").insert({
          user_id: user.id,
          creative_type: "dm",
          ad_copy: `Opener: ${seq.opener}\n\nFollow-up 1: ${seq.follow_up_1}\n\nFollow-up 2: ${seq.follow_up_2}\n\nClosing: ${seq.closing}`,
          headline: `Sequence DM #${i + 1}`,
          hook: seq.opener,
          cta: seq.closing,
          status: "draft",
        });
      }

      // Award XP (non-blocking)
      try { await awardXP(user.id, "generation.ads"); } catch {}
    try { await notifyGeneration(user.id, "generation.ads"); } catch {}

      return NextResponse.json({ adType: "dm_scripts", result });
    }

    // --- Mode par defaut : Ad copy + hooks (existant) ---
    if (!offer) {
      return NextResponse.json(
        { error: "Aucune offre trouvee. Creez d'abord une offre." },
        { status: 400 }
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
      avatar
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedAdCopy: any = await generateJSON({
      prompt: adCopyProm,
      maxTokens: 4096,
    });

    // Generate ad hooks
    const hooksProm = adHooksPrompt(market, avatar);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedHooks: any = await generateJSON({
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
        console.error("Error saving ad creative:", saveError);
        continue;
      }

      adCreatives.push(adCreative);
    }

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.ads"); } catch {}
    try { await notifyGeneration(user.id, "generation.ads"); } catch {}

    return NextResponse.json({
      ad_creatives: adCreatives,
      hooks: generatedHooks.hooks || [],
    });
  } catch (error) {
    console.error("Error generating ads:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation des publicites" },
      { status: 500 }
    );
  }
}
