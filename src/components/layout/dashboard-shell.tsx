"use client";

import { AppShell } from "./app-shell";
import {
  NAV_SECTIONS,
  NAV_ITEMS,
  QUICK_LINKS,
  BREADCRUMB_LABELS,
} from "@/lib/constants/navigation";
import { useDailyStreak } from "@/hooks/use-daily-streak";
import { useAchievementListener } from "@/hooks/use-achievement-listener";
import { useAlertChecker } from "@/hooks/use-alert-checker";
import { OrgBrandingProvider } from "@/components/whitelabel/org-branding-provider";

interface OrgBranding {
  brand_name: string | null;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
}

interface DashboardShellProps {
  role: string;
  userName: string;
  email: string;
  avatarUrl?: string | null;
  userId: string;
  children: React.ReactNode;
  orgBranding?: OrgBranding | null;
}

export function DashboardShell({
  role,
  userName,
  email,
  avatarUrl,
  userId,
  children,
  orgBranding,
}: DashboardShellProps) {
  useDailyStreak();
  useAchievementListener();
  useAlertChecker();

  // Determine branding: use org branding if available
  const logoSrc = orgBranding?.logo_url || "/icons/icon-192.png";
  const appName = orgBranding?.brand_name ? (
    <span>{orgBranding.brand_name}</span>
  ) : (
    <>
      Scaling<span className="text-accent">Flow</span>
    </>
  );

  // Build a minimal org object for the branding provider
  const orgForProvider = orgBranding
    ? {
        id: "",
        name: orgBranding.brand_name || "",
        slug: "",
        logo_url: orgBranding.logo_url,
        custom_domain: null,
        primary_color: orgBranding.primary_color,
        accent_color: orgBranding.accent_color,
        brand_name: orgBranding.brand_name,
        features: {},
        limits: {},
        custom_onboarding_steps: null,
        custom_welcome_message: null,
        custom_prompts: null,
        owner_id: "",
        created_at: "",
        updated_at: "",
      }
    : null;

  return (
    <OrgBrandingProvider organization={orgForProvider}>
      <AppShell
        role={role}
        userName={userName}
        email={email}
        avatarUrl={avatarUrl}
        userId={userId}
        navSections={NAV_SECTIONS}
        navItems={NAV_ITEMS}
        quickLinks={QUICK_LINKS}
        breadcrumbLabels={BREADCRUMB_LABELS}
        logoSrc={logoSrc}
        appName={appName}
        adminRoles={["admin"]}
      >
        {children}
      </AppShell>
    </OrgBrandingProvider>
  );
}
