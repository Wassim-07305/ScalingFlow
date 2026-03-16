"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressOverview } from "@/components/gamification/progress-overview";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Zap, Target, Award, TrendingUp } from "lucide-react";

function ProgressStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        {
          icon: Zap,
          label: "XP Total",
          color: "text-accent",
          bg: "bg-accent/10",
          ring: "ring-accent/20",
        },
        {
          icon: Target,
          label: "Objectifs",
          color: "text-info",
          bg: "bg-info/10",
          ring: "ring-info/20",
        },
        {
          icon: Award,
          label: "Badges",
          color: "text-warning",
          bg: "bg-warning/10",
          ring: "ring-warning/20",
        },
        {
          icon: TrendingUp,
          label: "Streak",
          color: "text-purple-400",
          bg: "bg-purple-400/10",
          ring: "ring-purple-400/20",
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-border-default/50 bg-bg-secondary/50 backdrop-blur-sm p-4 flex items-center gap-3 transition-all duration-300 hover:border-border-default hover:shadow-lg"
        >
          <div
            className={`h-10 w-10 rounded-xl ${stat.bg} ring-1 ${stat.ring} flex items-center justify-center`}
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProgressFallback() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="h-24" />
      ))}
    </div>
  );
}

export default function ProgressPage() {
  return (
    <div>
      <PageHeader
        title="Progression"
        description="Suis ta progression et tes accomplissements."
      />
      <ProgressStats />
      <Suspense fallback={<ProgressFallback />}>
        <ProgressOverview />
      </Suspense>
    </div>
  );
}
