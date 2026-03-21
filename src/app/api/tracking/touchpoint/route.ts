import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitPublic } from "@/lib/utils/rate-limit-public";

// ─── Channel computation ──────────────────────────────────────────────────────

function computeChannel(params: {
  source?: string;
  medium?: string;
  metaCampaignId?: string;
  referrer?: string;
}): string {
  const { source = "", medium = "", metaCampaignId, referrer } = params;
  const s = source.toLowerCase();
  const m = medium.toLowerCase();

  if (metaCampaignId || s === "facebook" || s === "meta" || s === "fb") {
    return "meta_ads";
  }
  if (s === "google" && (m === "cpc" || m === "ppc" || m === "paid")) {
    return "google_ads";
  }
  if (
    ["instagram", "facebook", "tiktok", "twitter", "linkedin"].includes(s) &&
    m !== "cpc" &&
    m !== "ppc"
  ) {
    return "organic_social";
  }
  if (m === "email" || s === "email" || s === "newsletter") {
    return "email";
  }
  if (s === "google" && (m === "organic" || !m)) {
    return "organic";
  }
  if (referrer && s === "direct") {
    return "referral";
  }
  if (!s || s === "direct") {
    return "direct";
  }
  return "referral";
}

// ─── POST /api/tracking/touchpoint ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      visitor_id,
      user_id,
      lead_id,
      source,
      medium,
      campaign,
      content,
      term,
      meta_ad_id,
      meta_adset_id,
      meta_campaign_id,
      referrer,
      landing_page,
      event_type = "pageview",
    } = body;

    if (!visitor_id || typeof visitor_id !== "string") {
      return NextResponse.json({ error: "visitor_id requis" }, { status: 400 });
    }
    if (!source || typeof source !== "string") {
      return NextResponse.json({ error: "source requis" }, { status: 400 });
    }

    // Rate limit: 50 touchpoints per visitor per hour
    const rl = await rateLimitPublic(visitor_id, "touchpoint", {
      limit: 50,
      windowSeconds: 3600,
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const channel = computeChannel({
      source,
      medium,
      metaCampaignId: meta_campaign_id,
      referrer,
    });

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("touchpoints")
      .insert({
        visitor_id,
        user_id: user_id || null,
        lead_id: lead_id || null,
        source,
        medium: medium || null,
        campaign: campaign || null,
        content: content || null,
        term: term || null,
        meta_ad_id: meta_ad_id || null,
        meta_adset_id: meta_adset_id || null,
        meta_campaign_id: meta_campaign_id || null,
        referrer: referrer || null,
        landing_page: landing_page || null,
        event_type,
        channel,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[tracking/touchpoint] insert error:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("[tracking/touchpoint] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
