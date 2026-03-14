"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DailyTasks } from "@/components/roadmap/daily-tasks";
import { MilestoneTracker } from "@/components/roadmap/milestone-tracker";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

export default function RoadmapPage() {
  const [generating, setGenerating] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors de la generation");
      }

      const data = await res.json();
      toast.success(
        `Roadmap generee : ${data.tasks_count} taches, ~${data.total_estimated_hours}h au total`
      );
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de generer la roadmap"
      );
    } finally {
      setGenerating(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} />;
  }

  return (
    <div>
      <PageHeader
        title="Feuille de Route"
        description="Ta feuille de route personnalisee pour scaler."
        actions={
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Generation en cours..." : "Generer ma roadmap IA"}
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <DailyTasks refreshKey={refreshKey} />
        <MilestoneTracker />
      </div>
    </div>
  );
}
