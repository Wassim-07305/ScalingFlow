"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import {
  Sparkles,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { EditorialCalendarResult } from "@/lib/ai/prompts/editorial-calendar";

type CalendarItem = EditorialCalendarResult["calendrier"][number];

const PILIER_BADGE: Record<string, "default" | "blue" | "cyan" | "purple"> = {
  know: "blue",
  like: "purple",
  trust: "default",
};

const PILIER_LABEL: Record<string, string> = {
  know: "Know",
  like: "Like",
  trust: "Trust",
};

const PILIER_EMOJI: Record<string, string> = {
  know: "📚",
  like: "❤️",
  trust: "🏆",
};

export default function EditorialCalendarPage() {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<CalendarItem[]>([]);
  const [strategie, setStrategie] = React.useState<
    EditorialCalendarResult["strategie"] | null
  >(null);
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [filter, setFilter] = React.useState<string | null>(null);
  const [expandedDay, setExpandedDay] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const tomorrow = new Date(Date.now() + 86400000)
        .toISOString()
        .split("T")[0];

      const response = await fetch("/api/ai/generate-editorial-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: tomorrow }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la génération");
      }

      const data = await response.json();
      const result = data.result as EditorialCalendarResult;
      setItems(result.calendrier || []);
      setStrategie(result.strategie || null);
      toast.success("Plan éditorial 30 jours généré !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = filter
    ? items.filter((item) => item.pilier === filter)
    : items;

  if (usageLimited) {
    return (
      <UpgradeWall
        currentUsage={usageLimited.currentUsage}
        limit={usageLimited.limit}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Plan Éditorial 30 Jours"
          description="Génère un calendrier de contenu structuré sur 30 jours avec les piliers K/L/T."
        />
      </div>

      {loading && (
        <AILoading text="Génération du plan éditorial 30 jours — cela peut prendre quelques secondes" />
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center rounded-full bg-accent/10 p-4 mb-4">
            <CalendarDays className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Plan éditorial intelligent
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            Génère un plan de contenu personnalisé sur 30 jours basé sur ton
            offre, ton marché et les piliers Know / Like / Trust.
          </p>
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Button size="lg" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer mon plan éditorial
          </Button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-6">
          {/* Strategy summary */}
          {strategie && (
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary mb-1">
                      {strategie.objectif_30j}
                    </p>
                    <p className="text-xs text-text-muted">
                      Plateformes : {strategie.plateformes.join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {(["know", "like", "trust"] as const).map((p) => (
                      <div key={p} className="text-center">
                        <span className="text-lg">{PILIER_EMOJI[p]}</span>
                        <p className="text-xs font-bold text-text-primary">
                          {strategie.piliers[p].pourcentage}%
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {PILIER_LABEL[p]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  !filter
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                )}
              >
                Tous ({items.length})
              </button>
              {(["know", "like", "trust"] as const).map((p) => {
                const count = items.filter((i) => i.pilier === p).length;
                return (
                  <button
                    key={p}
                    onClick={() => setFilter(filter === p ? null : p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      filter === p
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {PILIER_LABEL[p]} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1">
              <Button
                variant={view === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Grid view */}
          {view === "grid" ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
              {filteredItems.map((item) => (
                <Card
                  key={item.jour}
                  className={cn(
                    "cursor-pointer transition-all hover:ring-1 hover:ring-accent/50",
                    expandedDay === item.jour && "ring-1 ring-accent",
                  )}
                  onClick={() =>
                    setExpandedDay(expandedDay === item.jour ? null : item.jour)
                  }
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-text-primary">
                        J{item.jour}
                      </span>
                      <Badge
                        variant={PILIER_BADGE[item.pilier]}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {PILIER_LABEL[item.pilier]}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-text-muted mb-1">
                      {item.date}
                    </p>
                    <p className="text-xs text-text-muted mb-1">
                      {item.type_contenu}
                    </p>
                    <p className="text-xs font-medium text-text-primary line-clamp-2">
                      {item.titre}
                    </p>
                    {expandedDay === item.jour && (
                      <div className="mt-3 pt-3 border-t border-border-default space-y-2">
                        <div>
                          <p className="text-[10px] text-text-muted">Hook</p>
                          <p className="text-xs text-accent">{item.hook}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted">CTA</p>
                          <p className="text-xs text-text-primary">
                            {item.cta}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="muted" className="text-[10px]">
                            {item.plateforme}
                          </Badge>
                          <Badge variant="muted" className="text-[10px]">
                            {item.format}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-text-muted italic">
                          {item.objectif}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <Card
                  key={item.jour}
                  className="cursor-pointer hover:ring-1 hover:ring-accent/50 transition-all"
                  onClick={() =>
                    setExpandedDay(expandedDay === item.jour ? null : item.jour)
                  }
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-text-primary w-8 shrink-0">
                        J{item.jour}
                      </span>
                      <span className="text-xs text-text-muted w-20 shrink-0">
                        {item.date}
                      </span>
                      <Badge
                        variant={PILIER_BADGE[item.pilier]}
                        className="shrink-0"
                      >
                        {PILIER_LABEL[item.pilier]}
                      </Badge>
                      <span className="text-sm text-text-muted shrink-0 w-32 truncate">
                        {item.type_contenu}
                      </span>
                      <span className="text-sm font-medium text-text-primary flex-1 truncate">
                        {item.titre}
                      </span>
                      {expandedDay === item.jour ? (
                        <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                      )}
                    </div>
                    {expandedDay === item.jour && (
                      <div className="mt-3 pt-3 border-t border-border-default ml-8 space-y-2">
                        <div>
                          <p className="text-xs text-text-muted">Hook</p>
                          <p className="text-sm text-accent">{item.hook}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">CTA</p>
                          <p className="text-sm text-text-primary">
                            {item.cta}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="muted">{item.plateforme}</Badge>
                          <Badge variant="muted">{item.format}</Badge>
                        </div>
                        <p className="text-xs text-text-muted italic">
                          {item.objectif}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center pt-4">
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              <Sparkles className="h-3 w-3 mr-2" />
              Régénérer le plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
