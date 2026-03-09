"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { UserRole, NavItem } from "@/lib/types/appshell";
import { MoreHorizontal, X } from "lucide-react";

interface MobileNavProps {
  role: UserRole;
  navItems: NavItem[];
  homeHref?: string;
}

export function MobileNav({ role, navItems, homeHref = "/" }: MobileNavProps) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const filteredItems = navItems.filter((item) => item.roles.includes(role));
  const mainItems = filteredItems.slice(0, 4);
  const overflowItems = filteredItems.slice(4);

  return (
    <>
      {/* Overflow menu */}
      {showMore && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-16 left-0 right-0 bg-bg-primary border-t border-border-default rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-4 gap-3">
              {overflowItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== homeHref && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg text-[11px] font-medium transition-colors",
                      isActive ? "text-accent bg-accent-muted" : "text-text-muted hover:bg-bg-tertiary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate w-full text-center">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border-default bg-bg-primary/95 backdrop-blur-sm md:hidden">
        {mainItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== homeHref && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors",
                isActive ? "text-accent" : "text-text-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {overflowItems.length > 0 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors",
              showMore ? "text-accent" : "text-text-muted"
            )}
          >
            {showMore ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
            <span>Plus</span>
          </button>
        )}
      </nav>
    </>
  );
}
