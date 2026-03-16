"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Trophy, Medal, Star } from "lucide-react";

function LeaderboardHeader() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        {
          icon: Trophy,
          label: "1er",
          desc: "Top performer",
          color: "text-yellow-400",
          bg: "bg-yellow-400/10",
          border: "border-yellow-400/20",
          shadow: "shadow-yellow-400/5",
        },
        {
          icon: Medal,
          label: "2ème",
          desc: "En progression",
          color: "text-gray-300",
          bg: "bg-gray-300/10",
          border: "border-gray-300/20",
          shadow: "shadow-gray-300/5",
        },
        {
          icon: Star,
          label: "3ème",
          desc: "Challenger",
          color: "text-orange-400",
          bg: "bg-orange-400/10",
          border: "border-orange-400/20",
          shadow: "shadow-orange-400/5",
        },
      ].map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border ${item.border} bg-bg-secondary/50 backdrop-blur-sm p-5 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${item.shadow}`}
        >
          <div
            className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-3 ring-1 ring-white/5`}
          >
            <item.icon className={`h-6 w-6 ${item.color}`} />
          </div>
          <p className="text-sm font-bold text-text-primary">{item.label}</p>
          <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <div>
      <PageHeader
        title="Classement"
        description="Classement de la communauté ScalingFlow."
      />
      <LeaderboardHeader />
      <Suspense
        fallback={
          <div className="rounded-[12px] border border-border-default bg-bg-secondary p-5">
            <SkeletonTable rows={8} cols={5} />
          </div>
        }
      >
        <LeaderboardTable />
      </Suspense>
    </div>
  );
}
