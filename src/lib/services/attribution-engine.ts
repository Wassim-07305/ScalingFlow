/**
 * Attribution Engine — Feature 2.1
 * Computes multi-touch attribution across 4 models.
 * Uses the touchpoints table populated by the tracker.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttributionModelType =
  | "first_touch"
  | "last_touch"
  | "linear"
  | "time_decay";

export interface AttributionResult {
  touchpoint_id: string;
  channel: string;
  source: string;
  campaign: string | null;
  creative: string | null; // utm_content / meta_ad_id
  credit_pct: number; // 0–100
}

export interface TouchpointJourneyItem {
  id: string;
  event_type: string;
  channel: string;
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  landing_page: string | null;
  referrer: string | null;
  meta_ad_id: string | null;
  meta_campaign_id: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return Math.abs((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Attribution computation ──────────────────────────────────────────────────

function computeCredits(
  touchpoints: TouchpointJourneyItem[],
  model: AttributionModelType,
): number[] {
  const n = touchpoints.length;
  if (n === 0) return [];
  if (n === 1) return [100];

  switch (model) {
    case "first_touch": {
      return touchpoints.map((_, i) => (i === 0 ? 100 : 0));
    }

    case "last_touch": {
      return touchpoints.map((_, i) => (i === n - 1 ? 100 : 0));
    }

    case "linear": {
      const share = 100 / n;
      return touchpoints.map(() => share);
    }

    case "time_decay": {
      // More credit to recent touchpoints; half-life = 7 days
      const lastDate = new Date(touchpoints[n - 1].created_at);
      const weights = touchpoints.map((tp) => {
        const daysAgo = daysBetween(new Date(tp.created_at), lastDate);
        return Math.exp((-Math.LN2 * daysAgo) / 7);
      });
      const total = weights.reduce((s, w) => s + w, 0);
      return weights.map((w) => (w / total) * 100);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the full journey (ordered chronologically) for a user or lead.
 */
export async function getJourney(
  supabase: SupabaseClient,
  params: { userId?: string; leadId?: string },
): Promise<TouchpointJourneyItem[]> {
  const { userId, leadId } = params;
  if (!userId && !leadId) return [];

  let query = supabase
    .from("touchpoints")
    .select(
      "id, event_type, channel, source, medium, campaign, content, landing_page, referrer, meta_ad_id, meta_campaign_id, created_at",
    )
    .order("created_at", { ascending: true });

  if (userId && leadId) {
    query = query.or(`user_id.eq.${userId},lead_id.eq.${leadId}`);
  } else if (userId) {
    query = query.eq("user_id", userId);
  } else if (leadId) {
    query = query.eq("lead_id", leadId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as TouchpointJourneyItem[];
}

/**
 * Returns attribution results for each touchpoint in the journey,
 * according to the specified model.
 */
export async function getAttribution(
  supabase: SupabaseClient,
  params: { userId?: string; leadId?: string },
  model: AttributionModelType,
): Promise<AttributionResult[]> {
  const journey = await getJourney(supabase, params);
  if (journey.length === 0) return [];

  const credits = computeCredits(journey, model);

  return journey.map((tp, i) => ({
    touchpoint_id: tp.id,
    channel: tp.channel,
    source: tp.source,
    campaign: tp.campaign,
    creative: tp.content || tp.meta_ad_id,
    credit_pct: Math.round(credits[i] * 100) / 100,
  }));
}

/**
 * Aggregates attribution by channel (useful for the dashboard).
 * Returns each channel's total credit percentage, sorted descending.
 */
export async function getChannelAttribution(
  supabase: SupabaseClient,
  params: { userId?: string; leadId?: string },
  model: AttributionModelType,
): Promise<{ channel: string; credit_pct: number }[]> {
  const results = await getAttribution(supabase, params, model);

  const byChannel: Record<string, number> = {};
  for (const r of results) {
    byChannel[r.channel] = (byChannel[r.channel] || 0) + r.credit_pct;
  }

  return Object.entries(byChannel)
    .map(([channel, credit_pct]) => ({ channel, credit_pct }))
    .sort((a, b) => b.credit_pct - a.credit_pct);
}

/**
 * Builds a human-readable journey summary string.
 * e.g. "Meta Ads → Landing Page → Opt-in → Email → Call"
 */
export function buildJourneySummary(journey: TouchpointJourneyItem[]): string {
  if (journey.length === 0) return "Parcours inconnu";

  const channelLabels: Record<string, string> = {
    meta_ads: "Meta Ads",
    google_ads: "Google Ads",
    organic_social: "Réseaux sociaux",
    email: "Email",
    organic: "Recherche organique",
    referral: "Référence",
    direct: "Direct",
  };

  const eventLabels: Record<string, string> = {
    pageview: "Page",
    opt_in: "Opt-in",
    call_booked: "Call réservé",
    purchase: "Achat",
  };

  const steps = journey.map((tp) => {
    const channel = channelLabels[tp.channel] || tp.channel;
    const event = eventLabels[tp.event_type] || tp.event_type;
    return tp.event_type === "pageview" ? channel : event;
  });

  // Deduplicate consecutive identical steps
  const deduped: string[] = [];
  for (const step of steps) {
    if (deduped[deduped.length - 1] !== step) deduped.push(step);
  }

  return deduped.join(" → ");
}
