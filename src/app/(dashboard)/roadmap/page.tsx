"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DailyTasks } from "@/components/roadmap/daily-tasks";
import { MilestoneTracker } from "@/components/roadmap/milestone-tracker";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Map } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

const TIMEFRAMES = [
  { key: "30", label: "30 jours" },
  { key: "60", label: "60 jours" },
  { key: "90", label: "90 jours" },
] as const;

const FOCUS_AREAS = [
  { key: "lancement", label: "Lancement" },
  { key: "croissance", label: "Croissance" },
  { key: "optimisation", label: "Optimisation" },
  { key: "scaling", label: "Scaling" },
] as const;

export default function RoadmapPage() {
  const [generating, setGenerating] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [showConfig, setShowConfig] = React.useState(false);

  // Form state
  const [timeframe, setTimeframe] = React.useState("30");
  const [focus, setFocus] = React.useState("lancement");
  const [priorities, setPriorities] = React.useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeframe,
          focus,
          priorities: priorities || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors de la génération");
      }

      const data = await res.json();
      toast.success(
        `Roadmap générée : ${data.tasks_count} tâches, ~${data.total_estimated_hours}h au total`
      );
      setRefreshKey((k) => k + 1);
      setShowConfig(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de générer la roadmap"
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
        description="Ta feuille de route personnalisée pour scaler."
        actions={
          <Button
            variant={showConfig ? "outline" : "default"}
            onClick={() => setShowConfig(!showConfig)}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Génération en cours..." : showConfig ? "Masquer" : "Générer ma roadmap IA"}
          </Button>
        }
      />

      {/* Generation config panel */}
      {showConfig && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-accent" />
              Paramètres de la roadmap
            </CardTitle>
            <CardDescription>
              Configure les paramètres pour générer une feuille de route adaptée à ta situation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Timeframe */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Horizon</label>
              <div className="flex gap-2">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTimeframe(t.key)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      timeframe === t.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus area */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Phase de focus</label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFocus(f.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      focus === f.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priorities */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Priorités spécifiques <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <textarea
                value={priorities}
                onChange={(e) => setPriorities(e.target.value)}
                placeholder="Ex: lancer ma première offre, atteindre 10 clients, mettre en place un funnel..."
                rows={2}
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            <Button size="lg" onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Génération en cours...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Générer ma roadmap</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyTasks refreshKey={refreshKey} />
        <MilestoneTracker />
      </div>
    </div>
  );
}
