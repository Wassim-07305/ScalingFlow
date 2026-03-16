"use client";

import { useEffect } from "react";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

interface OrgBrandingProviderProps {
  organization: Organization | null;
  children: React.ReactNode;
}

/**
 * Applies organization branding colors as CSS variable overrides.
 * When the user belongs to an org with custom colors, the accent/brand
 * colors across the entire UI are dynamically updated.
 */
export function OrgBrandingProvider({
  organization,
  children,
}: OrgBrandingProviderProps) {
  useEffect(() => {
    if (!organization) return;

    const root = document.documentElement;
    const { primary_color, accent_color } = organization;

    if (primary_color && primary_color !== "#34D399") {
      // Parse hex to get rgba for muted variant
      const r = parseInt(primary_color.slice(1, 3), 16);
      const g = parseInt(primary_color.slice(3, 5), 16);
      const b = parseInt(primary_color.slice(5, 7), 16);
      const muted = `rgba(${r}, ${g}, ${b}, 0.12)`;

      root.style.setProperty("--color-accent", primary_color);
      root.style.setProperty("--color-accent-muted", muted);
      root.style.setProperty("--color-brand", primary_color);
      root.style.setProperty("--color-sidebar-primary", primary_color);
      root.style.setProperty("--color-sidebar-ring", primary_color);
      root.style.setProperty("--color-border-active", primary_color);
      root.style.setProperty("--color-success", primary_color);
    }

    if (accent_color && accent_color !== "#10B981") {
      root.style.setProperty("--color-accent-hover", accent_color);
    }

    return () => {
      // Reset to defaults when org changes or unmounts
      root.style.removeProperty("--color-accent");
      root.style.removeProperty("--color-accent-hover");
      root.style.removeProperty("--color-accent-muted");
      root.style.removeProperty("--color-brand");
      root.style.removeProperty("--color-sidebar-primary");
      root.style.removeProperty("--color-sidebar-ring");
      root.style.removeProperty("--color-border-active");
      root.style.removeProperty("--color-success");
    };
  }, [organization]);

  return <>{children}</>;
}
