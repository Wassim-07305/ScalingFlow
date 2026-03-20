"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/shared/tab-bar";
import { SkeletonCard } from "@/components/ui/skeleton";

const tabFallback = <SkeletonCard className="h-96 mt-6" />;

// Chargement différé de chaque onglet — le JS n'est téléchargé qu'au premier clic
const PerformanceDashboard = dynamic(
  () => import("@/components/analytics/performance-dashboard").then((m) => ({ default: m.PerformanceDashboard })),
  { loading: () => tabFallback },
);
const OptimizationRecommendations = dynamic(
  () => import("@/components/analytics/optimization-recommendations").then((m) => ({ default: m.OptimizationRecommendations })),
  { loading: () => tabFallback },
);
const ABTestManager = dynamic(
  () => import("@/components/analytics/ab-test-manager").then((m) => ({ default: m.ABTestManager })),
  { loading: () => tabFallback },
);
const AttributionModel = dynamic(
  () => import("@/components/analytics/attribution-model").then((m) => ({ default: m.AttributionModel })),
  { loading: () => tabFallback },
);
const LTVCACTracker = dynamic(
  () => import("@/components/analytics/ltv-cac-tracker").then((m) => ({ default: m.LTVCACTracker })),
  { loading: () => tabFallback },
);
const MetricsHistory = dynamic(
  () => import("@/components/analytics/metrics-history").then((m) => ({ default: m.MetricsHistory })),
  { loading: () => tabFallback },
);
const GrowthTiers = dynamic(
  () => import("@/components/analytics/growth-tiers").then((m) => ({ default: m.GrowthTiers })),
  { loading: () => tabFallback },
);
const RevenueTracker = dynamic(
  () => import("@/components/analytics/revenue-tracker").then((m) => ({ default: m.RevenueTracker })),
  { loading: () => tabFallback },
);
const RealRoas = dynamic(
  () => import("@/components/analytics/real-roas").then((m) => ({ default: m.RealRoas })),
  { loading: () => tabFallback },
);
const BottleneckDetector = dynamic(
  () => import("@/components/analytics/bottleneck-detector").then((m) => ({ default: m.BottleneckDetector })),
  { loading: () => tabFallback },
);
import {
  BarChart3,
  Sparkles,
  FlaskConical,
  GitBranch,
  TrendingUp,
  History,
  Rocket,
  Receipt,
  Calculator,
  AlertTriangle,
} from "lucide-react";

const TABS = [
  { key: "dashboard", label: "Tableau de bord", icon: BarChart3 },
  { key: "optimization", label: "Recommandations IA", icon: Sparkles },
  { key: "growth_tiers", label: "Paliers", icon: Rocket },
  { key: "ab_testing", label: "A/B Testing", icon: FlaskConical },
  { key: "attribution", label: "Attribution", icon: GitBranch },
  { key: "ltv_cac", label: "LTV / CAC", icon: TrendingUp },
  { key: "revenue", label: "Revenue & Attribution", icon: Receipt },
  { key: "roas", label: "Vrai ROAS", icon: Calculator },
  { key: "bottlenecks", label: "Bottlenecks", icon: AlertTriangle },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <PerformanceDashboard />;
      case "optimization":
        return <OptimizationRecommendations />;
      case "growth_tiers":
        return <GrowthTiers />;
      case "ab_testing":
        return <ABTestManager />;
      case "attribution":
        return <AttributionModel />;
      case "ltv_cac":
        return <LTVCACTracker />;
      case "revenue":
        return <RevenueTracker />;
      case "roas":
        return <RealRoas />;
      case "bottlenecks":
        return <BottleneckDetector />;
      case "history":
        return <MetricsHistory />;
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader
        title="Analytiques"
        description="Tableau de bord de performance, optimisations IA et suivi de tes métriques."
      />

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <Suspense fallback={tabFallback}>
        {renderContent()}
      </Suspense>
    </div>
  );
}
