import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { vslScriptPrompt } from "@/lib/ai/prompts/vsl-script";
import { emailSequencePrompt } from "@/lib/ai/prompts/email-sequence";
import { smsSequencePrompt } from "@/lib/ai/prompts/sms-sequence";
import { salesScriptPrompt } from "@/lib/ai/prompts/sales-script";
import { caseStudyPrompt } from "@/lib/ai/prompts/case-study";
import { pitchDeckPrompt } from "@/lib/ai/prompts/pitch-deck";
import { salesLetterPrompt } from "@/lib/ai/prompts/sales-letter";
import { settingScriptPrompt } from "@/lib/ai/prompts/setting-script";
import { leadMagnetPrompt } from "@/lib/ai/prompts/lead-magnet";
import { socialAssetsPrompt } from "@/lib/ai/prompts/social-assets";
import { followerAdsPrompt } from "@/lib/ai/prompts/follower-ads";
import { dmRetargetingPrompt } from "@/lib/ai/prompts/dm-retargeting";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";

type AssetType =
  | "vsl_script"
  | "email_sequence"
  | "sms_sequence"
  | "sales_script"
  | "case_study"
  | "pitch_deck"
  | "sales_letter"
  | "setting_script"
  | "lead_magnet"
  | "social_assets"
  | "follower_ads"
  | "dm_retargeting";

const VALID_ASSET_TYPES: AssetType[] = [
  "vsl_script",
  "email_sequence",
  "sms_sequence",
  "sales_script",
  "case_study",
  "pitch_deck",
  "sales_letter",
  "setting_script",
  "lead_magnet",
  "social_assets",
  "follower_ads",
  "dm_retargeting",
];

export const maxDuration = 120;

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
    const rl = await rateLimit(user.id, "generate-assets", {
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

    const body = await req.json();
    let { offerId, assetType } = body;

    // Map short type names from components to valid asset types
    const TYPE_MAP: Record<string, string> = {
      vsl: "vsl_script",
      email: "email_sequence",
      sms: "sms_sequence",
      sales: "sales_script",
      case_study: "case_study",
      pitch_deck: "pitch_deck",
      sales_letter: "sales_letter",
      setting_script: "setting_script",
      lead_magnet: "lead_magnet",
      social_assets: "social_assets",
      follower_ads: "follower_ads",
      dm_retargeting: "dm_retargeting",
    };
    if (body.type && !assetType) {
      assetType = TYPE_MAP[body.type] || body.type;
    }

    if (!assetType) {
      return NextResponse.json(
        { error: "assetType est requis" },
        { status: 400 },
      );
    }

    if (!VALID_ASSET_TYPES.includes(assetType as AssetType)) {
      return NextResponse.json(
        {
          error: `Type d'asset invalide. Types acceptés : ${VALID_ASSET_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Auto-fetch latest offer if offerId not provided
    if (!offerId) {
      const { data: latestOffer } = await supabase
        .from("offers")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      offerId = latestOffer?.id;
    }

    if (!offerId) {
      return NextResponse.json(
        { error: "Aucune offre trouvée. Génère d'abord une offre." },
        { status: 400 },
      );
    }

    // Fetch offer with related market analysis
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*, market_analyses(*)")
      .eq("id", offerId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    const avatar = offer.market_analyses?.avatar || {};

    // Generate the appropriate prompt based on asset type
    let prompt: string;
    let maxTokens = 4096;

    switch (assetType as AssetType) {
      case "vsl_script":
        prompt = vslScriptPrompt(
          offer.offer_data || offer,
          avatar,
          body.structure || "dsl",
        );
        break;

      case "email_sequence":
        prompt = emailSequencePrompt(
          {
            offer_name: offer.offer_name,
            unique_mechanism: offer.unique_mechanism,
          },
          avatar,
        );
        break;

      case "sms_sequence":
        prompt = smsSequencePrompt({ offer_name: offer.offer_name }, avatar);
        break;

      case "sales_script":
        prompt = salesScriptPrompt(offer.offer_data || offer, avatar);
        break;

      case "case_study":
        prompt = caseStudyPrompt(
          { offer_name: offer.offer_name },
          {
            metric: body.metric || "Chiffre d'affaires",
            value: body.value || "x3 en 90 jours",
          },
        );
        break;

      case "pitch_deck":
        prompt = pitchDeckPrompt(offer.offer_data || offer, avatar);
        maxTokens = 6000;
        break;

      case "sales_letter":
        prompt = salesLetterPrompt(offer.offer_data || offer, avatar);
        maxTokens = 8000;
        break;

      case "setting_script":
        prompt = settingScriptPrompt(offer.offer_data || offer, avatar);
        break;

      case "lead_magnet":
        prompt = leadMagnetPrompt(
          offer.offer_data || offer,
          avatar,
          body.leadMagnetType || "checklist",
        );
        maxTokens = 6000;
        break;

      case "social_assets":
        prompt = socialAssetsPrompt(
          offer.offer_data || offer,
          avatar,
          body.brandKit,
        );
        maxTokens = 6000;
        break;

      case "follower_ads":
        prompt = followerAdsPrompt(
          offer.offer_data || offer,
          avatar,
          body.niche,
        );
        maxTokens = 6000;
        break;

      case "dm_retargeting":
        prompt = dmRetargetingPrompt(offer.offer_data || offer, avatar);
        maxTokens = 6000;
        break;

      default:
        return NextResponse.json(
          { error: "Type d'asset non supporté" },
          { status: 400 },
        );
    }

    // Inject vault context
    const vaultContext = await buildFullVaultContext(user.id);
    if (vaultContext) {
      prompt = prompt + "\n" + vaultContext;
    }

    // Generate asset using AI
    const aiModel = getModelForGeneration("vsl");

    const { data: generatedAsset, usage: aiUsage } = await generateJSON<Record<string, unknown>>({
      model: aiModel,
      prompt,
      maxTokens,
    });

    // Save asset to database
    // DB columns: title (text), content (text), ai_raw_response (jsonb)
    // Map types not yet in DB check constraint to valid types
    const DB_ASSET_TYPE_MAP: Record<string, string> = {
      setting_script: "sales_script",
      social_assets: "lead_magnet",
    };
    const dbAssetType = DB_ASSET_TYPE_MAP[assetType] || assetType;
    const { data: asset, error: saveError } = await supabase
      .from("sales_assets")
      .insert({
        user_id: user.id,
        offer_id: offerId,
        asset_type: dbAssetType,
        title: `${assetType} — ${offer.offer_name}`,
        content: JSON.stringify(generatedAsset),
        ai_raw_response: generatedAsset,
        metadata:
          dbAssetType !== assetType ? { original_type: assetType } : null,
        status: "draft",
      })
      .select()
      .maybeSingle();

    if (saveError) {
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde" },
        { status: 500 },
      );
    }

    // Award XP based on asset type (non-blocking)
    const assetXPMap: Record<string, string> = {
      vsl_script: "generation.vsl",
      email_sequence: "generation.email",
      sms_sequence: "generation.sms",
      sales_script: "generation.ads",
      case_study: "generation.ads",
      pitch_deck: "generation.pitch_deck",
      sales_letter: "generation.sales_letter",
      setting_script: "generation.setting_script",
      lead_magnet: "generation.lead_magnet",
      social_assets: "generation.ads",
      follower_ads: "generation.ads",
      dm_retargeting: "generation.ads",
    };
    try {
      await awardXP(user.id, assetXPMap[assetType] || "generation.vsl");
    } catch {}

    incrementAIUsage(user.id, { generationType: "vsl", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json(asset);
  } catch (error) {
    console.error("[generate-assets] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'asset" },
      { status: 500 },
    );
  }
}
