import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Recalcule les scores du leaderboard pour tous les utilisateurs.
 * Peut être appelé par un cron Vercel (GET) ou manuellement depuis l'admin (POST).
 *
 * Score composite = progress_score + business_score + engagement_score
 * - progress_score : XP + (level * 100)
 * - business_score : offers * 50 + funnels * 75 + ads * 30
 * - engagement_score : streak_days * 10 + posts * 5 + comments * 2
 */

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

async function recalculateScores() {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Configuration manquante" },
      { status: 500 },
    );
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, xp_points, level, streak_days")
    .eq("onboarding_completed", true);

  if (profilesError || !profiles) {
    return NextResponse.json(
      { error: "Erreur lecture profils" },
      { status: 500 },
    );
  }

  let updated = 0;

  for (const profile of profiles) {
    const [offersRes, funnelsRes, adsRes, postsRes, commentsRes] =
      await Promise.all([
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
        supabase
          .from("funnels")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
        supabase
          .from("ad_creatives")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
        supabase
          .from("community_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
        supabase
          .from("community_comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
      ]);

    const offers = offersRes.count ?? 0;
    const funnels = funnelsRes.count ?? 0;
    const ads = adsRes.count ?? 0;
    const posts = postsRes.count ?? 0;
    const comments = commentsRes.count ?? 0;

    const progressScore = (profile.xp_points ?? 0) + (profile.level ?? 1) * 100;
    const businessScore = offers * 50 + funnels * 75 + ads * 30;
    const engagementScore =
      (profile.streak_days ?? 0) * 10 + posts * 5 + comments * 2;
    const compositeScore = progressScore + businessScore + engagementScore;

    await supabase.from("leaderboard_scores").upsert(
      {
        user_id: profile.id,
        progress_score: progressScore,
        business_score: businessScore,
        engagement_score: engagementScore,
        composite_score: compositeScore,
      },
      { onConflict: "user_id" },
    );

    updated++;
  }

  return NextResponse.json({
    success: true,
    message: `${updated} score${updated > 1 ? "s" : ""} recalculé${updated > 1 ? "s" : ""}.`,
    count: updated,
  });
}

// GET: Vercel CRON (protégé par Authorization: Bearer CRON_SECRET)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return await recalculateScores();
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// POST: Appel manuel depuis l'admin
export async function POST(req: Request) {
  try {
    const cronSecret =
      req.headers.get("x-cron-secret") ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecret !== expectedSecret) {
      const { createClient: createServerClient } =
        await import("@/lib/supabase/server");
      const userSupabase = await createServerClient();
      const {
        data: { user },
      } = await userSupabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    return await recalculateScores();
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
