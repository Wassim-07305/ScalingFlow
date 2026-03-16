/**
 * Persistent IP-based rate limiter for public (unauthenticated) endpoints.
 * Uses Supabase service role (admin) client to bypass RLS.
 * Survives server restarts and works across serverless instances.
 */

import { createAdminClient } from "@/lib/supabase/admin";

interface RateLimitPublicOptions {
  /** Max requests allowed in the window */
  limit?: number;
  /** Window duration in seconds */
  windowSeconds?: number;
}

interface RateLimitPublicResult {
  allowed: boolean;
  remaining: number;
}

export async function rateLimitPublic(
  ip: string,
  route: string,
  options: RateLimitPublicOptions = {},
): Promise<RateLimitPublicResult> {
  const { limit = 3, windowSeconds = 3600 } = options;
  const key = `ip:${ip}:${route}`;
  const now = new Date();

  try {
    const supabase = createAdminClient();

    const { data: entry } = await supabase
      .from("rate_limits")
      .select("id, count, reset_at")
      .eq("key", key)
      .single();

    if (!entry || new Date(entry.reset_at) <= now) {
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

      return { allowed: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    await supabase
      .from("rate_limits")
      .update({ count: entry.count + 1 })
      .eq("id", entry.id);

    return { allowed: true, remaining: limit - (entry.count + 1) };
  } catch (error) {
    // Fail-closed: deny if DB is unavailable
    console.error("[rate-limit-public] DB error, failing closed:", error);
    return { allowed: false, remaining: 0 };
  }
}
