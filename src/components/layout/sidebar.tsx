"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Settings,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserRole, NavSection } from "@/lib/types/appshell";

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

interface SidebarProps {
  role: UserRole;
  userName: string;
  avatarUrl?: string | null;
  navSections: NavSection[];
  logoSrc: string;
  appName: React.ReactNode;
  logoHref?: string;
  adminRoles?: string[];
  settingsHref?: string;
}

export function Sidebar({
  role,
  userName,
  avatarUrl,
  navSections,
  logoSrc,
  appName,
  logoHref = "/",
  adminRoles = ["admin"],
  settingsHref = "/settings",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile: userProfile } = useUser();
  const {
    sidebarCollapsed: isCollapsed,
    toggleSidebar,
    sidebarMobileOpen,
    setMobileSidebarOpen,
  } = useUIStore();

  const subscriptionPlan = userProfile?.subscription_plan || "free";
  const planLabel =
    subscriptionPlan === "premium"
      ? "Premium"
      : subscriptionPlan === "pro"
        ? "Pro"
        : "Free";
  const planVariant =
    subscriptionPlan === "premium"
      ? "purple"
      : subscriptionPlan === "pro"
        ? "cyan"
        : "muted";

  function closeMobile() {
    setMobileSidebarOpen(false);
  }

  async function handleLogout() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Unexpected logout error:", err);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile backdrop */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "z-30 flex h-screen flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md transition-all duration-300",
          "fixed left-0 top-0",
          "md:static",
          sidebarMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          "w-64 shrink-0",
          isCollapsed && "md:w-[72px]",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            isCollapsed ? "md:justify-center md:px-0" : "",
          )}
        >
          <Link
            href={logoHref}
            className={cn(
              "flex items-center gap-2.5",
              isCollapsed && "md:justify-center",
            )}
            onClick={closeMobile}
          >
            {logoSrc.startsWith("http") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-[6px] object-contain"
              />
            ) : (
              <Image
                src={logoSrc}
                alt="Logo"
                width={32}
                height={32}
                className="shrink-0 rounded-[6px]"
              />
            )}
            {!isCollapsed && (
              <span className="text-lg font-bold text-text-primary whitespace-nowrap">
                {appName}
              </span>
            )}
          </Link>
        </div>

        {/* Navigation with sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(role),
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx}>
                {sIdx > 0 && (
                  <div className="mx-2 mt-4 mb-2 border-t border-sidebar-border" />
                )}
                {section.label && !isCollapsed && (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {section.label}
                  </p>
                )}

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === logoHref
                        ? pathname === logoHref
                        : pathname === item.href ||
                          pathname.startsWith(item.href + "/");

                    const linkContent = (
                      <Link
                        href={item.href}
                        onClick={closeMobile}
                        className={cn(
                          "group relative flex items-center rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
                          isActive
                            ? "bg-sidebar-accent text-accent"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          isCollapsed && "md:justify-center md:px-0",
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                        )}

                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                            isCollapsed ? "" : "mr-3",
                            isActive &&
                              "drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]",
                          )}
                        />
                        <span className={cn(isCollapsed && "md:hidden")}>
                          {item.label}
                        </span>
                      </Link>
                    );

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-bg-secondary text-text-primary border-border-default"
                          >
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={item.href}>{linkContent}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden border-t border-sidebar-border px-3 py-3 md:block">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm text-sidebar-foreground/50 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label={isCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span className="ml-3">Réduire</span>
              </>
            )}
          </button>
        </div>

        {/* User profile */}
        <div className="border-t border-sidebar-border px-3 py-4">
          <div
            className={cn(
              "flex items-center rounded-xl px-3 py-2.5",
              isCollapsed && "md:justify-center md:px-0",
            )}
          >
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-accent/10"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent ring-2 ring-accent/10">
                  {getInitials(userName)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-sidebar" />
            </div>
            <div
              className={cn("ml-3 min-w-0 flex-1", isCollapsed && "md:hidden")}
            >
              <p className="truncate text-sm font-semibold text-text-primary">
                {userName}
              </p>
              <Badge
                variant={planVariant as "cyan" | "purple" | "muted"}
                className="text-[10px] mt-0.5"
              >
                {planLabel}
              </Badge>
            </div>
          </div>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={settingsHref}
                onClick={closeMobile}
                className={cn(
                  "mt-1 flex w-full items-center rounded-xl px-3 py-2 text-sm transition-all duration-200",
                  pathname.startsWith(settingsHref)
                    ? "bg-sidebar-accent text-accent"
                    : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  isCollapsed && "md:justify-center md:px-0",
                )}
              >
                <Settings
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isCollapsed ? "" : "mr-3",
                  )}
                />
                <span className={cn(isCollapsed && "md:hidden")}>
                  Paramètres
                </span>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent
                side="right"
                className="bg-bg-secondary text-text-primary border-border-default"
              >
                Paramètres
              </TooltipContent>
            )}
          </Tooltip>

          {/* Sign out */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                aria-label="Se déconnecter"
                className={cn(
                  "mt-1 flex w-full items-center rounded-xl px-3 py-2 text-sm text-sidebar-foreground/50 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400",
                  isCollapsed && "md:justify-center md:px-0",
                )}
              >
                <LogOut
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isCollapsed ? "" : "mr-3",
                  )}
                />
                <span className={cn(isCollapsed && "md:hidden")}>
                  Déconnexion
                </span>
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent
                side="right"
                className="bg-bg-secondary text-text-primary border-border-default"
              >
                Déconnexion
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
