import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/gamification/xp-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();

    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: body.onboarding_step || 0,
        first_name: body.first_name || null,
        situation: body.situation || null,
        situation_details: body.situation_details || {},
        expertise_answers: body.expertise_answers || {},
        parcours: body.parcours || null,
        target_revenue: body.target_revenue || 0,
        industries: body.industries || [],
        objectives: body.objectives || [],
        budget_monthly: body.budget_monthly || 0,
        vault_completed: true,
        selected_market: body.selected_market || null,
        market_viability_score: body.market_viability_score || null,
        niche: body.niche || null,
      })
      .eq("id", user.id);

    if (dbError) {
      console.error("[onboarding/complete] DB error:", dbError);
      return NextResponse.json(
        { error: "Erreur de sauvegarde" },
        { status: 500 },
      );
    }

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "onboarding.completed");
    } catch {}

    const response = NextResponse.json({ ok: true });
    response.cookies.set("sf_onboarding", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      httpOnly: true,
    });
    return response;
  } catch (err) {
    console.error("[onboarding/complete] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
