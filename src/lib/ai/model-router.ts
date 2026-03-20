// ─── Model Router ───────────────────────────────────────────────────────────
// Routes AI generations to the optimal model (Haiku for light tasks, Sonnet for complex)

export type GenerationType =
  // Haiku — short, simple, fast
  | "post_social"
  | "script_reel"
  | "sms"
  | "email_single"
  | "suggestion"
  | "agent_chat"
  | "editorial_calendar"
  // Sonnet — complex, long-form, analytical
  | "offer"
  | "market_analysis"
  | "competitors"
  | "schwartz"
  | "persona"
  | "category_os"
  | "funnel"
  | "vsl"
  | "call_analysis"
  | "audit_business"
  | "scoring"
  | "brand"
  | "pitch_deck"
  | "sales_letter"
  | "lead_magnet"
  | "growth_recs"
  | "knowledge_extract"
  | "vault_analysis"
  | "roadmap"
  | "daily_plan"
  | "delivery"
  | "guarantee"
  | "mechanism"
  | "oto"
  | "quiz"
  | "logo"
  | "weekly_content"
  | "objections"
  | "optimize_ads"
  | "optimize_instagram"
  | "scrape_insights"
  | "ad_images"
  | "competitive_advantage"
  | "identify_pains";

const HAIKU_TYPES: Set<GenerationType> = new Set([
  "post_social",
  "script_reel",
  "sms",
  "email_single",
  "suggestion",
  "agent_chat",
  "editorial_calendar",
]);

export function getModelForGeneration(type: GenerationType): "haiku" | "sonnet" {
  return HAIKU_TYPES.has(type) ? "haiku" : "sonnet";
}

export const MODEL_IDS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
} as const;

export function getModelId(model: "haiku" | "sonnet"): string {
  return MODEL_IDS[model];
}

/**
 * Estimate cost in USD based on model and token counts.
 * Rates per million tokens (as of 2025):
 *   Haiku:  $1 input / $5 output / $0.10 cache hit
 *   Sonnet: $3 input / $15 output / $0.30 cache hit
 */
export function estimateCostUSD(
  model: "haiku" | "sonnet",
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0,
): number {
  const rates = {
    haiku: { input: 1, output: 5, cacheHit: 0.1 },
    sonnet: { input: 3, output: 15, cacheHit: 0.3 },
  };

  const r = rates[model];
  const billableInput = Math.max(0, inputTokens - cachedTokens);

  return (
    (billableInput * r.input + outputTokens * r.output + cachedTokens * r.cacheHit) /
    1_000_000
  );
}
