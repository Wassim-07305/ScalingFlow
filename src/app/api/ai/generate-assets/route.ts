import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { vslScriptPrompt } from "@/lib/ai/prompts/vsl-script";
import { emailSequencePrompt } from "@/lib/ai/prompts/email-sequence";
import { smsSequencePrompt } from "@/lib/ai/prompts/sms-sequence";
import { salesScriptPrompt } from "@/lib/ai/prompts/sales-script";
import { caseStudyPrompt } from "@/lib/ai/prompts/case-study";

type AssetType = "vsl_script" | "email_sequence" | "sms_sequence" | "sales_script" | "case_study";

const VALID_ASSET_TYPES: AssetType[] = [
  "vsl_script",
  "email_sequence",
  "sms_sequence",
  "sales_script",
  "case_study",
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

    switch (assetType as AssetType) {
      case "vsl_script":
        prompt = vslScriptPrompt(offer.offer_data || offer, avatar);
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

      default:
        return NextResponse.json(
          { error: "Type d'asset non supporté" },
          { status: 400 }
        );
    }

    // Generate asset using AI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedAsset: any = await generateJSON({ prompt, maxTokens: 4096 });

    // Save asset to database
    const { data: asset, error: saveError } = await supabase
      .from("sales_assets")
      .insert({
        user_id: user.id,
        offer_id: offerId,
        asset_type: assetType,
        asset_name: `${assetType} — ${offer.offer_name}`,
        asset_data: generatedAsset,
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

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error generating asset:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'asset" },
      { status: 500 }
    );
  }
}
