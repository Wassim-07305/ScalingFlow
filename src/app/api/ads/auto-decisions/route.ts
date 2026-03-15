import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Décisions automatiques ads (#70) ─────────────────────────
// Coupe losers, scale winners, réalloue budget, détecte fatigue créative
// Protégé par CRON_SECRET (header Authorization)

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

interface DecisionPayload {
  user_id: string;
  creative_id: string | null;
  campaign_id: string | null;
  creative_name: string;
  campaign_name: string;
  decision_type: "pause" | "scale" | "maintain" | "creative_fatigue" | "reallocate" | "rollback";
  reason: string;
  details: string;
  metrics_snapshot: Record<string, unknown>;
  meta_action: string | null;
  meta_action_payload: Record<string, unknown> | null;
  status: "pending" | "applied";
}

async function getMetaCredentials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("connected_accounts")
    .select("access_token, provider_account_id")
    .eq("user_id", userId)
    .eq("provider", "meta")
    .single();

  if (!data?.access_token || !data?.provider_account_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("meta_access_token, meta_ad_account_id")
      .eq("id", userId)
      .single();

    return {
      token: profile?.meta_access_token,
      adAccountId: profile?.meta_ad_account_id,
    };
  }

  return { token: data.access_token, adAccountId: data.provider_account_id };
}

async function metaPost(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// POST: Exécution manuelle par l'utilisateur
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

    // Si c'est une action spécifique sur une décision existante
    if (body.action === "apply" && body.decision_id) {
      return await applyDecision(supabase, user.id, body.decision_id);
    }

    if (body.action === "cancel" && body.decision_id) {
      const { error } = await supabase
        .from("ad_decisions")
        .update({ status: "cancelled" })
        .eq("id", body.decision_id)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: "Erreur lors de l'annulation" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Sinon, lancer l'analyse complète
    return await runAutoDecisions(supabase, user.id);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'analyse des décisions" },
      { status: 500 }
    );
  }
}

// GET: CRON automatique (protégé par CRON_SECRET)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const supabase = await createClient();

    // Récupérer les utilisateurs avec l'automatisation activée
    const { data: configs } = await supabase
      .from("ad_automation_config")
      .select("user_id")
      .eq("enabled", true);

    const results = [];

    for (const config of configs ?? []) {
      const result = await runAutoDecisions(supabase, config.user_id);
      const body = await result.json();
      results.push({ userId: config.user_id, ...body });
    }

    return NextResponse.json({
      success: true,
      usersProcessed: (configs ?? []).length,
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du CRON des décisions auto" },
      { status: 500 }
    );
  }
}

// PATCH: Toggle activation ON/OFF
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { enabled } = await req.json();

    const { error } = await supabase
      .from("ad_automation_config")
      .upsert(
        { user_id: user.id, enabled: !!enabled },
        { onConflict: "user_id" }
      );

    if (error) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    return NextResponse.json({ success: true, enabled: !!enabled });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

async function applyDecision(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  decisionId: string
) {
  const { data: decision } = await supabase
    .from("ad_decisions")
    .select("*")
    .eq("id", decisionId)
    .eq("user_id", userId)
    .single();

  if (!decision) {
    return NextResponse.json({ error: "Décision introuvable" }, { status: 404 });
  }

  const { token } = await getMetaCredentials(supabase, userId);
  let metaResult = null;

  // Exécuter l'action Meta si possible
  if (token && decision.meta_action_payload) {
    try {
      if (decision.decision_type === "pause" && decision.meta_action_payload.adset_id) {
        metaResult = await metaPost(
          `${META_GRAPH_URL}/${decision.meta_action_payload.adset_id}`,
          { access_token: token, status: "PAUSED" }
        );
      } else if (decision.decision_type === "scale" && decision.meta_action_payload.adset_id) {
        metaResult = await metaPost(
          `${META_GRAPH_URL}/${decision.meta_action_payload.adset_id}`,
          {
            access_token: token,
            daily_budget: decision.meta_action_payload.new_budget_cents,
          }
        );
      }
    } catch {
      // L'action Meta a échoué, on continue quand même
    }
  }

  // Mettre à jour le statut local
  if (decision.decision_type === "pause" && decision.creative_id) {
    await supabase
      .from("ad_creatives")
      .update({ status: "paused" })
      .eq("id", decision.creative_id)
      .eq("user_id", userId);
  }

  await supabase
    .from("ad_decisions")
    .update({
      status: "applied",
      applied_at: new Date().toISOString(),
      meta_action_result: metaResult,
    })
    .eq("id", decisionId)
    .eq("user_id", userId);

  return NextResponse.json({ success: true, metaResult });
}

async function runAutoDecisions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  // Récupérer la config
  const { data: configData } = await supabase
    .from("ad_automation_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  const config = {
    winner_roas_min: configData?.winner_roas_min ?? 2.0,
    winner_ctr_min: configData?.winner_ctr_min ?? 2.0,
    winner_spend_min: configData?.winner_spend_min ?? 50.0,
    loser_roas_max: configData?.loser_roas_max ?? 0.5,
    loser_min_impressions: configData?.loser_min_impressions ?? 100,
    fatigue_frequency_max: configData?.fatigue_frequency_max ?? 3.0,
    fatigue_ctr_drop_percent: configData?.fatigue_ctr_drop_percent ?? 30.0,
    scale_increment_percent: configData?.scale_increment_percent ?? 20.0,
    enabled: configData?.enabled ?? false,
  };

  // Récupérer les campagnes actives avec leurs créatives
  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  const { data: creatives } = await supabase
    .from("ad_creatives")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "ready"]);

  if (!campaigns?.length && !creatives?.length) {
    return NextResponse.json({
      success: true,
      decisions: [],
      message: "Aucune campagne ou créative active",
    });
  }

  const { token } = await getMetaCredentials(supabase, userId);

  // Récupérer les métriques récentes via Meta API si possible
  const creativeMetrics = new Map<string, Record<string, number>>();

  if (token && campaigns) {
    for (const campaign of campaigns) {
      if (!campaign.meta_campaign_id) continue;
      try {
        const insightsUrl = `${META_GRAPH_URL}/${campaign.meta_campaign_id}/insights?access_token=${token}&fields=impressions,clicks,spend,actions,ctr,cpc,cpm,frequency&date_preset=last_3d&level=ad`;
        const res = await fetch(insightsUrl);
        const data = await res.json();
        if (data.data) {
          for (const insight of data.data) {
            const conversions =
              insight.actions?.find(
                (a: { action_type: string }) =>
                  a.action_type === "offsite_conversion.fb_pixel_purchase" ||
                  a.action_type === "lead"
              )?.value ?? 0;
            const spend = parseFloat(insight.spend || "0");
            creativeMetrics.set(insight.ad_id || insight.adset_id, {
              ctr: parseFloat(insight.ctr || "0"),
              cpc: parseFloat(insight.cpc || "0"),
              cpm: parseFloat(insight.cpm || "0"),
              frequency: parseFloat(insight.frequency || "0"),
              spend,
              impressions: parseInt(insight.impressions || "0"),
              clicks: parseInt(insight.clicks || "0"),
              conversions: parseInt(conversions),
              roas: spend > 0 ? (conversions * 50) / spend : 0,
            });
          }
        }
      } catch {
        // Continue avec les données locales
      }
    }
  }

  const decisions: DecisionPayload[] = [];

  // Analyser chaque créative
  for (const creative of creatives ?? []) {
    const metaMetrics = creative.meta_ad_id
      ? creativeMetrics.get(creative.meta_ad_id)
      : null;

    const ctr = metaMetrics?.ctr ?? creative.ctr ?? 0;
    const spend = metaMetrics?.spend ?? creative.spend ?? 0;
    const impressions = metaMetrics?.impressions ?? creative.impressions ?? 0;
    const conversions = metaMetrics?.conversions ?? creative.conversions ?? 0;
    const roas = spend > 0 && conversions > 0 ? (conversions * 50) / spend : 0;
    const frequency = metaMetrics?.frequency ?? 0;
    const cpc = metaMetrics?.cpc ?? (creative.clicks > 0 ? spend / creative.clicks : 0);

    const campaignForCreative = campaigns?.find((c) =>
      c.id === creative.campaign_id || c.meta_campaign_id
    );
    const campaignName = campaignForCreative?.campaign_name ?? "Campagne inconnue";
    const creativeName = creative.headline || `Creative ${creative.id.slice(0, 8)}`;

    const metrics = { ctr, spend, impressions, conversions, roas, frequency, cpc };

    // WINNER: ROAS > 2 + CTR > 2% + spend > 50€
    if (
      roas > config.winner_roas_min &&
      ctr > config.winner_ctr_min &&
      spend > config.winner_spend_min
    ) {
      const currentBudget = campaignForCreative?.daily_budget ?? 0;
      const newBudget = Math.round(currentBudget * (1 + config.scale_increment_percent / 100));

      decisions.push({
        user_id: userId,
        creative_id: creative.id,
        campaign_id: campaignForCreative?.id ?? null,
        creative_name: creativeName,
        campaign_name: campaignName,
        decision_type: "scale",
        reason: `ROAS ${roas.toFixed(1)}x + CTR ${ctr.toFixed(1)}% — Performance excellente`,
        details: `Augmenter le budget de ${currentBudget}€/j à ${newBudget}€/j (+${config.scale_increment_percent}%)`,
        metrics_snapshot: metrics,
        meta_action: "increase_budget",
        meta_action_payload: campaignForCreative?.meta_adset_id
          ? {
              adset_id: campaignForCreative.meta_adset_id,
              new_budget_cents: newBudget * 100,
            }
          : null,
        status: "pending",
      });
      continue;
    }

    // LOSER: ROAS < 0.5 après 100 impressions
    if (roas < config.loser_roas_max && impressions > config.loser_min_impressions) {
      decisions.push({
        user_id: userId,
        creative_id: creative.id,
        campaign_id: campaignForCreative?.id ?? null,
        creative_name: creativeName,
        campaign_name: campaignName,
        decision_type: "pause",
        reason: `ROAS ${roas.toFixed(2)}x < seuil ${config.loser_roas_max}x après ${impressions} impressions`,
        details: `Mettre en pause la créative — budget à réallouer`,
        metrics_snapshot: metrics,
        meta_action: "pause_adset",
        meta_action_payload: campaignForCreative?.meta_adset_id
          ? { adset_id: campaignForCreative.meta_adset_id }
          : null,
        status: "pending",
      });
      continue;
    }

    // FATIGUE CRÉATIVE: frequency > 3 ou CTR drop > 30%
    if (frequency > config.fatigue_frequency_max) {
      decisions.push({
        user_id: userId,
        creative_id: creative.id,
        campaign_id: campaignForCreative?.id ?? null,
        creative_name: creativeName,
        campaign_name: campaignName,
        decision_type: "creative_fatigue",
        reason: `Fréquence ${frequency.toFixed(1)} > seuil ${config.fatigue_frequency_max} — fatigue créative détectée`,
        details: `Préparer de nouvelles variations basées sur le même angle`,
        metrics_snapshot: metrics,
        meta_action: null,
        meta_action_payload: null,
        status: "pending",
      });
      continue;
    }

    // MAINTAIN: tout le reste
    if (spend > 10) {
      decisions.push({
        user_id: userId,
        creative_id: creative.id,
        campaign_id: campaignForCreative?.id ?? null,
        creative_name: creativeName,
        campaign_name: campaignName,
        decision_type: "maintain",
        reason: `Performances stables — ROAS ${roas.toFixed(1)}x, CTR ${ctr.toFixed(1)}%`,
        details: `Continuer le test en l'état`,
        metrics_snapshot: metrics,
        meta_action: null,
        meta_action_payload: null,
        status: "applied",
      });
    }
  }

  // Sauvegarder les décisions
  if (decisions.length > 0) {
    await supabase.from("ad_decisions").insert(decisions);
  }

  return NextResponse.json({
    success: true,
    decisionsCount: decisions.length,
    decisions,
    summary: {
      scale: decisions.filter((d) => d.decision_type === "scale").length,
      pause: decisions.filter((d) => d.decision_type === "pause").length,
      fatigue: decisions.filter((d) => d.decision_type === "creative_fatigue").length,
      maintain: decisions.filter((d) => d.decision_type === "maintain").length,
    },
  });
}
