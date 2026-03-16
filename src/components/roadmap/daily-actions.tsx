"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  RefreshCw,
  Loader2,
  ExternalLink,
  Target,
  Zap,
  Star,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
interface DailyAction {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  priority: "high" | "medium" | "low";
  category: string;
  action_url: string;
  completed: boolean;
  xp_reward: number;
}

interface DailyPlan {
  id?: string;
  date: string;
  motivation_message: string;
  focus_theme: string;
  actions: DailyAction[];
  total_xp: number;
}

// ─── Demo data ───────────────────────────────────────────────
const DEMO_PLAN: DailyPlan = {
  date: new Date().toISOString().split("T")[0],
  motivation_message:
    "Tu es à 70% de ton objectif mensuel. 3 actions ciblées aujourd'hui et tu finis la semaine en avance !",
  focus_theme: "Optimisation du funnel",
  actions: [
    {
      id: "1",
      title: "Analyse les bottlenecks du funnel",
      description:
        "Vérifie les taux de conversion à chaque étape et identifie le point de blocage principal.",
      duration_minutes: 15,
      priority: "high",
      category: "Analytics",
      action_url: "/analytics",
      completed: false,
      xp_reward: 25,
    },
    {
      id: "2",
      title: "Génère 2 nouvelles variantes de hook",
      description:
        "Base-toi sur le hook gagnant de la semaine et crée 2 angles différents.",
      duration_minutes: 10,
      priority: "high",
      category: "Créatives",
      action_url: "/ads",
      completed: false,
      xp_reward: 20,
    },
    {
      id: "3",
      title: "Publie un contenu Know",
      description:
        "Partage un insight éducatif sur ton expertise. Format recommandé : Reel 30s.",
      duration_minutes: 20,
      priority: "medium",
      category: "Contenu",
      action_url: "/content",
      completed: false,
      xp_reward: 15,
    },
    {
      id: "4",
      title: "Réponds aux DMs en attente",
      description:
        "Tu as 3 conversations en cours. Qualifie et propose un appel si pertinent.",
      duration_minutes: 10,
      priority: "medium",
      category: "Prospection",
      action_url: "/sales",
      completed: false,
      xp_reward: 10,
    },
    {
      id: "5",
      title: "Revois tes métriques de la veille",
      description:
        "CPL, ROAS, taux de closing — 5 min pour savoir où tu en es.",
      duration_minutes: 5,
      priority: "low",
      category: "Analytics",
      action_url: "/analytics",
      completed: false,
      xp_reward: 10,
    },
  ],
  total_xp: 80,
};

// ─── Main Component ──────────────────────────────────────────
export function DailyActions({ className }: { className?: string }) {
  const { user } = useUser();
  const supabase = createClient();
  const [plan, setPlan] = useState<DailyPlan>(DEMO_PLAN);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("daily_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (data) {
        setPlan({
          id: data.id as string,
          date: data.date as string,
          motivation_message: (data.motivation_message as string) || "",
          focus_theme: (data.focus_theme as string) || "",
          actions: (data.actions as DailyAction[]) || [],
          total_xp: (data.total_xp as number) || 0,
        });
        setIsDemo(false);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGenerate = useCallback(async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/generate-daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });

      if (!res.ok) throw new Error("Erreur génération");

      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        setIsDemo(false);
        toast.success("Plan du jour généré !");
      }
    } catch {
      toast.error("Erreur lors de la génération du plan");
    } finally {
      setGenerating(false);
    }
  }, [user, today]);

  const handleToggleAction = useCallback(
    async (actionId: string) => {
      if (!user) return;

      const updatedActions = plan.actions.map((a) =>
        a.id === actionId ? { ...a, completed: !a.completed } : a,
      );
      const updatedPlan = { ...plan, actions: updatedActions };
      setPlan(updatedPlan);

      // Persist if not demo
      if (!isDemo && plan.id) {
        await supabase
          .from("daily_plans")
          .update({ actions: updatedActions })
          .eq("id", plan.id);
      }

      const action = updatedActions.find((a) => a.id === actionId);
      if (action?.completed) {
        toast.success(`+${action.xp_reward} XP — ${action.title}`);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [user, plan, isDemo],
  );

  const handleSyncCalendar = useCallback(async () => {
    if (!user) return;
    setSyncing(true);

    try {
      const res = await fetch(
        "/api/integrations/google-calendar/sync-daily-plan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: today,
            actions: plan.actions.filter((a) => !a.completed),
          }),
        },
      );

      if (res.ok) {
        toast.success("Plan synchronisé avec Google Agenda !");
      } else {
        toast.error("Connecte d'abord ton Google Agenda dans les paramètres");
      }
    } catch {
      toast.error("Erreur de synchronisation");
    } finally {
      setSyncing(false);
    }
  }, [user, today, plan.actions]);

  const completedCount = plan.actions.filter((a) => a.completed).length;
  const totalCount = plan.actions.length;
  const earnedXp = plan.actions
    .filter((a) => a.completed)
    .reduce((s, a) => s + a.xp_reward, 0);
  const totalMinutes = plan.actions
    .filter((a) => !a.completed)
    .reduce((s, a) => s + a.duration_minutes, 0);

  const priorityColors = {
    high: "text-red-400",
    medium: "text-warning",
    low: "text-text-muted",
  };

  const priorityIcons = {
    high: Zap,
    medium: Target,
    low: Star,
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-accent" />
            Actions du jour
            {!loading && (
              <Badge variant="default" className="ml-2">
                {completedCount}/{totalCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSyncCalendar}
              disabled={syncing}
              title="Synchroniser avec Google Agenda"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Générer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Motivation */}
            {plan.motivation_message && (
              <div className="p-3 rounded-xl bg-accent/8 border border-accent/15">
                <p className="text-sm text-accent">{plan.motivation_message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {totalMinutes} min restantes
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {earnedXp}/{plan.total_xp} XP
                  </span>
                  {plan.focus_theme && (
                    <Badge variant="muted" className="text-[10px]">
                      {plan.focus_theme}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {isDemo && (
              <Badge variant="yellow" className="mb-2">
                Données de démonstration
              </Badge>
            )}

            {/* Progress bar */}
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent/70 to-accent rounded-full transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Actions list */}
            <div className="space-y-2">
              {plan.actions.map((action) => {
                const PriorityIcon = priorityIcons[action.priority];
                return (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer",
                      action.completed
                        ? "bg-accent/5 border border-accent/15 opacity-70"
                        : "bg-bg-tertiary/50 border border-border-default hover:border-accent/30",
                    )}
                    onClick={() => handleToggleAction(action.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {action.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      ) : (
                        <Circle className="h-5 w-5 text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            action.completed
                              ? "line-through text-text-muted"
                              : "text-text-primary",
                          )}
                        >
                          {action.title}
                        </span>
                        <PriorityIcon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            priorityColors[action.priority],
                          )}
                        />
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {action.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {action.duration_minutes} min
                        </span>
                        <Badge variant="muted" className="text-[10px]">
                          {action.category}
                        </Badge>
                        <span className="text-[10px] text-accent">
                          +{action.xp_reward} XP
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = action.action_url;
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Completion message */}
            {completedCount === totalCount && totalCount > 0 && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-center">
                <span className="text-lg">🎯</span>
                <p className="text-sm font-semibold text-accent mt-1">
                  Journée complète ! +{plan.total_xp} XP gagnés
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Continue demain pour maintenir ta série.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
