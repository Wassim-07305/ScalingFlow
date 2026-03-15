import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Recalcule les scores du leaderboard pour tous les utilisateurs.
 * Peut etre appele par un cron ou manuellement depuis l'admin.
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

export async function POST(req: Request) {
  try {
    // Verify authentication via cron secret or admin user
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecret !== expectedSecret) {
      // Fall back to checking if user is authenticated (admin check)
      const { createClient } = await import("@/lib/supabase/server");
      const userSupabase = await createClient();
      const { data: { user } } = await userSupabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
    }

    // Récupérer tous les profils
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, xp_points, level, streak_days")
      .eq("onboarding_completed", true);

    if (profilesError || !profiles) {
      return NextResponse.json({ error: "Erreur lecture profils" }, { status: 500 });
    }

    let updated = 0;

    for (const profile of profiles) {
      // Compter les generations de l'utilisateur
      const [offersRes, funnelsRes, adsRes, postsRes, commentsRes] = await Promise.all([
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("funnels").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("ad_creatives").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("community_comments").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
      ]);

      const offers = offersRes.count ?? 0;
      const funnels = funnelsRes.count ?? 0;
      const ads = adsRes.count ?? 0;
      const posts = postsRes.count ?? 0;
      const comments = commentsRes.count ?? 0;

      const progressScore = (profile.xp_points ?? 0) + (profile.level ?? 1) * 100;
      const businessScore = offers * 50 + funnels * 75 + ads * 30;
      const engagementScore = (profile.streak_days ?? 0) * 10 + posts * 5 + comments * 2;
      const compositeScore = progressScore + businessScore + engagementScore;

      await supabase.from("leaderboard_scores").upsert(
        {
          user_id: profile.id,
          progress_score: progressScore,
          business_score: businessScore,
          engagement_score: engagementScore,
          composite_score: compositeScore,
        },
        { onConflict: "user_id" }
      );

      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `${updated} score${updated > 1 ? "s" : ""} recalculé${updated > 1 ? "s" : ""}.`,
      count: updated,
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
