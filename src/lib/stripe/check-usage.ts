import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, resolvePlanId } from "./plans";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UsageCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  percentUsed: number;
  remaining: number;
  plan: string;
  subscription_status: string;
  resetDate: string;
}

export interface UsageStats extends UsageCheck {
  costThisMonth: number;
  byType: Record<string, number>;
}

export interface IncrementOptions {
  generationType: string;
  model: "haiku" | "sonnet";
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  costUsd?: number;
  isCron?: boolean;
  metadata?: Record<string, unknown>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns the first day of the current month (UTC) as ISO string */
function getMonthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Returns the first day of the next month (UTC) as ISO string */
function getMonthEnd(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Check if a user can make an AI generation.
 * Counts non-CRON generations in the current calendar month.
 */
export async function checkAIUsage(userId: string): Promise<UsageCheck> {
  const supabase = await createClient();

  // 1. Get user profile for plan info
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan, subscription_status")
    .eq("id", userId)
    .single();

  const planId = resolvePlanId(profile?.subscription_plan || "free");
  const limits = getPlanLimits(planId);
  const status = profile?.subscription_status || "inactive";

  // 2. Count generations this month (exclude CRONs)
  const monthStart = getMonthStart();
  const { count } = await supabase
    .from("ai_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_cron", false)
    .gte("created_at", monthStart);

  const currentUsage = count || 0;
  const limit = limits.aiGenerationsPerMonth;
  const allowed = currentUsage < limit;

  return {
    allowed,
    currentUsage,
    limit,
    percentUsed: limit > 0 ? Math.round((currentUsage / limit) * 100) : 0,
    remaining: Math.max(0, limit - currentUsage),
    plan: planId,
    subscription_status: status,
    resetDate: getMonthEnd(),
  };
}

/**
 * Log a successful AI generation and increment the counter.
 * Call this AFTER a generation succeeds (not before).
 * Failed generations should NOT call this.
 */
export async function incrementAIUsage(
  userId: string,
  opts: IncrementOptions,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("ai_generations").insert({
    user_id: userId,
    generation_type: opts.generationType,
    model: opts.model,
    input_tokens: opts.inputTokens ?? null,
    output_tokens: opts.outputTokens ?? null,
    cost_usd: opts.costUsd ?? null,
    cached_tokens: opts.cachedTokens ?? 0,
    is_cron: opts.isCron ?? false,
    metadata: opts.metadata ?? null,
  });

  if (error) {
    console.error("[incrementAIUsage] Failed to log generation:", error.message, { userId, type: opts.generationType });
  }
}

/**
 * Get detailed usage stats for the current month.
 * Used by the /api/stripe/usage route and dashboard widgets.
 */
export async function getUsageStats(userId: string): Promise<UsageStats> {
  const usage = await checkAIUsage(userId);

  const supabase = await createClient();
  const monthStart = getMonthStart();

  // Get breakdown by type + cost
  const { data: generations } = await supabase
    .from("ai_generations")
    .select("generation_type, cost_usd")
    .eq("user_id", userId)
    .eq("is_cron", false)
    .gte("created_at", monthStart);

  const byType: Record<string, number> = {};
  let costThisMonth = 0;

  for (const gen of generations || []) {
    byType[gen.generation_type] = (byType[gen.generation_type] || 0) + 1;
    costThisMonth += Number(gen.cost_usd) || 0;
  }

  return {
    ...usage,
    costThisMonth: Math.round(costThisMonth * 1000000) / 1000000,
    byType,
  };
}
