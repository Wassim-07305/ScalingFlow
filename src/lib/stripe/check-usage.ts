export interface UsageCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number | null; // null = unlimited
  plan: string;
  subscription_status: string;
}

/**
 * Check if a user can make an AI generation.
 * Currently unlimited for all users.
 */
export async function checkAIUsage(_userId: string): Promise<UsageCheck> {
  return {
    allowed: true,
    currentUsage: 0,
    limit: null,
    plan: "unlimited",
    subscription_status: "active",
  };
}
