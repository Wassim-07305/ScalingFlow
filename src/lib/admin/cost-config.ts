// ─── Infrastructure Costs (monthly, USD) ────────────────────────────────────

export const INFRA_COSTS = {
  supabase: 25,
  vercel: 20,
  resend: 20,
  domain: 2,
  other: 10,
  total: 77,
} as const;

// ─── Alert Thresholds ───────────────────────────────────────────────────────

export const COST_ALERTS = {
  /** Alert if total AI cost exceeds this % of MRR */
  maxAICostPercentOfMRR: 30,
  /** Alert if a single user's AI cost exceeds this % of their plan price */
  maxUserCostPercentOfPlan: 80,
  /** Alert if today's cost is N times higher than the 7-day average */
  costSpikeMultiplier: 2,
  /** Alert if a plan's margin drops below this % */
  minMarginPercent: 50,
} as const;

// ─── Currency ───────────────────────────────────────────────────────────────

export const USD_TO_EUR = 0.92;

export function usdToEur(usd: number): number {
  return Math.round(usd * USD_TO_EUR * 100) / 100;
}
