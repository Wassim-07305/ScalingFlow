"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, User, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types/appshell";

// ─── Helpers ────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Props ──────────────────────────────────────────────────

interface HeaderProps {
  userName: string;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  userId: string;
  unreadCount: number;
  breadcrumbLabels?: Record<string, string>;
}

export function Header({
  userName,
  email,
  avatarUrl,
  unreadCount,
  breadcrumbLabels = {},
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    toggleMobileSidebar,
    setNotificationsPanelOpen,
    setSearchOpen,
  } = useUIStore();

  // Breadcrumb from pathname — skip UUID segments
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments
    .filter((seg) => !UUID_RE.test(seg))
    .map((seg) => breadcrumbLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-default bg-bg-secondary/80 px-4 backdrop-blur-sm md:px-6">
      {/* Left: Hamburger (mobile) + Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary md:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb */}
        <nav className="hidden items-center gap-1.5 text-sm md:flex">
          {breadcrumbs.length === 0 ? (
            <span className="font-medium text-text-primary">Dashboard</span>
          ) : (
            breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-text-muted">/</span>}
                <span
                  className={cn(
                    idx === breadcrumbs.length - 1
                      ? "font-medium text-text-primary"
                      : "text-text-secondary"
                  )}
                >
                  {crumb}
                </span>
              </span>
            ))
          )}
        </nav>
      </div>

      {/* Center: Global Search */}
      <div className="hidden flex-1 items-center justify-center px-8 md:flex">
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            "flex h-10 w-full max-w-md items-center gap-2 rounded-lg border border-border-default bg-bg-tertiary px-3 text-sm text-text-muted",
            "transition-all duration-200 hover:border-border-hover hover:bg-bg-elevated"
          )}
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Rechercher...</span>
          <kbd className="pointer-events-none hidden items-center gap-1 rounded border border-border-default bg-bg-primary px-1.5 font-mono text-[10px] text-text-muted sm:inline-flex">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-1.5">
        {/* Search mobile */}
        <button
          onClick={() => setSearchOpen(true)}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notification bell */}
        <button
          onClick={() => setNotificationsPanelOpen(true)}
          className="relative rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg-primary">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-bg-tertiary">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                {getInitials(userName)}
              </div>
            )}
          </button>

          {/* Dropdown */}
          <div className="invisible absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border-default bg-bg-secondary p-1 opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:opacity-100">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-text-primary">{userName}</p>
              <p className="text-xs text-text-secondary">{email}</p>
            </div>
            <div className="mx-2 border-t border-border-default" />
            <button
              onClick={() => router.push("/settings")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary transition-colors hover:bg-bg-tertiary"
            >
              <User className="h-4 w-4" />
              Mon profil
            </button>
            <div className="mx-2 border-t border-border-default" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
