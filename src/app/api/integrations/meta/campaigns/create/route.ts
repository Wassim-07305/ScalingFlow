import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Meta Campaign Launcher API (#59) ────────────────────────
// POST: Create Campaign → Ad Set → Ad Creative → Ad via Meta Marketing API
// Launches a complete campaign without touching Ads Manager

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
      .select("meta_access_token, meta_ad_account_id, meta_page_id")
      .eq("id", userId)
      .single();

    return {
      token: profile?.meta_access_token,
      adAccountId: profile?.meta_ad_account_id,
      pageId: profile?.meta_page_id,
    };
  }

  return {
    token: data.access_token,
    adAccountId: data.provider_account_id,
    pageId: null,
  };
}

async function metaPost(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { token, adAccountId, pageId } = await getMetaCredentials(
      supabase,
      user.id,
    );

    if (!token || !adAccountId) {
      return NextResponse.json(
        {
          error:
            "Connecte ton compte Meta Ads dans Paramètres → Intégrations pour lancer des campagnes automatiquement.",
          code: "META_NOT_CONNECTED",
        },
        { status: 400 },
      );
    }

    const body = await req.json();
    const {
      campaign_name,
      objective = "OUTCOME_LEADS",
      daily_budget,
      audience_id,
      audience_targeting,
      excluded_audience_ids,
      creative_text,
      creative_headline,
      creative_image_url,
      creative_cta = "LEARN_MORE",
      landing_page_url,
      start_date,
      end_date,
      page_id,
    } = body;

    if (!campaign_name || !daily_budget) {
      return NextResponse.json(
        { error: "Le nom de la campagne et le budget journalier sont requis." },
        { status: 400 },
      );
    }

    if (!landing_page_url && !creative_image_url) {
      return NextResponse.json(
        {
          error:
            "Un lien de destination ou une image est requis pour créer la publicité.",
        },
        { status: 400 },
      );
    }

    // ─── Step 1: Create Campaign ──────────────────────────────
    const campaignRes = await metaPost(
      `${META_GRAPH_URL}/act_${adAccountId}/campaigns`,
      {
        access_token: token,
        name: campaign_name,
        objective,
        status: "PAUSED",
        special_ad_categories: [],
      },
    );

    if (campaignRes.error) {
      return NextResponse.json(
        { error: `Erreur campagne : ${campaignRes.error.message}` },
        { status: 502 },
      );
    }

    const metaCampaignId = campaignRes.id;

    // ─── Step 2: Create Ad Set ────────────────────────────────
    const targeting: Record<string, unknown> = audience_targeting || {
      geo_locations: { countries: ["FR"] },
      age_min: 25,
      age_max: 55,
    };

    if (audience_id) {
      targeting.custom_audiences = [{ id: audience_id }];
    }

    if (excluded_audience_ids && excluded_audience_ids.length > 0) {
      targeting.excluded_custom_audiences = excluded_audience_ids.map(
        (id: string) => ({ id }),
      );
    }

    const adSetBody: Record<string, unknown> = {
      access_token: token,
      name: `${campaign_name} — Ad Set`,
      campaign_id: metaCampaignId,
      daily_budget: Math.round(daily_budget * 100), // Meta uses cents
      billing_event: "IMPRESSIONS",
      optimization_goal:
        objective === "OUTCOME_LEADS"
          ? "LEAD_GENERATION"
          : objective === "OUTCOME_TRAFFIC"
            ? "LINK_CLICKS"
            : "REACH",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      status: "PAUSED",
      targeting,
    };

    if (start_date) {
      adSetBody.start_time = start_date;
    }
    if (end_date) {
      adSetBody.end_time = end_date;
    }

    const adSetRes = await metaPost(
      `${META_GRAPH_URL}/act_${adAccountId}/adsets`,
      adSetBody,
    );

    if (adSetRes.error) {
      return NextResponse.json(
        { error: `Erreur ad set : ${adSetRes.error.message}` },
        { status: 502 },
      );
    }

    const metaAdSetId = adSetRes.id;

    // ─── Step 3: Create Ad Creative ───────────────────────────
    const effectivePageId = page_id || pageId;

    let metaCreativeId: string | null = null;

    if (creative_image_url && landing_page_url && effectivePageId) {
      const creativeRes = await metaPost(
        `${META_GRAPH_URL}/act_${adAccountId}/adcreatives`,
        {
          access_token: token,
          name: `${campaign_name} — Creative`,
          object_story_spec: {
            page_id: effectivePageId,
            link_data: {
              message: creative_text || "",
              link: landing_page_url,
              name: creative_headline || campaign_name,
              call_to_action: { type: creative_cta },
              picture: creative_image_url,
            },
          },
        },
      );

      if (creativeRes.error) {
        return NextResponse.json(
          { error: `Erreur creative : ${creativeRes.error.message}` },
          { status: 502 },
        );
      }
      metaCreativeId = creativeRes.id;
    }

    // ─── Step 4: Create Ad ────────────────────────────────────
    let metaAdId: string | null = null;

    if (metaCreativeId) {
      const adRes = await metaPost(`${META_GRAPH_URL}/act_${adAccountId}/ads`, {
        access_token: token,
        name: `${campaign_name} — Ad`,
        adset_id: metaAdSetId,
        creative: { creative_id: metaCreativeId },
        status: "PAUSED",
      });

      if (adRes.error) {
        return NextResponse.json(
          { error: `Erreur publicité : ${adRes.error.message}` },
          { status: 502 },
        );
      }
      metaAdId = adRes.id;
    }

    // ─── Step 5: Save to local DB ─────────────────────────────
    const { data: campaign } = await supabase
      .from("ad_campaigns")
      .upsert(
        {
          user_id: user.id,
          campaign_name,
          campaign_type:
            objective === "OUTCOME_LEADS"
              ? "conversions"
              : objective === "OUTCOME_TRAFFIC"
                ? "traffic"
                : "reach",
          daily_budget,
          meta_campaign_id: metaCampaignId,
          meta_adset_id: metaAdSetId,
          audience_config: targeting,
          status: "paused",
          start_date: start_date || null,
        },
        { onConflict: "meta_campaign_id" },
      )
      .select()
      .single();

    return NextResponse.json({
      success: true,
      campaign,
      meta: {
        campaign_id: metaCampaignId,
        adset_id: metaAdSetId,
        creative_id: metaCreativeId,
        ad_id: metaAdId,
      },
      message:
        "Campagne créée en mode PAUSE. Tu peux l'activer depuis l'onglet Campagnes ou directement dans Meta Ads Manager.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création de la campagne" },
      { status: 500 },
    );
  }
}
