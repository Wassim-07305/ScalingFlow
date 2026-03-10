import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage } from "@/lib/stripe/check-usage";
import { generateJSON } from "@/lib/ai/generate";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import {
  buildEditorialCalendarPrompt,
  type EditorialCalendarResult,
} from "@/lib/ai/prompts/editorial-calendar";

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
    const { startDate } = body as { startDate?: string };

    // Use provided start date or tomorrow
    const start =
      startDate ||
      new Date(Date.now() + 86400000).toISOString().split("T")[0];

    // Fetch user context in parallel
    const [vaultContext, { data: latestOffer }, { data: latestMarket }] =
      await Promise.all([
        buildFullVaultContext(user.id),
        supabase
          .from("offers")
          .select("offer_name, positioning, unique_mechanism, target_audience")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("market_analyses")
          .select(
            "market_name, target_audience, pain_points, sophistication_level"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

    const marketStr = latestMarket
      ? `${latestMarket.market_name || "Non defini"} — Audience: ${latestMarket.target_audience || "N/A"} — Douleurs: ${latestMarket.pain_points || "N/A"}`
      : "Marche non encore analyse";

    const offerStr = latestOffer
      ? `${latestOffer.offer_name || "Offre"} — Positionnement: ${latestOffer.positioning || "N/A"} — Mecanisme unique: ${latestOffer.unique_mechanism || "N/A"}`
      : "Offre non encore creee";

    const personaStr = latestMarket?.target_audience || latestOffer?.target_audience || "Persona non defini";

    const prompt = buildEditorialCalendarPrompt(
      marketStr,
      offerStr,
      personaStr,
      start,
      vaultContext
    );

    const result = await generateJSON<EditorialCalendarResult>({
      prompt,
      systemPrompt:
        "Tu es un expert en strategie de contenu digital. Genere un plan editorial detaille en JSON.",
      maxTokens: 8192,
      temperature: 0.8,
    });

    // Save to content_pieces for history
    await supabase.from("content_pieces").insert({
      user_id: user.id,
      content_type: "editorial_calendar",
      title: `Plan editorial — ${start}`,
      ai_raw_response: result,
      platform: "multi",
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error generating editorial calendar:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du plan editorial" },
      { status: 500 }
    );
  }
}
