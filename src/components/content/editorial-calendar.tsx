"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { Sparkles, LayoutGrid, List, ChevronDown, ChevronUp, CheckCircle2, Clock, Circle } from "lucide-react";
import { toast } from "sonner";
import type { ContentStrategyResult } from "@/lib/ai/prompts/content-strategy";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface EditorialCalendarProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

type CalendarItem = ContentStrategyResult["calendrier"][number];

type ContentStatus = "draft" | "scheduled" | "published";

const STATUS_CONFIG: Record<ContentStatus, { label: string; icon: typeof Circle; color: string }> = {
  draft: { label: "Brouillon", icon: Circle, color: "text-text-muted" },
  scheduled: { label: "Planifie", icon: Clock, color: "text-yellow-400" },
  published: { label: "Publie", icon: CheckCircle2, color: "text-accent" },
};

const NEXT_STATUS: Record<ContentStatus, ContentStatus> = {
  draft: "scheduled",
  scheduled: "published",
  published: "draft",
};

const PILIER_BADGE: Record<string, "default" | "blue" | "cyan" | "purple" | "yellow"> = {
  know: "blue",
  like: "purple",
  trust: "default",
  convert: "yellow",
};

const PILIER_LABEL: Record<string, string> = {
  know: "Know",
  like: "Like",
  trust: "Trust",
  convert: "Convert",
};

export function EditorialCalendar({ className, initialData }: EditorialCalendarProps) {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<CalendarItem[]>([]);
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [filter, setFilter] = React.useState<string | null>(null);
  const [expandedDay, setExpandedDay] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [statuses, setStatuses] = React.useState<Record<number, ContentStatus>>({});

  const toggleStatus = (jour: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatuses((prev) => {
      const current = prev[jour] || "draft";
      return { ...prev, [jour]: NEXT_STATUS[current] };
    });
  };

  const getStatus = (jour: number): ContentStatus => statuses[jour] || "draft";

  const statusCounts = React.useMemo(() => {
    const counts = { draft: 0, scheduled: 0, published: 0 };
    items.forEach((item) => {
      const s = statuses[item.jour] || "draft";
      counts[s]++;
    });
    return counts;
  }, [items, statuses]);

  React.useEffect(() => {
    if (initialData) {
      const result = initialData as ContentStrategyResult;
      setItems(result.calendrier || []);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const response = await fetch("/api/ai/generate-editorial-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: tomorrow }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
      }
      const data = await response.json();
      const result = data.result as ContentStrategyResult;
      setItems(result.calendrier || []);
      toast.success("Plan editorial genere !");
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
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Generation du plan editorial" className={className} />;
  }

  if (items.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer le plan editorial 30 jours
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          Un contenu par jour pendant 30 jours
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              !filter
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            Tous
          </button>
          {(["know", "like", "trust", "convert"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(filter === p ? null : p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === p
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              {PILIER_LABEL[p]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-accent" />{statusCounts.published}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-yellow-400" />{statusCounts.scheduled}</span>
              <span className="flex items-center gap-1"><Circle className="h-3 w-3 text-text-muted" />{statusCounts.draft}</span>
            </div>
          )}
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
      </div>

      {/* Grid view */}
      {view === "grid" ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {filteredItems.map((item) => (
            <Card
              key={item.jour}
              className={cn(
                "cursor-pointer transition-all",
                expandedDay === item.jour && "ring-1 ring-accent"
              )}
              onClick={() => setExpandedDay(expandedDay === item.jour ? null : item.jour)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-text-primary">J{item.jour}</span>
                    <button
                      onClick={(e) => toggleStatus(item.jour, e)}
                      title={STATUS_CONFIG[getStatus(item.jour)].label}
                      className="p-0.5 rounded hover:bg-bg-tertiary transition-colors"
                    >
                      {React.createElement(STATUS_CONFIG[getStatus(item.jour)].icon, {
                        className: cn("h-3.5 w-3.5", STATUS_CONFIG[getStatus(item.jour)].color),
                      })}
                    </button>
                  </div>
                  <Badge variant={PILIER_BADGE[item.pilier]} className="text-[10px] px-1.5 py-0">
                    {PILIER_LABEL[item.pilier]}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted mb-1">{item.type_contenu}</p>
                <p className="text-xs font-medium text-text-primary line-clamp-2">{item.titre}</p>
                {expandedDay === item.jour && (
                  <div className="mt-3 pt-3 border-t border-border-default space-y-2">
                    <div>
                      <p className="text-[10px] text-text-muted">Hook</p>
                      <p className="text-xs text-accent">{item.hook}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="muted" className="text-[10px]">{item.plateforme}</Badge>
                      <Badge variant="muted" className="text-[10px]">{item.format}</Badge>
                    </div>
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
              className="cursor-pointer"
              onClick={() => setExpandedDay(expandedDay === item.jour ? null : item.jour)}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-text-primary w-8 shrink-0">
                    J{item.jour}
                  </span>
                  <button
                    onClick={(e) => toggleStatus(item.jour, e)}
                    title={STATUS_CONFIG[getStatus(item.jour)].label}
                    className="p-1 rounded hover:bg-bg-tertiary transition-colors shrink-0"
                  >
                    {React.createElement(STATUS_CONFIG[getStatus(item.jour)].icon, {
                      className: cn("h-4 w-4", STATUS_CONFIG[getStatus(item.jour)].color),
                    })}
                  </button>
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
                    <div className="flex gap-2">
                      <Badge variant="muted">{item.plateforme}</Badge>
                      <Badge variant="muted">{item.format}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center pt-4">
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          Regenerer le plan
        </Button>
      </div>
    </div>
  );
}
