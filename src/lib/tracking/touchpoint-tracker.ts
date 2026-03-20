/**
 * Touchpoint Tracker — lightweight async client-side tracker (< 2KB gzipped)
 * RGPD-compliant: checks consent before firing, uses first-party cookie _sf_vid
 * Call track() in useEffect on funnel/landing pages.
 */

export type TouchpointEventType =
  | "pageview"
  | "opt_in"
  | "call_booked"
  | "purchase";

export interface TrackPayload {
  visitor_id: string;
  user_id?: string;
  lead_id?: string;
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  meta_ad_id?: string;
  meta_adset_id?: string;
  meta_campaign_id?: string;
  referrer?: string;
  landing_page?: string;
  event_type: TouchpointEventType;
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Consent check ───────────────────────────────────────────────────────────

function hasConsent(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("sf_cookies_accepted") === "true";
}

// ─── Visitor ID ──────────────────────────────────────────────────────────────

export function getOrCreateVisitorId(): string {
  const existing = getCookie("_sf_vid");
  if (existing) return existing;
  const id = generateId();
  setCookie("_sf_vid", id, 90); // 90 days per RGPD/spec
  return id;
}

// ─── UTM capture ─────────────────────────────────────────────────────────────

export interface CapturedUTMs {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
}

export function captureUTMs(search?: string): CapturedUTMs {
  const params = new URLSearchParams(
    search ?? (typeof window !== "undefined" ? window.location.search : ""),
  );

  const source =
    params.get("utm_source") ||
    (params.get("fbclid") ? "facebook" : "") ||
    (typeof document !== "undefined" && document.referrer
      ? new URL(document.referrer).hostname
      : "") ||
    "direct";

  return {
    source,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    content: params.get("utm_content") || undefined,
    term: params.get("utm_term") || undefined,
    fbclid: params.get("fbclid") || undefined,
  };
}

// ─── Main track function ─────────────────────────────────────────────────────

export async function track(
  eventType: TouchpointEventType = "pageview",
  extra?: {
    userId?: string;
    leadId?: string;
    metaAdId?: string;
    metaAdsetId?: string;
    metaCampaignId?: string;
    /** Skip RGPD consent check — use on first-party analytics pages */
    skipConsent?: boolean;
  },
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!extra?.skipConsent && !hasConsent()) return;

  const visitorId = getOrCreateVisitorId();
  const utms = captureUTMs();

  const payload: TrackPayload = {
    visitor_id: visitorId,
    user_id: extra?.userId,
    lead_id: extra?.leadId,
    source: utms.source,
    medium: utms.medium,
    campaign: utms.campaign,
    content: utms.content,
    term: utms.term,
    meta_ad_id: extra?.metaAdId,
    meta_adset_id: extra?.metaAdsetId,
    meta_campaign_id: extra?.metaCampaignId,
    referrer: document.referrer || undefined,
    landing_page: window.location.href,
    event_type: eventType,
  };

  // Always use fetch with keepalive — sendBeacon can't set Content-Type: application/json
  fetch("/api/tracking/touchpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

// ─── Identify: link visitor_id to user_id after auth ────────────────────────

export async function identifyUser(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const visitorId = getCookie("_sf_vid");
  if (!visitorId) return;

  fetch("/api/tracking/touchpoint/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitor_id: visitorId, user_id: userId }),
  }).catch(() => {});
}

// ─── Link visitor to lead ────────────────────────────────────────────────────

export async function identifyLead(leadId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const visitorId = getCookie("_sf_vid");
  if (!visitorId) return;

  fetch("/api/tracking/touchpoint/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitor_id: visitorId, lead_id: leadId }),
  }).catch(() => {});
}
