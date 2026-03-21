import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Scaling progressif ads (#72) ─────────────────────────────
// +20-30% par palier avec vérification ROAS et rollback automatique

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

async function getMetaCredentials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("connected_accounts")
    .select("access_token, provider_account_id")
    .eq("user_id", userId)
    .eq("provider", "meta")
    .maybeSingle();

  if (!data?.access_token || !data?.provider_account_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("meta_access_token, meta_ad_account_id")
      .eq("id", userId)
      .maybeSingle();

    return {
      token: profile?.meta_access_token,
      adAccountId: profile?.meta_ad_account_id,
    };
  }

  return { token: data.access_token, adAccountId: data.provider_account_id };
}

// POST: Lancer un scaling sur une créative winner
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

    // Rollback manuel
    if (body.action === "rollback" && body.scaling_id) {
      return await rollbackScaling(supabase, user.id, body.scaling_id);
    }

    const { campaign_id, scale_percent, roas_threshold } = body;

    if (!campaign_id) {
      return NextResponse.json(
        { error: "campaign_id est requis" },
        { status: 400 },
      );
    }

    // Récupérer la campagne
    const { data: campaign } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 },
      );
    }

    // Récupérer la config utilisateur
    const { data: configData } = await supabase
      .from("ad_automation_config")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const effectiveScalePercent =
      scale_percent ?? configData?.scale_increment_percent ?? 20;
    const effectiveRoasThreshold =
      roas_threshold ?? configData?.scale_roas_threshold ?? 1.5;
    const maxBudget = configData?.scale_max_budget ?? 1000;

    const currentBudget = campaign.daily_budget ?? 0;
    const newBudget = Math.round(
      currentBudget * (1 + effectiveScalePercent / 100),
    );

    if (newBudget > maxBudget) {
      return NextResponse.json(
        {
          error: `Le nouveau budget (${newBudget}€) dépasse le plafond configuré (${maxBudget}€)`,
        },
        { status: 400 },
      );
    }

    // Déterminer le palier actuel
    const tierLevel =
      currentBudget < 50
        ? 1
        : currentBudget < 200
          ? 2
          : currentBudget < 500
            ? 3
            : 4;

    // Exécuter le scaling sur Meta si possible
    const { token } = await getMetaCredentials(supabase, user.id);
    let metaResult = null;

    if (token && campaign.meta_adset_id) {
      try {
        const res = await fetch(`${META_GRAPH_URL}/${campaign.meta_adset_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: token,
            daily_budget: newBudget * 100, // Meta utilise les centimes
          }),
        });
        metaResult = await res.json();

        if (metaResult.error) {
          return NextResponse.json(
            { error: `Meta: ${metaResult.error.message}` },
            { status: 502 },
          );
        }
      } catch {
        // Continue sans Meta
      }
    }

    // Mettre à jour le budget local
    await supabase
      .from("ad_campaigns")
      .update({ daily_budget: newBudget })
      .eq("id", campaign_id)
      .eq("user_id", user.id);

    // Check dans 24h
    const checkAt = new Date();
    checkAt.setHours(checkAt.getHours() + 24);

    // Sauvegarder dans l'historique
    const { data: scalingEntry } = await supabase
      .from("ad_scaling_history")
      .insert({
        user_id: user.id,
        campaign_id: campaign.id,
        adset_id: campaign.meta_adset_id,
        creative_name: campaign.campaign_name,
        campaign_name: campaign.campaign_name,
        tier_level: tierLevel,
        previous_budget: currentBudget,
        new_budget: newBudget,
        scale_percent: effectiveScalePercent,
        roas_at_scale: campaign.roas ?? 0,
        roas_threshold: effectiveRoasThreshold,
        status: "active",
        check_at: checkAt.toISOString(),
        meta_action_result: metaResult,
      })
      .select()
      .maybeSingle();

    return NextResponse.json({
      success: true,
      scaling: scalingEntry,
      previousBudget: currentBudget,
      newBudget,
      scalePercent: effectiveScalePercent,
      checkAt: checkAt.toISOString(),
      message: `Budget augmenté de ${currentBudget}€ à ${newBudget}€/jour (+${effectiveScalePercent}%). Vérification ROAS dans 24h.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du scaling" },
      { status: 500 },
    );
  }
}

// GET: CRON pour vérifier les scalings actifs (check après 24h)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const supabase = await createClient();

    // Récupérer les scalings actifs dont le check est dû
    const { data: pendingChecks } = await supabase
      .from("ad_scaling_history")
      .select("*")
      .eq("status", "active")
      .lte("check_at", new Date().toISOString());

    const results = [];

    for (const scaling of pendingChecks ?? []) {
      const { token } = await getMetaCredentials(supabase, scaling.user_id);

      let currentRoas = 0;

      // Essayer de récupérer le ROAS actuel via Meta
      if (token && scaling.adset_id) {
        try {
          const insightsUrl = `${META_GRAPH_URL}/${scaling.adset_id}/insights?access_token=${token}&fields=spend,actions&date_preset=yesterday`;
          const res = await fetch(insightsUrl);
          const data = await res.json();
          if (data.data?.[0]) {
            const spend = parseFloat(data.data[0].spend || "0");
            const conversions =
              data.data[0].actions?.find(
                (a: { action_type: string }) =>
                  a.action_type === "offsite_conversion.fb_pixel_purchase" ||
                  a.action_type === "lead",
              )?.value ?? 0;
            currentRoas = spend > 0 ? (conversions * 50) / spend : 0;
          }
        } catch {
          // Utiliser les données locales
        }
      }

      // Fallback: données de la campagne locale
      if (currentRoas === 0 && scaling.campaign_id) {
        const { data: campaign } = await supabase
          .from("ad_campaigns")
          .select("roas")
          .eq("id", scaling.campaign_id)
          .maybeSingle();
        currentRoas = campaign?.roas ?? 0;
      }

      // Vérifier le ROAS
      if (currentRoas >= scaling.roas_threshold) {
        // VALIDÉ: le ROAS tient
        await supabase
          .from("ad_scaling_history")
          .update({
            status: "validated",
            roas_after_24h: currentRoas,
            validated_at: new Date().toISOString(),
          })
          .eq("id", scaling.id);

        results.push({
          id: scaling.id,
          status: "validated",
          roas: currentRoas,
        });
      } else {
        // ROLLBACK: le ROAS a chuté
        await rollbackScaling(
          supabase,
          scaling.user_id,
          scaling.id,
          currentRoas,
        );
        results.push({
          id: scaling.id,
          status: "rollback",
          roas: currentRoas,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checksProcessed: (pendingChecks ?? []).length,
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du CRON de scaling" },
      { status: 500 },
    );
  }
}

async function rollbackScaling(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  scalingId: string,
  currentRoas?: number,
) {
  const { data: scaling } = await supabase
    .from("ad_scaling_history")
    .select("*")
    .eq("id", scalingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!scaling) {
    return NextResponse.json(
      { error: "Entrée de scaling introuvable" },
      { status: 404 },
    );
  }

  const { token } = await getMetaCredentials(supabase, userId);
  let metaResult = null;

  // Rollback sur Meta
  if (token && scaling.adset_id) {
    try {
      const res = await fetch(`${META_GRAPH_URL}/${scaling.adset_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          daily_budget: Math.round(scaling.previous_budget * 100),
        }),
      });
      metaResult = await res.json();
    } catch {
      // Continue sans Meta
    }
  }

  // Rollback local
  if (scaling.campaign_id) {
    await supabase
      .from("ad_campaigns")
      .update({ daily_budget: scaling.previous_budget })
      .eq("id", scaling.campaign_id)
      .eq("user_id", userId);
  }

  await supabase
    .from("ad_scaling_history")
    .update({
      status: "rollback",
      roas_after_24h: currentRoas ?? null,
      rollback_at: new Date().toISOString(),
      meta_action_result: metaResult,
    })
    .eq("id", scalingId);

  // Créer une décision de rollback
  await supabase.from("ad_decisions").insert({
    user_id: userId,
    campaign_id: scaling.campaign_id,
    creative_name: scaling.creative_name,
    campaign_name: scaling.campaign_name,
    decision_type: "rollback",
    reason: `ROAS ${(currentRoas ?? 0).toFixed(2)}x < seuil ${scaling.roas_threshold}x après scaling`,
    details: `Budget rollback de ${scaling.new_budget}€ à ${scaling.previous_budget}€/jour`,
    metrics_snapshot: {
      roas_at_scale: scaling.roas_at_scale,
      roas_after_24h: currentRoas,
    },
    status: "applied",
    applied_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: `Rollback effectué : budget revenu de ${scaling.new_budget}€ à ${scaling.previous_budget}€/jour`,
  });
}
