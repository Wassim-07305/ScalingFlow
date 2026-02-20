"use client";

import { PageHeader } from "@/components/layout/page-header";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";

export default function LeaderboardPage() {
  return (
    <div>
      <PageHeader
        title="Leaderboard"
        description="Classement de la communauté ScalingFlow."
      />
      <LeaderboardTable />
    </div>
  );
}
