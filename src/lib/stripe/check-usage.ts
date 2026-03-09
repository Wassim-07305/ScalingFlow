import { createClient } from "@/lib/supabase/server";

const FREE_MONTHLY_LIMIT = 5;

export interface UsageCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number | null; // null = unlimited
  plan: string;
  subscription_status: string;
}

/**
 * Check if a user can make an AI generation based on their subscription.
 * Free users: 5 generations/month. Pro/Premium: unlimited.
 */
export async function checkAIUsage(userId: string): Promise<UsageCheck> {
  const supabase = await createClient();

  // Fetch subscription info
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_plan")
    .eq("id", userId)
    .single();

  const status = profile?.subscription_status || "free";
  const plan = profile?.subscription_plan || "free";

  // Active paid subscribers have unlimited access
  if (status === "active" && plan !== "free") {
    return {
      allowed: true,
      currentUsage: 0,
      limit: null,
      plan,
      subscription_status: status,
    };
  }

  // Count this month's generations from activity_log
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from("activity_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth)
    .like("activity_type", "generation.%");

  const currentUsage = count || 0;

  return {
    allowed: currentUsage < FREE_MONTHLY_LIMIT,
    currentUsage,
    limit: FREE_MONTHLY_LIMIT,
    plan: "free",
    subscription_status: status,
  };
}
