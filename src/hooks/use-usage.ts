"use client";

import { useState, useEffect } from "react";

export interface UsageData {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  percentUsed: number;
  remaining: number;
  plan: string;
  subscription_status: string;
  resetDate: string;
  costThisMonth?: number;
  byType?: Record<string, number>;
}

export type PlanTier = "free" | "starter" | "pro" | "scale" | "agency";

export function useUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stripe/usage")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUsage(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const planTier = (usage?.plan || "free") as PlanTier;

  return {
    usage,
    loading,
    planTier,
    isPro: planTier !== "free" && planTier !== "starter",
    isPaid: planTier !== "free",
  };
}
