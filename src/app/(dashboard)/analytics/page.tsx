"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/shared/tab-bar";
import { PerformanceDashboard } from "@/components/analytics/performance-dashboard";
import { OptimizationRecommendations } from "@/components/analytics/optimization-recommendations";
import { ABTestManager } from "@/components/analytics/ab-test-manager";
import { AttributionModel } from "@/components/analytics/attribution-model";
import { LTVCACTracker } from "@/components/analytics/ltv-cac-tracker";
import { MetricsHistory } from "@/components/analytics/metrics-history";
import { GrowthTiers } from "@/components/analytics/growth-tiers";
import { RevenueTracker } from "@/components/analytics/revenue-tracker";
import { RealRoas } from "@/components/analytics/real-roas";
import { BottleneckDetector } from "@/components/analytics/bottleneck-detector";
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

      {renderContent()}
    </div>
  );
}
