"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@/hooks/use-user";

/**
 * Hook qui enregistre une visite quotidienne pour maintenir le streak.
 * S'execute une seule fois par session (via sessionStorage).
 * Appelle /api/gamification/award avec streak.daily.
 */
export function useDailyStreak() {
  const { user, loading } = useUser();
  const tracked = useRef(false);

  useEffect(() => {
    if (loading || !user || tracked.current) return;

    // Verifier si on a deja enregistre aujourd'hui (via sessionStorage)
    const key = `sf_streak_${new Date().toISOString().slice(0, 10)}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      tracked.current = true;
      return;
    }

    tracked.current = true;

    // Enregistrer la visite quotidienne (non bloquant)
    fetch("/api/gamification/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityType: "streak.daily" }),
    })
      .then(() => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(key, "1");
        }
      })
      .catch(() => {});
  }, [user, loading]);
}
