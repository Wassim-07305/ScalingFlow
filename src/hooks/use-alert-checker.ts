"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@/hooks/use-user";

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = "scalingflow_last_alert_check";

export function useAlertChecker() {
  const { user } = useUser();
  const checking = useRef(false);

  useEffect(() => {
    if (!user) return;

    const shouldCheck = () => {
      const last = localStorage.getItem(STORAGE_KEY);
      if (!last) return true;
      return Date.now() - parseInt(last, 10) > CHECK_INTERVAL_MS;
    };

    const runCheck = async () => {
      if (checking.current) return;
      if (!shouldCheck()) return;

      checking.current = true;
      try {
        await fetch("/api/alerts/check", { method: "POST" });
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch {
        // Silent fail — alerts are non-critical
      } finally {
        checking.current = false;
      }
    };

    // Check on mount (with small delay to not block initial render)
    const timeout = setTimeout(runCheck, 3000);

    // Also check periodically
    const interval = setInterval(runCheck, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user]);
}
