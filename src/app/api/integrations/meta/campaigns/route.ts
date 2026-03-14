import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Meta Ads Campaign Creation (#59) ────────────────────────
// POST: Create campaign + ad set + ad on Meta Ads
// Deploys a full campaign from ScalingFlow creative data

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

async function getMetaCredentials(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { token, adAccountId } = await getMetaCredentials(supabase, user.id);
    if (!token || !adAccountId) {
      return NextResponse.json(
        { error: "Connecte ton compte Meta Ads d'abord." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      campaign_name,
      objective = "OUTCOME_LEADS",
      daily_budget,
      // Ad set config
      targeting,
      audience_id,
      start_date,
      // Ad config
      creative_id,      // ScalingFlow creative ID
      ad_copy,
      headline,
      cta = "LEARN_MORE",
      image_url,
      link_url,
    } = body;

    if (!campaign_name || !daily_budget) {
      return NextResponse.json(
        { error: "campaign_name et daily_budget sont requis" },
        { status: 400 }
      );
    }

    // 1. Create Campaign
    const campaignRes = await metaPost(
      `${META_GRAPH_URL}/act_${adAccountId}/campaigns`,
      {
        access_token: token,
        name: campaign_name,
        objective,
        status: "PAUSED", // Start paused for safety
        special_ad_categories: [],
      }
    );

    if (campaignRes.error) {
      return NextResponse.json(
        { error: `Campagne: ${campaignRes.error.message}` },
        { status: 502 }
      );
    }

    const metaCampaignId = campaignRes.id;

    // 2. Create Ad Set
    const adSetBody: Record<string, unknown> = {
      access_token: token,
      name: `${campaign_name} — Ad Set`,
      campaign_id: metaCampaignId,
      daily_budget: Math.round(daily_budget * 100), // Meta uses cents
      billing_event: "IMPRESSIONS",
      optimization_goal: objective === "OUTCOME_LEADS" ? "LEAD_GENERATION" : "LINK_CLICKS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      status: "PAUSED",
      targeting: targeting || {
        geo_locations: { countries: ["FR"] },
        age_min: 25,
        age_max: 55,
      },
    };

    if (audience_id) {
      adSetBody.targeting = {
        ...((adSetBody.targeting as Record<string, unknown>) || {}),
        custom_audiences: [{ id: audience_id }],
      };
    }

    if (start_date) {
      adSetBody.start_time = start_date;
    }

    const adSetRes = await metaPost(
      `${META_GRAPH_URL}/act_${adAccountId}/adsets`,
      adSetBody
    );

    if (adSetRes.error) {
      return NextResponse.json(
        { error: `Ad Set: ${adSetRes.error.message}` },
        { status: 502 }
      );
    }

    const metaAdSetId = adSetRes.id;

    // 3. Create Ad Creative
    let metaAdCreativeId: string | null = null;

    if (image_url && link_url) {
      const creativeRes = await metaPost(
        `${META_GRAPH_URL}/act_${adAccountId}/adcreatives`,
        {
          access_token: token,
          name: `${campaign_name} — Creative`,
          object_story_spec: {
            link_data: {
              message: ad_copy || "",
              link: link_url,
              name: headline || campaign_name,
              call_to_action: { type: cta },
              picture: image_url,
            },
            page_id: body.page_id,
          },
        }
      );

      if (creativeRes.error) {
        return NextResponse.json(
          { error: `Creative: ${creativeRes.error.message}` },
          { status: 502 }
        );
      }
      metaAdCreativeId = creativeRes.id;
    }

    // 4. Create Ad
    let metaAdId: string | null = null;

    if (metaAdCreativeId) {
      const adRes = await metaPost(
        `${META_GRAPH_URL}/act_${adAccountId}/ads`,
        {
          access_token: token,
          name: `${campaign_name} — Ad`,
          adset_id: metaAdSetId,
          creative: { creative_id: metaAdCreativeId },
          status: "PAUSED",
        }
      );

      if (adRes.error) {
        return NextResponse.json(
          { error: `Ad: ${adRes.error.message}` },
          { status: 502 }
        );
      }
      metaAdId = adRes.id;
    }

    // 5. Save to local DB
    const { data: campaign } = await supabase
      .from("ad_campaigns")
      .upsert(
        {
          user_id: user.id,
          campaign_name,
          campaign_type: objective === "OUTCOME_LEADS" ? "conversions" : "traffic",
          daily_budget,
          meta_campaign_id: metaCampaignId,
          meta_adset_id: metaAdSetId,
          audience_config: targeting || null,
          status: "paused",
          start_date: start_date || null,
        },
        { onConflict: "meta_campaign_id" }
      )
      .select()
      .single();

    // Update creative with Meta ad ID if we had one
    if (creative_id && metaAdId) {
      await supabase
        .from("ad_creatives")
        .update({ meta_ad_id: metaAdId, status: "ready" })
        .eq("id", creative_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      campaign,
      meta: {
        campaign_id: metaCampaignId,
        adset_id: metaAdSetId,
        creative_id: metaAdCreativeId,
        ad_id: metaAdId,
      },
      message: "Campagne créée en mode PAUSE. Active-la depuis Meta Ads Manager ou depuis l'app.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la creation de la campagne" },
      { status: 500 }
    );
  }
}

// Activate / Pause a campaign
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { token } = await getMetaCredentials(supabase, user.id);
    if (!token) {
      return NextResponse.json({ error: "Meta non connecte" }, { status: 400 });
    }

    const { meta_campaign_id, status } = await req.json();

    if (!meta_campaign_id || !status) {
      return NextResponse.json(
        { error: "meta_campaign_id et status requis" },
        { status: 400 }
      );
    }

    const metaStatus = status === "active" ? "ACTIVE" : "PAUSED";

    const res = await fetch(`${META_GRAPH_URL}/${meta_campaign_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        status: metaStatus,
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: `Meta: ${data.error.message}` },
        { status: 502 }
      );
    }

    // Update local DB
    await supabase
      .from("ad_campaigns")
      .update({ status })
      .eq("meta_campaign_id", meta_campaign_id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, status });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour" },
      { status: 500 }
    );
  }
}
