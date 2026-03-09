"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ProgressOverview } from "@/components/gamification/progress-overview";

export default function ProgressPage() {
  return (
    <div>
      <PageHeader
        title="Progression"
        description="Suis ta progression et tes achievements."
      />
      <ProgressOverview />
    </div>
  );
}
