import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  buildInstagramProfilePrompt,
  type InstagramProfileResult,
} from "@/lib/ai/prompts/instagram-profile";
import { awardXP } from "@/lib/gamification/xp-engine";
import { buildFullVaultContext } from "@/lib/ai/vault-context";

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


    // Recuperer le profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Recuperer la derniere analyse de marche
    const { data: latestAnalysis } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Recuperer la derniere offre
    const { data: latestOffer } = await supabase
      .from("offers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const marketContext =
      latestAnalysis?.market ||
      profile?.target_market ||
      "Freelances et consultants IA";
    const offerContext = latestOffer
      ? `${latestOffer.offer_name} - ${latestOffer.positioning || ""}`
      : "Offre de consulting/formation";

    const body = await req.json();
    const brandContext =
      body.brand ||
      profile?.full_name ||
      "Expert en IA et automatisation";

    const vaultContext = await buildFullVaultContext(user.id);

    const basePrompt = buildInstagramProfilePrompt(
      marketContext,
      offerContext,
      brandContext
    );
    const prompt = vaultContext ? basePrompt + "\n" + vaultContext : basePrompt;

    const result = await generateJSON<InstagramProfileResult>({
      prompt,
      maxTokens: 4096,
    });

    // Award XP (non-blocking)
    try { await awardXP(user.id, "generation.content_strategy"); } catch {}

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error optimizing Instagram profile:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'optimisation du profil Instagram" },
      { status: 500 }
    );
  }
}
