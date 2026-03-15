"use client";

import { useState, useEffect, useCallback } from "react";

export interface UnipileAccountInfo {
  id: string;
  provider: string;
  name?: string;
  username?: string;
}

/**
 * Hook to fetch connected Unipile accounts.
 * Optionally filter by provider type ("messaging" or "social").
 */
export function useUnipileAccounts(filter?: "messaging" | "social") {
  const [accounts, setAccounts] = useState<UnipileAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const MESSAGING_PROVIDERS = ["linkedin", "whatsapp", "instagram", "messenger", "telegram", "twitter"];
  const SOCIAL_PROVIDERS = ["linkedin", "instagram", "twitter"];

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/unipile/accounts");
      if (!res.ok) throw new Error();
      const data = await res.json();
      let list: UnipileAccountInfo[] = data.accounts || [];

      if (filter === "messaging") {
        list = list.filter((a) =>
          MESSAGING_PROVIDERS.includes(a.provider.toLowerCase())
        );
      } else if (filter === "social") {
        list = list.filter((a) =>
          SOCIAL_PROVIDERS.includes(a.provider.toLowerCase())
        );
      }

      setAccounts(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, refetch: fetchAccounts };
}
