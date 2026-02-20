"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DailyTasks } from "@/components/roadmap/daily-tasks";
import { MilestoneTracker } from "@/components/roadmap/milestone-tracker";

export default function RoadmapPage() {
  return (
    <div>
      <PageHeader
        title="Roadmap"
        description="Ta feuille de route personnalisée pour scaler."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <DailyTasks />
        <MilestoneTracker />
      </div>
    </div>
  );
}
