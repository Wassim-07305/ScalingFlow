"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/page-header";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { BusinessPipeline } from "@/components/dashboard/business-pipeline";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { NextTasks } from "@/components/dashboard/next-tasks";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations";
import { WeeklyChallenges } from "@/components/dashboard/weekly-challenges";
import { BusinessScoreWidget } from "@/components/dashboard/business-score-widget";
import { GrowthTierWidget } from "@/components/dashboard/growth-tier-widget";
import { SkeletonCard, SkeletonDashboard } from "@/components/ui/skeleton";

// Chargement différé des composants Recharts (bundle lourd, non critique au premier rendu)
const RevenueChart = dynamic(
  () => import("@/components/dashboard/revenue-chart").then((m) => ({ default: m.RevenueChart })),
  { ssr: false, loading: () => <SkeletonCard className="h-64" /> },
);
const LeadsChart = dynamic(
  () => import("@/components/dashboard/leads-chart").then((m) => ({ default: m.LeadsChart })),
  { ssr: false, loading: () => <SkeletonCard className="h-64" /> },
);

function SectionFallback({ className }: { className?: string }) {
  return <SkeletonCard className={className} />;
}

export default function DashboardPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Tableau de Bord"
        description="Vue d'ensemble de ton business."
      />

      <Suspense fallback={<SkeletonDashboard />}>
        <div className="space-y-4 sm:space-y-6">
          <Suspense fallback={<SectionFallback className="h-24" />}>
            <WelcomeBanner />
          </Suspense>

          <Suspense
            fallback={
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <SectionFallback key={i} />
                ))}
              </div>
            }
          >
            <StatsOverview />
          </Suspense>

          <ProgressBar />

          <Suspense fallback={<SectionFallback className="h-16" />}>
            <GrowthTierWidget />
          </Suspense>

          <Suspense fallback={<SectionFallback className="h-64" />}>
            <BusinessScoreWidget />
          </Suspense>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Suspense fallback={<SectionFallback className="h-48" />}>
              <BusinessPipeline />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-48" />}>
              <NextTasks />
            </Suspense>
          </div>

          <WeeklyChallenges />
          <SmartRecommendations />
          <ActivityFeed />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Suspense fallback={<SectionFallback className="h-64" />}>
              <RevenueChart />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-64" />}>
              <LeadsChart />
            </Suspense>
          </div>

          <QuickActions />
        </div>
      </Suspense>
    </div>
  );
}
