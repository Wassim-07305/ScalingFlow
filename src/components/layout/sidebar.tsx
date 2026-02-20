"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/stores/app-store";
import { NAV_ITEMS, NAV_BOTTOM } from "@/lib/utils/constants";
import { NeonGradientText } from "@/components/shared/neon-gradient-text";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } =
    useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen flex flex-col border-r border-border-default transition-all duration-300",
          "bg-gradient-to-b from-bg-primary to-bg-secondary",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]",
          // Mobile
          "max-lg:-translate-x-full max-lg:w-[260px]",
          sidebarMobileOpen && "max-lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <NeonGradientText className="text-xl font-bold">
                ScalingFlow
              </NeonGradientText>
            </Link>
          )}
          <button
            onClick={() => {
              if (sidebarMobileOpen) {
                setSidebarMobileOpen(false);
              } else {
                toggleSidebar();
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            {sidebarMobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  sidebarCollapsed && "rotate-180"
                )}
              />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarMobileOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-neon-orange-glow text-neon-orange"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-neon-orange shadow-[0_0_10px_rgba(255,107,44,0.5)]" />
                )}

                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-neon-orange")} />

                {!sidebarCollapsed && <span>{item.label}</span>}

                {item.badge && !sidebarCollapsed && (
                  <span className="ml-auto text-xs bg-neon-orange-glow text-neon-orange px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-3 space-y-1">
          <Separator className="mb-2" />
          {NAV_BOTTOM.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-bg-tertiary text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
