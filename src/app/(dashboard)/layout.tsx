"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils/cn";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <Topbar />
      <main
        className={cn(
          "transition-all duration-300 p-6 pb-24 lg:pb-6",
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
        )}
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
