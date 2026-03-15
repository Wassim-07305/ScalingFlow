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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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
          .select("offer_name, positioning, unique_mechanism")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("market_analyses")
          .select(
            "market_name, recommended_positioning, persona, target_avatar"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

    const personaJson = latestMarket?.persona || latestMarket?.target_avatar;
    const personaSummary = personaJson
      ? typeof personaJson === "string"
        ? personaJson
        : JSON.stringify(personaJson).slice(0, 300)
      : null;

    const marketStr = latestMarket
      ? `${latestMarket.market_name || "Non défini"} — Positionnement: ${latestMarket.recommended_positioning || "N/A"}`
      : "Marché non encore analysé";

    const offerStr = latestOffer
      ? `${latestOffer.offer_name || "Offre"} — Positionnement: ${latestOffer.positioning || "N/A"} — Mécanisme unique: ${latestOffer.unique_mechanism || "N/A"}`
      : "Offre non encore créée";

    const personaStr = personaSummary || "Persona non défini";

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
        "Tu es un expert en stratégie de contenu digital. Génère un plan éditorial détaillé en JSON.",
      maxTokens: 8192,
      temperature: 0.8,
    });

    // Save to content_pieces for history
    await supabase.from("content_pieces").insert({
      user_id: user.id,
      content_type: "editorial_calendar",
      title: `Plan éditorial — ${start}`,
      content: JSON.stringify(result),
      ai_raw_response: result as unknown as import("@/types/database").Json,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error generating editorial calendar:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du plan editorial" },
      { status: 500 }
    );
  }
}
