"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { NotificationsPanel } from "./notifications-panel";
import { GlobalSearch } from "./global-search";
import { AchievementProvider } from "@/components/gamification/achievement-provider";
import { ThemeProvider } from "./theme-provider";
import { NavigationProgress } from "./navigation-progress";
import type { UserRole, NavItem, NavSection } from "@/lib/types/appshell";
import type { LucideIcon } from "lucide-react";

// ─── Props ──────────────────────────────────────────────────

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface AppShellProps {
  role: UserRole;
  userName: string;
  email: string;
  avatarUrl?: string | null;
  userId: string;
  children: React.ReactNode;

  // ─── Configuration (project-specific) ───────────────────
  navSections: NavSection[];
  navItems: NavItem[];
  quickLinks: QuickLink[];
  breadcrumbLabels?: Record<string, string>;
  logoSrc?: string;
  appName?: React.ReactNode;
  adminRoles?: string[];
}

// ─── Component ──────────────────────────────────────────────

export function AppShell({
  role,
  userName,
  email,
  avatarUrl,
  userId,
  children,
  navSections,
  navItems,
  quickLinks,
  breadcrumbLabels,
  logoSrc = "/icons/icon-192.png",
  appName = "ScalingFlow",
  adminRoles,
}: AppShellProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  return (
    <ThemeProvider>
      <NavigationProgress />
      <div className="flex h-screen overflow-hidden bg-bg-primary">
        {/* Sidebar */}
        <Sidebar
          role={role}
          userName={userName}
          avatarUrl={avatarUrl}
          navSections={navSections}
          logoSrc={logoSrc}
          appName={appName}
          adminRoles={adminRoles}
        />

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <Header
            userName={userName}
            email={email}
            avatarUrl={avatarUrl}
            role={role}
            userId={userId}
            unreadCount={unreadCount}
            breadcrumbLabels={breadcrumbLabels}
          />

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-5 pb-20 md:p-8 md:pb-8">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav role={role} navItems={navItems} />

        {/* Global overlays */}
        <NotificationsPanel
          userId={userId}
          onUnreadCountChange={handleUnreadCountChange}
        />
        <GlobalSearch quickLinks={quickLinks} />
        <AchievementProvider />
      </div>
    </ThemeProvider>
  );
}
