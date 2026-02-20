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
          "transition-all duration-200 p-6 pb-20 lg:pb-6",
          sidebarCollapsed ? "lg:ml-[64px]" : "lg:ml-[220px]"
        )}
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
