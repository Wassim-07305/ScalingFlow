"use client";

import { useState, useEffect } from "react";

interface UsageData {
  allowed: boolean;
  currentUsage: number;
  limit: number | null;
  plan: string;
  subscription_status: string;
}

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

  return { usage, loading, isPro: usage?.plan !== "free" };
}
