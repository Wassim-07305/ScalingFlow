import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Monitoring continu ads (#69) ─────────────────────────────
// Check automatique des KPIs par créative avec détection d'anomalies
// Protégé par CRON_SECRET (header Authorization)

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

interface KPISnapshot {
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  frequency: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface AlertPayload {
  user_id: string;
  creative_id: string | null;
  campaign_id: string | null;
  creative_name: string;
  campaign_name: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  message: string;
  kpi_snapshot: KPISnapshot;
}

async function getMetaCredentials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
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

function detectAnomalies(
  kpi: KPISnapshot,
  config: {
    ctr_min: number;
    cpc_max: number;
    cpm_max: number;
    frequency_max: number;
    roas_min: number;
  },
  creativeName: string,
  campaignName: string,
  creativeId: string | null,
  campaignId: string | null,
  userId: string,
): AlertPayload[] {
  const alerts: AlertPayload[] = [];
  const base = {
    user_id: userId,
    creative_id: creativeId,
    campaign_id: campaignId,
    creative_name: creativeName,
    campaign_name: campaignName,
    kpi_snapshot: kpi,
  };

  if (kpi.ctr < config.ctr_min && kpi.impressions > 500) {
    alerts.push({
      ...base,
      alert_type: "low_ctr",
      severity: kpi.ctr < config.ctr_min * 0.5 ? "critical" : "warning",
      metric_name: "CTR",
      metric_value: kpi.ctr,
      threshold_value: config.ctr_min,
      message: `CTR de ${kpi.ctr.toFixed(2)}% inférieur au seuil de ${config.ctr_min}% pour "${creativeName}"`,
    });
  }

  if (kpi.cpc > config.cpc_max && kpi.clicks > 10) {
    alerts.push({
      ...base,
      alert_type: "high_cpc",
      severity: kpi.cpc > config.cpc_max * 2 ? "critical" : "warning",
      metric_name: "CPC",
      metric_value: kpi.cpc,
      threshold_value: config.cpc_max,
      message: `CPC de ${kpi.cpc.toFixed(2)}€ supérieur au seuil de ${config.cpc_max}€ pour "${creativeName}"`,
    });
  }

  if (kpi.cpm > config.cpm_max && kpi.impressions > 1000) {
    alerts.push({
      ...base,
      alert_type: "high_cpm",
      severity: kpi.cpm > config.cpm_max * 1.5 ? "critical" : "warning",
      metric_name: "CPM",
      metric_value: kpi.cpm,
      threshold_value: config.cpm_max,
      message: `CPM de ${kpi.cpm.toFixed(2)}€ supérieur au seuil de ${config.cpm_max}€ pour "${creativeName}"`,
    });
  }

  if (kpi.frequency > config.frequency_max) {
    alerts.push({
      ...base,
      alert_type: "high_frequency",
      severity:
        kpi.frequency > config.frequency_max * 1.5 ? "critical" : "warning",
      metric_name: "Fréquence",
      metric_value: kpi.frequency,
      threshold_value: config.frequency_max,
      message: `Fréquence de ${kpi.frequency.toFixed(1)} supérieure au seuil de ${config.frequency_max} pour "${creativeName}" — fatigue créative probable`,
    });
  }

  if (kpi.roas < config.roas_min && kpi.spend > 20) {
    alerts.push({
      ...base,
      alert_type: "low_roas",
      severity: kpi.roas < config.roas_min * 0.5 ? "critical" : "warning",
      metric_name: "ROAS",
      metric_value: kpi.roas,
      threshold_value: config.roas_min,
      message: `ROAS de ${kpi.roas.toFixed(2)}x inférieur au seuil de ${config.roas_min}x pour "${creativeName}"`,
    });
  }

  return alerts;
}

// POST: Check manuel déclenché par l'utilisateur
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return await runMonitoring(supabase, user.id);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du monitoring" },
      { status: 500 },
    );
  }
}

// GET: CRON automatique toutes les 6h (protégé par CRON_SECRET)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const supabase = await createClient();

    // Récupérer tous les utilisateurs avec des campagnes actives
    const { data: activeCampaigns } = await supabase
      .from("ad_campaigns")
      .select("user_id")
      .eq("status", "active");

    const uniqueUserIds = [
      ...new Set((activeCampaigns ?? []).map((c) => c.user_id)),
    ];

    const results = [];

    for (const userId of uniqueUserIds) {
      const result = await runMonitoring(supabase, userId);
      const body = await result.json();
      results.push({ userId, ...body });
    }

    return NextResponse.json({
      success: true,
      usersChecked: uniqueUserIds.length,
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du monitoring CRON" },
      { status: 500 },
    );
  }
}

async function runMonitoring(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  // Récupérer la config utilisateur
  const { data: configData } = await supabase
    .from("ad_automation_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  const config = {
    ctr_min: configData?.ctr_min ?? 1.0,
    cpc_max: configData?.cpc_max ?? 2.0,
    cpm_max: configData?.cpm_max ?? 15.0,
    frequency_max: configData?.frequency_max ?? 2.5,
    roas_min: configData?.roas_min ?? 1.0,
  };

  // Récupérer les campagnes actives
  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({
      success: true,
      alerts: [],
      message: "Aucune campagne active",
    });
  }

  const { token, adAccountId } = await getMetaCredentials(supabase, userId);

  const allAlerts: AlertPayload[] = [];

  for (const campaign of campaigns) {
    // Essayer de récupérer les données Meta en temps réel
    if (token && adAccountId && campaign.meta_campaign_id) {
      try {
        const insightsUrl = `${META_GRAPH_URL}/${campaign.meta_campaign_id}/insights?access_token=${token}&fields=impressions,clicks,spend,actions,ctr,cpc,cpm,frequency&date_preset=last_7d&level=ad`;
        const res = await fetch(insightsUrl);
        const insightsData = await res.json();

        if (insightsData.data && Array.isArray(insightsData.data)) {
          for (const insight of insightsData.data) {
            const conversions =
              insight.actions?.find(
                (a: { action_type: string }) =>
                  a.action_type === "offsite_conversion.fb_pixel_purchase" ||
                  a.action_type === "lead",
              )?.value ?? 0;
            const spend = parseFloat(insight.spend || "0");
            const revenue = conversions * 50; // estimation si pas de valeur

            const kpi: KPISnapshot = {
              ctr: parseFloat(insight.ctr || "0"),
              cpc: parseFloat(insight.cpc || "0"),
              cpm: parseFloat(insight.cpm || "0"),
              roas: spend > 0 ? revenue / spend : 0,
              frequency: parseFloat(insight.frequency || "0"),
              spend,
              impressions: parseInt(insight.impressions || "0"),
              clicks: parseInt(insight.clicks || "0"),
              conversions: parseInt(conversions),
            };

            const alerts = detectAnomalies(
              kpi,
              config,
              insight.ad_name || campaign.campaign_name,
              campaign.campaign_name,
              null,
              campaign.id,
              userId,
            );
            allAlerts.push(...alerts);
          }
        }
      } catch {
        // Fallback aux données locales si l'API Meta échoue
      }
    }

    // Fallback : utiliser les données locales des créatives
    const { data: creatives } = await supabase
      .from("ad_creatives")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    if (creatives) {
      for (const creative of creatives) {
        const kpi: KPISnapshot = {
          ctr: creative.ctr ?? 0,
          cpc: creative.clicks > 0 ? creative.spend / creative.clicks : 0,
          cpm:
            creative.impressions > 0
              ? (creative.spend / creative.impressions) * 1000
              : 0,
          roas:
            creative.spend > 0 && creative.conversions > 0
              ? (creative.conversions * 50) / creative.spend
              : 0,
          frequency: 0,
          spend: creative.spend ?? 0,
          impressions: creative.impressions ?? 0,
          clicks: creative.clicks ?? 0,
          conversions: creative.conversions ?? 0,
        };

        const alerts = detectAnomalies(
          kpi,
          config,
          creative.headline || `Creative ${creative.id.slice(0, 8)}`,
          campaign.campaign_name,
          creative.id,
          campaign.id,
          userId,
        );
        allAlerts.push(...alerts);
      }
    }
  }

  // Sauvegarder les alertes
  if (allAlerts.length > 0) {
    await supabase.from("ad_alerts").insert(allAlerts);
  }

  return NextResponse.json({
    success: true,
    alertsCount: allAlerts.length,
    alerts: allAlerts,
    campaignsChecked: campaigns.length,
  });
}
