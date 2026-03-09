"use client";

import { PageHeader } from "@/components/layout/page-header";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { BusinessPipeline } from "@/components/dashboard/business-pipeline";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { NextTasks } from "@/components/dashboard/next-tasks";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de ton business."
      />

      <div className="space-y-6">
        {/* Welcome Banner (name, plan, usage) */}
        <WelcomeBanner />

        {/* KPI Cards */}
        <StatsOverview />

        {/* Progress Bars (XP + Roadmap) */}
        <ProgressBar />

        {/* Pipeline + Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BusinessPipeline />
          <NextTasks />
        </div>

        {/* Activity Feed */}
        <ActivityFeed />

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
