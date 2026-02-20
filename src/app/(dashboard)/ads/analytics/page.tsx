"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { TrendingUp, Eye, MousePointer, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

const MOCK_METRICS = [
  { label: "ROAS", value: 3.2, suffix: "x", change: "+0.4", positive: true, icon: TrendingUp, color: "text-accent" },
  { label: "CPA Moyen", value: 6.5, suffix: "€", change: "-1.2€", positive: true, icon: DollarSign, color: "text-accent" },
  { label: "CTR Moyen", value: 4.8, suffix: "%", change: "+0.6%", positive: true, icon: MousePointer, color: "text-info" },
  { label: "CPM", value: 12.3, suffix: "€", change: "+2.1€", positive: false, icon: Eye, color: "text-accent" },
];

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics Ads" description="Analyse les performances de tes publicités." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {MOCK_METRICS.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-muted">{metric.label}</p>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <p className="text-2xl font-bold text-text-primary">
                <AnimatedCounter value={metric.value} />
                {metric.suffix}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {metric.positive ? (
                  <ArrowUpRight className="h-3 w-3 text-accent" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-danger" />
                )}
                <span className={`text-xs ${metric.positive ? "text-accent" : "text-danger"}`}>
                  {metric.change}
                </span>
                <span className="text-xs text-text-muted">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performances par période</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            Les graphiques d&apos;analytics détaillés seront disponibles une fois les campagnes connectées via l&apos;API Meta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
