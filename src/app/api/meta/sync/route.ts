import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  insights?: {
    data?: Array<{
      spend: string;
      impressions: string;
      clicks: string;
      conversions?: string;
      actions?: Array<{ action_type: string; value: string }>;
    }>;
  };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les tokens Meta depuis le profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("meta_access_token, meta_ad_account_id")
      .eq("id", user.id)
      .single();

    if (!profile?.meta_access_token || !profile?.meta_ad_account_id) {
      return NextResponse.json(
        { error: "Configure ton compte Meta Ads dans les paramètres." },
        { status: 400 },
      );
    }

    const { meta_access_token, meta_ad_account_id } = profile;

    // Normalize ad account ID — remove act_ prefix if already present
    const adAccountId = meta_ad_account_id.replace(/^act_/, "");

    // Appeler l'API Meta Ads pour recuperer les campagnes
    const campaignsUrl = `${META_GRAPH_URL}/act_${adAccountId}/campaigns?fields=id,name,status,objective&access_token=${meta_access_token}&limit=50`;
    console.log("[meta-sync] Fetching campaigns for ad account:", adAccountId);

    const campaignsResponse = await fetch(campaignsUrl);

    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json().catch(() => null);
      const errorMsg = errorData?.error?.message || "Erreur API Meta Ads";
      return NextResponse.json(
        { error: `Erreur Meta Ads : ${errorMsg}` },
        { status: 502 },
      );
    }

    const campaignsData = await campaignsResponse.json();
    console.log("[meta-sync] Meta API response:", JSON.stringify(campaignsData).slice(0, 500));
    const campaigns: MetaCampaign[] = campaignsData.data || [];

    const admin = createAdminClient();

    // Map Meta objective to valid campaign_type
    const objectiveToType = (objective: string): string => {
      switch (objective) {
        case "OUTCOME_AWARENESS":
        case "BRAND_AWARENESS":
        case "REACH":
          return "awareness";
        case "OUTCOME_TRAFFIC":
        case "LINK_CLICKS":
          return "traffic";
        case "OUTCOME_SALES":
        case "CONVERSIONS":
        case "PRODUCT_CATALOG_SALES":
          return "conversions";
        case "OUTCOME_ENGAGEMENT":
        case "OUTCOME_LEADS":
        default:
          return "retargeting";
      }
    };

    // Pour chaque campagne, recuperer les insights
    let synced = 0;
    for (const campaign of campaigns) {
      const insightsUrl = `${META_GRAPH_URL}/${campaign.id}/insights?fields=spend,impressions,clicks,actions&date_preset=last_30d&access_token=${meta_access_token}`;

      const insightsResponse = await fetch(insightsUrl);
      const insightsData = insightsResponse.ok
        ? await insightsResponse.json()
        : { data: [] };

      const insight = insightsData.data?.[0];
      const spend = parseFloat(insight?.spend || "0");
      const impressions = parseInt(insight?.impressions || "0", 10);
      const clicks = parseInt(insight?.clicks || "0", 10);

      // Chercher les conversions dans les actions
      const conversions =
        insight?.actions?.reduce(
          (sum: number, a: { action_type: string; value: string }) => {
            if (
              a.action_type === "offsite_conversion" ||
              a.action_type === "purchase" ||
              a.action_type === "lead"
            ) {
              return sum + parseInt(a.value || "0", 10);
            }
            return sum;
          },
          0,
        ) || 0;

      const roas =
        spend > 0 && conversions > 0 ? (conversions * 50) / spend : 0;

      // Check if campaign already exists
      const { data: existing } = await admin
        .from("ad_campaigns")
        .select("id")
        .eq("user_id", user.id)
        .eq("meta_campaign_id", campaign.id)
        .maybeSingle();

      const campaignData = {
        user_id: user.id,
        campaign_name: campaign.name,
        campaign_type: objectiveToType(campaign.objective),
        status: campaign.status === "ACTIVE" ? "active" : "paused",
        total_spend: spend,
        total_impressions: impressions,
        total_clicks: clicks,
        total_conversions: conversions,
        roas,
        meta_campaign_id: campaign.id,
      };

      if (existing) {
        const { error } = await admin.from("ad_campaigns").update(campaignData).eq("id", existing.id);
        if (error) console.error("[meta-sync] Update error:", error);
      } else {
        const { error } = await admin.from("ad_campaigns").insert(campaignData);
        if (error) console.error("[meta-sync] Insert error:", error);
      }

      synced++;
    }

    return NextResponse.json({
      success: true,
      message: `${synced} campagne${synced > 1 ? "s" : ""} synchronisée${synced > 1 ? "s" : ""}.`,
      count: synced,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur interne lors de la synchronisation." },
      { status: 500 },
    );
  }
}
