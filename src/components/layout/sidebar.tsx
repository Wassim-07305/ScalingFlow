"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/stores/app-store";
import { NAV_ITEMS, NAV_BOTTOM } from "@/lib/utils/constants";
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
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen flex flex-col border-r border-border-default bg-bg-secondary transition-all duration-200",
          sidebarCollapsed ? "w-[64px]" : "w-[220px]",
          "max-lg:-translate-x-full max-lg:w-[220px]",
          sidebarMobileOpen && "max-lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/icon-192.png"
              alt="ScalingFlow"
              width={28}
              height={28}
              className="rounded-[6px]"
            />
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold text-text-primary">
                ScalingFlow
              </span>
            )}
          </Link>
          <button
            onClick={() => {
              if (sidebarMobileOpen) {
                setSidebarMobileOpen(false);
              } else {
                toggleSidebar();
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-150"
          >
            {sidebarMobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform duration-150",
                  sidebarCollapsed && "rotate-180"
                )}
              />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
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
                  "flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-accent")} />

                {!sidebarCollapsed && <span>{item.label}</span>}

                {item.badge && !sidebarCollapsed && (
                  <span className="ml-auto text-[10px] bg-accent-muted text-accent px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-3 space-y-0.5">
          <Separator className="mb-2" />
          {NAV_BOTTOM.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-bg-tertiary text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
