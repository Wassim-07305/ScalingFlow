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
        { icon: Trophy, label: "1er", desc: "Top performer", color: "text-yellow-400", bg: "bg-yellow-400/10" },
        { icon: Medal, label: "2ème", desc: "En progression", color: "text-gray-300", bg: "bg-gray-300/10" },
        { icon: Star, label: "3ème", desc: "Challenger", color: "text-orange-400", bg: "bg-orange-400/10" },
      ].map((item) => (
        <div key={item.label} className={`rounded-[12px] border border-border-default bg-bg-secondary p-4 text-center`}>
          <div className={`h-10 w-10 rounded-full ${item.bg} flex items-center justify-center mx-auto mb-2`}>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </div>
          <p className="text-sm font-semibold text-text-primary">{item.label}</p>
          <p className="text-xs text-text-muted">{item.desc}</p>
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
      <Suspense fallback={<div className="rounded-[12px] border border-border-default bg-bg-secondary p-5"><SkeletonTable rows={8} cols={5} /></div>}>
        <LeaderboardTable />
      </Suspense>
    </div>
  );
}
