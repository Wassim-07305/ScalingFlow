import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { buildCategoryOSPrompt, type CategoryOSResult } from "@/lib/ai/prompts/category-os";
import { awardXP } from "@/lib/gamification/xp-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await req.json();
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId est requis" },
        { status: 400 }
      );
    }

    // Fetch offer
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const marketAnalysis = (offer as any).market_analyses;

    // Fetch user profile for vault data
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, vault_skills, expertise_answers")
      .eq("id", user.id)
      .single();

    const prompt = buildCategoryOSPrompt({
      marketAnalysis: {
        market_name: marketAnalysis?.market_name || "Non defini",
        problems: marketAnalysis?.problems || [],
        positioning: marketAnalysis?.recommended_positioning || "",
        competitors: marketAnalysis?.competitors,
        target_avatar: marketAnalysis?.target_avatar,
      },
      offer: {
        offer_name: offer.offer_name,
        positioning: offer.positioning || "",
        unique_mechanism: offer.unique_mechanism || "",
      },
      vaultData: {
        skills: profile?.skills || [],
        expertise: profile?.expertise_answers,
      },
    });

    const categoryOS = await generateJSON<CategoryOSResult>({
      prompt,
      maxTokens: 8192,
    });

    // Update the offer with category_os data
    const { error: updateError } = await supabase
      .from("offers")
      .update({
        ai_raw_response: {
          ...(typeof offer.ai_raw_response === "object" && offer.ai_raw_response !== null
            ? offer.ai_raw_response
            : {}),
          category_os: categoryOS,
        },
      })
      .eq("id", offerId);

    if (updateError) {
      console.error("Error saving category OS:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du Category OS" },
        { status: 500 }
      );
    }

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.category_os"); } catch {}

    return NextResponse.json(categoryOS);
  } catch (error) {
    console.error("Error generating category OS:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du Category OS" },
      { status: 500 }
    );
  }
}
