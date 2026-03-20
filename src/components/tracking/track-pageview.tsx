"use client";

import { useEffect } from "react";
import { track } from "@/lib/tracking/touchpoint-tracker";

interface TrackPageviewProps {
  /** Pass user.id if the visitor is authenticated */
  userId?: string;
  /** Skip RGPD consent gate (use on your own funnel/landing pages) */
  skipConsent?: boolean;
}

/**
 * Drop this component in any page to record a touchpoint.
 * Fires once on mount — non-blocking, won't affect page performance.
 */
export function TrackPageview({ userId, skipConsent = false }: TrackPageviewProps) {
  useEffect(() => {
    track("pageview", { userId, skipConsent });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
