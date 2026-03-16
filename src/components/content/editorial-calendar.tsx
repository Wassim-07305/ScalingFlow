"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import {
  Sparkles,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Circle,
  CalendarDays,
  Send,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { EditorialCalendarResult } from "@/lib/ai/prompts/editorial-calendar";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { UnipilePublishDialog } from "@/components/shared/unipile-publish-dialog";

const CALENDAR_DURATIONS = [
  { key: "7", label: "7 jours" },
  { key: "14", label: "14 jours" },
  { key: "30", label: "30 jours" },
] as const;

interface EditorialCalendarProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

type CalendarItem = EditorialCalendarResult["calendrier"][number];

type ContentStatus = "draft" | "scheduled" | "published";

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; icon: typeof Circle; color: string }
> = {
  draft: { label: "Brouillon", icon: Circle, color: "text-text-muted" },
  scheduled: { label: "Planifié", icon: Clock, color: "text-yellow-400" },
  published: { label: "Publié", icon: CheckCircle2, color: "text-accent" },
};

const NEXT_STATUS: Record<ContentStatus, ContentStatus> = {
  draft: "scheduled",
  scheduled: "published",
  published: "draft",
};

const PILIER_BADGE: Record<
  string,
  "default" | "blue" | "cyan" | "purple" | "yellow"
> = {
  know: "blue",
  like: "purple",
  trust: "default",
};

const PILIER_LABEL: Record<string, string> = {
  know: "Know",
  like: "Like",
  trust: "Trust",
};

export function EditorialCalendar({
  className,
  initialData,
}: EditorialCalendarProps) {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<CalendarItem[]>([]);
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [filter, setFilter] = React.useState<string | null>(null);
  const [expandedDay, setExpandedDay] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);
  const [statuses, setStatuses] = React.useState<Record<number, ContentStatus>>(
    {},
  );
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishContent, setPublishContent] = React.useState("");

  // Form state
  const [duration, setDuration] = React.useState("30");
  const [pillars, setPillars] = React.useState("");
  const [showForm, setShowForm] = React.useState(true);
  const [startDate, setStartDate] = React.useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split("T")[0];
  });

  /** Retourne la date réelle pour un jour du calendrier */
  const getDateForDay = (jour: number): Date => {
    return addDays(new Date(startDate), jour - 1);
  };

  /** Formate la date pour l'affichage */
  const formatCalendarDate = (jour: number): string => {
    const date = getDateForDay(jour);
    return format(date, "d MMM", { locale: fr });
  };

  /** Formate le jour de la semaine */
  const formatWeekday = (jour: number): string => {
    const date = getDateForDay(jour);
    return format(date, "EEE", { locale: fr });
  };

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
      const result = initialData as EditorialCalendarResult;
      setItems(result.calendrier || []);
      setShowForm(false);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-editorial-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          duration: parseInt(duration),
          pillars: pillars || undefined,
        }),
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
      setShowForm(false);
      toast.success("Plan éditorial généré !");
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
        className={className}
      />
    );
  }

  if (loading) {
    return (
      <AILoading text="Génération du plan éditorial" className={className} />
    );
  }

  if (items.length === 0 || showForm) {
    return (
      <div
        className={cn(
          "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
          className,
        )}
      >
        <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-accent" />
              Plan éditorial
            </CardTitle>
            <CardDescription>
              Configure la durée et les piliers de contenu pour générer un
              calendrier éditorial complet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Start date */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                <Calendar className="h-4 w-4 inline mr-1.5 text-accent" />
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Durée du calendrier
              </label>
              <div className="flex flex-wrap gap-2">
                {CALENDAR_DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDuration(d.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      duration === d.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content pillars */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Piliers de contenu{" "}
                <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={pillars}
                onChange={(e) => setPillars(e.target.value)}
                placeholder="Ex: expertise, coulisses, témoignages, offres..."
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button size="lg" onClick={handleGenerate} className="w-full group">
              <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
              Générer le plan éditorial {duration} jours
            </Button>
            <p className="text-xs text-text-muted text-center">
              Un contenu par jour pendant {duration} jours
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
        className,
      )}
    >
      {/* Date de début */}
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-accent shrink-0" />
        <label className="text-sm text-text-secondary shrink-0">Début :</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-border-default bg-bg-secondary px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
        />
      </div>

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
            Tous
          </button>
          {(["know", "like", "trust"] as const).map((p) => (
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
              {PILIER_LABEL[p]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-accent" />
                {statusCounts.published}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-400" />
                {statusCounts.scheduled}
              </span>
              <span className="flex items-center gap-1">
                <Circle className="h-3 w-3 text-text-muted" />
                {statusCounts.draft}
              </span>
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
                "cursor-pointer transition-all duration-300 hover:border-accent/20 hover:shadow-md hover:shadow-accent/5",
                expandedDay === item.jour &&
                  "ring-1 ring-accent shadow-lg shadow-accent/10",
              )}
              onClick={() =>
                setExpandedDay(expandedDay === item.jour ? null : item.jour)
              }
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-primary">
                        {formatCalendarDate(item.jour)}
                      </span>
                      <span className="text-[9px] text-text-muted capitalize">
                        {formatWeekday(item.jour)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => toggleStatus(item.jour, e)}
                      title={STATUS_CONFIG[getStatus(item.jour)].label}
                      className="p-0.5 rounded hover:bg-bg-tertiary transition-colors"
                    >
                      {React.createElement(
                        STATUS_CONFIG[getStatus(item.jour)].icon,
                        {
                          className: cn(
                            "h-3.5 w-3.5",
                            STATUS_CONFIG[getStatus(item.jour)].color,
                          ),
                        },
                      )}
                    </button>
                  </div>
                  <Badge
                    variant={PILIER_BADGE[item.pilier]}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {PILIER_LABEL[item.pilier]}
                  </Badge>
                </div>
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
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="muted" className="text-[10px]">
                          {item.plateforme}
                        </Badge>
                        <Badge variant="muted" className="text-[10px]">
                          {item.format}
                        </Badge>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPublishContent(`${item.titre}\n\n${item.hook}`);
                          setPublishDialogOpen(true);
                        }}
                        title="Publier via Unipile"
                        className="p-1 rounded hover:bg-bg-tertiary transition-colors text-accent"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
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
              onClick={() =>
                setExpandedDay(expandedDay === item.jour ? null : item.jour)
              }
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-16">
                    <span className="text-sm font-bold text-text-primary block">
                      {formatCalendarDate(item.jour)}
                    </span>
                    <span className="text-[10px] text-text-muted capitalize">
                      {formatWeekday(item.jour)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => toggleStatus(item.jour, e)}
                    title={STATUS_CONFIG[getStatus(item.jour)].label}
                    className="p-1 rounded hover:bg-bg-tertiary transition-colors shrink-0"
                  >
                    {React.createElement(
                      STATUS_CONFIG[getStatus(item.jour)].icon,
                      {
                        className: cn(
                          "h-4 w-4",
                          STATUS_CONFIG[getStatus(item.jour)].color,
                        ),
                      },
                    )}
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
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="muted">{item.plateforme}</Badge>
                        <Badge variant="muted">{item.format}</Badge>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPublishContent(`${item.titre}\n\n${item.hook}`);
                          setPublishDialogOpen(true);
                        }}
                        title="Publier via Unipile"
                        className="p-1 rounded hover:bg-bg-tertiary transition-colors text-accent"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pt-4">
        <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
          Nouveau brief
        </Button>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          Régénérer le plan
        </Button>
      </div>

      <UnipilePublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={publishContent}
      />
    </div>
  );
}
