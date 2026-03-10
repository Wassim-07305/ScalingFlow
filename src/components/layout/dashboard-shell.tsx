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

interface DashboardShellProps {
  role: string;
  userName: string;
  email: string;
  avatarUrl?: string | null;
  userId: string;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userName,
  email,
  avatarUrl,
  userId,
  children,
}: DashboardShellProps) {
  useDailyStreak();
  useAchievementListener();

  return (
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
      logoSrc="/icons/icon-192.png"
      appName={
        <>
          Scaling<span className="text-accent">Flow</span>
        </>
      }
      adminRoles={["admin"]}
    >
      {children}
    </AppShell>
  );
}
