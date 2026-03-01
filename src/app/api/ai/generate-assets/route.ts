import { NextRequest, NextResponse } from "next/server";
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
import { awardXP } from "@/lib/gamification/xp-engine";

type AssetType =
  | "vsl_script"
  | "email_sequence"
  | "sms_sequence"
  | "sales_script"
  | "case_study"
  | "pitch_deck"
  | "sales_letter"
  | "setting_script"
  | "lead_magnet";

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
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { offerId, assetType } = body;

    if (!offerId || !assetType) {
      return NextResponse.json(
        { error: "offerId et assetType sont requis" },
        { status: 400 }
      );
    }

    if (!VALID_ASSET_TYPES.includes(assetType as AssetType)) {
      return NextResponse.json(
        {
          error: `Type d'asset invalide. Types acceptés : ${VALID_ASSET_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Fetch offer with related market analysis
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*, market_analyses(*)")
      .eq("id", offerId)
      .eq("user_id", user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
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
          body.structure || "dsl"
        );
        break;

      case "email_sequence":
        prompt = emailSequencePrompt(
          {
            offer_name: offer.offer_name,
            unique_mechanism: offer.unique_mechanism,
          },
          avatar
        );
        break;

      case "sms_sequence":
        prompt = smsSequencePrompt(
          { offer_name: offer.offer_name },
          avatar
        );
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
          }
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
          body.leadMagnetType || "checklist"
        );
        maxTokens = 6000;
        break;

      default:
        return NextResponse.json(
          { error: "Type d'asset non supporté" },
          { status: 400 }
        );
    }

    // Generate asset using AI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedAsset: any = await generateJSON({ prompt, maxTokens });

    // Save asset to database
    // DB columns: title (text), content (text), ai_raw_response (jsonb)
    const { data: asset, error: saveError } = await supabase
      .from("sales_assets")
      .insert({
        user_id: user.id,
        offer_id: offerId,
        asset_type: assetType,
        title: `${assetType} — ${offer.offer_name}`,
        content: JSON.stringify(generatedAsset),
        ai_raw_response: generatedAsset,
        status: "draft",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving asset:", saveError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde de l'asset" },
        { status: 500 }
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
    };
    try { await awardXP(user.id, assetXPMap[assetType] || "generation.vsl"); } catch {}

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error generating asset:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'asset" },
      { status: 500 }
    );
  }
}
