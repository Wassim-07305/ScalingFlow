/**
 * Persistent rate limiter using Supabase.
 * Survives server restarts and works across serverless instances.
 */

import { createClient } from "@/lib/supabase/server";

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit?: number;
  /** Window duration in seconds */
  windowSeconds?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(
  userId: string,
  route: string,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const { limit = 10, windowSeconds = 60 } = options;
  const key = `${userId}:${route}`;
  const now = new Date();

  try {
    const supabase = await createClient();

    // Try to get existing entry
    const { data: entry } = await supabase
      .from("rate_limits")
      .select("id, count, reset_at")
      .eq("key", key)
      .single();

    if (!entry || new Date(entry.reset_at) <= now) {
      // No entry or expired — create/reset
      const resetAt = new Date(now.getTime() + windowSeconds * 1000);

      if (entry) {
        await supabase
          .from("rate_limits")
          .update({ count: 1, reset_at: resetAt.toISOString() })
          .eq("id", entry.id);
      } else {
        await supabase
          .from("rate_limits")
          .insert({ key, count: 1, reset_at: resetAt.toISOString() });
      }

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: resetAt.getTime(),
      };
    }

    // Entry exists and is still valid
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.reset_at).getTime(),
      };
    }

    // Increment count
    await supabase
      .from("rate_limits")
      .update({ count: entry.count + 1 })
      .eq("id", entry.id);

    return {
      allowed: true,
      remaining: limit - (entry.count + 1),
      resetAt: new Date(entry.reset_at).getTime(),
    };
  } catch (error) {
    // SECURITY: Fail-closed — if rate limit DB is unavailable, deny the request
    // This prevents abuse when the rate limit system is down
    console.error("[rate-limit] DB error, failing closed:", error);
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + windowSeconds * 1000,
    };
  }
}
