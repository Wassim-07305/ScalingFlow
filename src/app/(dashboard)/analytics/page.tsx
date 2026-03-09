"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PerformanceDashboard } from "@/components/analytics/performance-dashboard";
import { OptimizationRecommendations } from "@/components/analytics/optimization-recommendations";
import { ABTestManager } from "@/components/analytics/ab-test-manager";
import { AttributionModel } from "@/components/analytics/attribution-model";
import { LTVCACTracker } from "@/components/analytics/ltv-cac-tracker";
import { MetricsHistory } from "@/components/analytics/metrics-history";
import { cn } from "@/lib/utils/cn";
import {
  BarChart3,
  Sparkles,
  FlaskConical,
  GitBranch,
  TrendingUp,
  History,
} from "lucide-react";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "optimization", label: "Recommandations IA", icon: Sparkles },
  { key: "ab_testing", label: "A/B Testing", icon: FlaskConical },
  { key: "attribution", label: "Attribution", icon: GitBranch },
  { key: "ltv_cac", label: "LTV / CAC", icon: TrendingUp },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("dashboard");

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Tableau de bord de performance, optimisations IA et suivi de vos metriques."
      />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && <PerformanceDashboard />}
      {activeTab === "optimization" && <OptimizationRecommendations />}
      {activeTab === "ab_testing" && <ABTestManager />}
      {activeTab === "attribution" && <AttributionModel />}
      {activeTab === "ltv_cac" && <LTVCACTracker />}
      {activeTab === "history" && <MetricsHistory />}
    </div>
  );
}
