import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, resolvePlanId, type PlanLimits } from "./plans";

// ─── Feature Keys ───────────────────────────────────────────────────────────

export type FeatureKey =
  | "meta_ads"
  | "crm"
  | "crons"
  | "whitelabel"
  | "custom_domain"
  | "api_access"
  | "scoring_business"
  | "scoring_ads"
  | "multi_touch_attribution"
  | "growth_tiers"
  | "claude_extraction"
  | "affiliate_admin"
  | "specialized_agents"
  | "coaching_calls"
  | "priority_queue";

/** Maps FeatureKey to the corresponding boolean/truthy field in PlanLimits */
const FEATURE_TO_LIMIT: Record<FeatureKey, keyof PlanLimits> = {
  meta_ads: "metaAds",
  crm: "crm",
  crons: "crons",
  whitelabel: "whitelabel",
  custom_domain: "customDomain",
  api_access: "apiAccess",
  scoring_business: "scoringBusiness",
  scoring_ads: "scoringAds",
  multi_touch_attribution: "multiTouchAttribution",
  growth_tiers: "growthTiers",
  claude_extraction: "claudeExtraction",
  affiliate_admin: "affiliateProgram",
  specialized_agents: "agents",
  coaching_calls: "coachingCalls",
  priority_queue: "priorityQueue",
};

/** Human-readable names for upgrade messages */
const FEATURE_LABELS: Record<FeatureKey, string> = {
  meta_ads: "Meta Ads",
  crm: "CRM Pipeline",
  crons: "Automatisations background",
  whitelabel: "Whitelabel",
  custom_domain: "Custom Domain",
  api_access: "Accès API",
  scoring_business: "Scoring Business",
  scoring_ads: "Scoring Ads",
  multi_touch_attribution: "Attribution multi-touch",
  growth_tiers: "Paliers de croissance",
  claude_extraction: "Extraction mémoire Claude",
  affiliate_admin: "Programme d'affiliation (admin)",
  specialized_agents: "Agents IA spécialisés",
  coaching_calls: "Coaching calls",
  priority_queue: "File d'attente prioritaire",
};

/** Minimum plan required for each feature */
const FEATURE_MIN_PLAN: Record<FeatureKey, string> = {
  meta_ads: "scale",
  crm: "scale",
  crons: "scale",
  whitelabel: "scale",
  custom_domain: "scale",
  api_access: "scale",
  scoring_business: "scale",
  scoring_ads: "scale",
  multi_touch_attribution: "scale",
  growth_tiers: "scale",
  claude_extraction: "scale",
  specialized_agents: "scale",
  affiliate_admin: "agency",
  coaching_calls: "agency",
  priority_queue: "agency",
};

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Check if a user has access to a specific feature based on their plan.
 */
export async function hasFeatureAccess(
  userId: string,
  feature: FeatureKey,
): Promise<boolean> {
  const limits = await getUserPlanLimits(userId);
  return checkFeatureInLimits(limits, feature);
}

/**
 * Check feature access from already-loaded PlanLimits (no DB call).
 */
export function checkFeatureInLimits(
  limits: PlanLimits,
  feature: FeatureKey,
): boolean {
  const limitKey = FEATURE_TO_LIMIT[feature];
  const value = limits[limitKey];

  // Handle special cases
  if (feature === "specialized_agents") return value === "all";
  if (feature === "affiliate_admin") return value === "admin";

  // Boolean or number > 0
  return Boolean(value);
}

/**
 * Get the full PlanLimits for a user (fetches plan from DB).
 */
export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .single();

  const planId = resolvePlanId(profile?.subscription_plan || "free");
  return getPlanLimits(planId);
}

/**
 * Get human-readable label for a feature.
 */
export function getFeatureLabel(feature: FeatureKey): string {
  return FEATURE_LABELS[feature];
}

/**
 * Get the minimum plan required for a feature.
 */
export function getMinPlanForFeature(feature: FeatureKey): string {
  return FEATURE_MIN_PLAN[feature];
}
