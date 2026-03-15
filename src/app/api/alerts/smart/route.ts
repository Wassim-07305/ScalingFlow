import { NextRequest, NextResponse } from "next/server";

// ─── F68 Alertes intelligentes complètes ─────────────────────
// Détecte : procrastination, semaine blanche, budget sans ROAS,
// KPI rouge, pas d'activité depuis X jours

async function getAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

interface SmartAlert {
  user_id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  action_url?: string;
  data?: Record<string, unknown>;
}

async function runSmartAlerts() {
  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const alerts: SmartAlert[] = [];

  // Récupérer tous les utilisateurs actifs
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, xp_points, streak_days, last_activity_at, onboarding_completed")
    .eq("onboarding_completed", true);

  const now = new Date();

  for (const profile of profiles ?? []) {
    const userId = profile.id as string;

    // ─── 1. Détection procrastination ────────────────────
    // Pas d'activité depuis 3+ jours
    const lastActivity = profile.last_activity_at
      ? new Date(profile.last_activity_at as string)
      : null;

    if (lastActivity) {
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceActivity >= 7) {
        alerts.push({
          user_id: userId,
          alert_type: "procrastination",
          severity: "critical",
          title: "Inactivité prolongée",
          message: `Tu n'as rien fait depuis ${daysSinceActivity} jours. Chaque jour sans action = des opportunités perdues. Commence par une petite action : génère 1 contenu ou analyse 1 métrique.`,
          action_url: "/content",
        });
      } else if (daysSinceActivity >= 3) {
        alerts.push({
          user_id: userId,
          alert_type: "procrastination",
          severity: "warning",
          title: "Pas d'activité depuis 3 jours",
          message: `Ta dernière action date de ${daysSinceActivity} jours. Maintiens le momentum ! 15 minutes suffisent pour avancer.`,
          action_url: "/roadmap",
        });
      }
    }

    // ─── 2. Semaine blanche ──────────────────────────────
    // Aucun contenu généré cette semaine
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { count: weeklyContentCount } = await supabase
      .from("content_library")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString());

    const { count: weeklyAdsCount } = await supabase
      .from("ad_creatives")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString());

    if ((weeklyContentCount ?? 0) === 0 && (weeklyAdsCount ?? 0) === 0) {
      alerts.push({
        user_id: userId,
        alert_type: "blank_week",
        severity: "warning",
        title: "Semaine blanche détectée",
        message: "Aucun contenu ni créative générés cette semaine. La régularité est la clé du scaling. Lance une génération de contenu hebdomadaire maintenant.",
        action_url: "/content",
        data: { weeklyContentCount: weeklyContentCount ?? 0, weeklyAdsCount: weeklyAdsCount ?? 0 },
      });
    }

    // ─── 3. Budget sans ROAS ─────────────────────────────
    // Campagnes avec budget dépensé mais ROAS < 0.5
    const { data: lowRoasCampaigns } = await supabase
      .from("ad_campaigns")
      .select("id, campaign_name, roas, daily_budget, spend")
      .eq("user_id", userId)
      .eq("status", "active")
      .lt("roas", 0.5)
      .gt("spend", 50);

    if (lowRoasCampaigns && lowRoasCampaigns.length > 0) {
      const totalWasted = lowRoasCampaigns.reduce((s, c) => s + ((c.spend as number) ?? 0), 0);
      alerts.push({
        user_id: userId,
        alert_type: "budget_no_roas",
        severity: "critical",
        title: `${lowRoasCampaigns.length} campagne(s) brûlent du budget`,
        message: `${totalWasted.toFixed(0)}€ dépensés avec un ROAS < 0.5x. Considère de pauser ces campagnes et d'optimiser tes créatives avant de relancer.`,
        action_url: "/ads",
        data: {
          campaigns: lowRoasCampaigns.map((c) => ({
            name: c.campaign_name,
            roas: c.roas,
            spend: c.spend,
          })),
        },
      });
    }

    // ─── 4. Streak cassé ─────────────────────────────────
    if ((profile.streak_days as number) === 0 && (profile.xp_points as number) > 100) {
      alerts.push({
        user_id: userId,
        alert_type: "streak_broken",
        severity: "info",
        title: "Streak perdu !",
        message: "Ta série de jours consécutifs est retombée à 0. Reconnecte-toi aujourd'hui pour relancer ta série et garder tes bonus XP.",
        action_url: "/progress",
      });
    }

    // ─── 5. Funnel non complété ──────────────────────────
    const { count: funnelCount } = await supabase
      .from("funnels")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "published");

    const { count: offerCount } = await supabase
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((offerCount ?? 0) > 0 && (funnelCount ?? 0) === 0) {
      alerts.push({
        user_id: userId,
        alert_type: "funnel_missing",
        severity: "warning",
        title: "Offre sans funnel",
        message: "Tu as créé une offre mais aucun funnel n'est publié. Sans funnel, tes leads n'ont nulle part où aller. Déploie ton funnel maintenant.",
        action_url: "/funnel",
      });
    }
  }

  // Sauvegarder toutes les alertes
  if (alerts.length > 0) {
    await supabase.from("smart_alerts").insert(
      alerts.map((a) => ({
        user_id: a.user_id,
        alert_type: a.alert_type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        action_url: a.action_url,
        data: a.data || {},
        read: false,
        created_at: new Date().toISOString(),
      }))
    );
  }

  return NextResponse.json({
    success: true,
    message: `${alerts.length} alerte(s) intelligente(s) générée(s) pour ${(profiles ?? []).length} utilisateur(s).`,
    alertCount: alerts.length,
    breakdown: {
      procrastination: alerts.filter((a) => a.alert_type === "procrastination").length,
      blank_week: alerts.filter((a) => a.alert_type === "blank_week").length,
      budget_no_roas: alerts.filter((a) => a.alert_type === "budget_no_roas").length,
      streak_broken: alerts.filter((a) => a.alert_type === "streak_broken").length,
      funnel_missing: alerts.filter((a) => a.alert_type === "funnel_missing").length,
    },
  });
}

// GET: Vercel CRON (quotidien)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return await runSmartAlerts();
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// POST: Manuel
export async function POST(req: NextRequest) {
  try {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return await runSmartAlerts();
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
