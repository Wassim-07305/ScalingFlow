"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de ton business."
      />

      <div className="space-y-6">
        {/* KPI Cards */}
        <StatsOverview />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <LeadsChart />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}
