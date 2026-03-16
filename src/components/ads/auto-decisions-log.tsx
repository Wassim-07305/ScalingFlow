"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Scissors,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  RotateCcw,
  Settings2,
  Power,
  PowerOff,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

// ─── Types ──────────────────────────────────────────────────

interface Decision {
  id: string;
  creative_name: string;
  campaign_name: string;
  decision_type:
    | "pause"
    | "scale"
    | "maintain"
    | "creative_fatigue"
    | "reallocate"
    | "rollback";
  reason: string;
  details: string | null;
  metrics_snapshot: Record<string, number> | null;
  status: "pending" | "applied" | "cancelled" | "failed";
  applied_at: string | null;
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────

function getActionIcon(type: Decision["decision_type"]) {
  switch (type) {
    case "pause":
      return Scissors;
    case "scale":
      return TrendingUp;
    case "reallocate":
      return ArrowUpRight;
    case "creative_fatigue":
      return RefreshCw;
    case "rollback":
      return RotateCcw;
    case "maintain":
      return Settings2;
  }
}

function getActionLabel(type: Decision["decision_type"]) {
  switch (type) {
    case "pause":
      return "Couper";
    case "scale":
      return "Scaler";
    case "reallocate":
      return "Réalloquer";
    case "creative_fatigue":
      return "Fatigue";
    case "rollback":
      return "Rollback";
    case "maintain":
      return "Maintenir";
  }
}

function getActionBadgeVariant(
  type: Decision["decision_type"],
): "red" | "default" | "blue" | "yellow" | "purple" | "muted" {
  switch (type) {
    case "pause":
      return "red";
    case "scale":
      return "default";
    case "reallocate":
      return "blue";
    case "creative_fatigue":
      return "yellow";
    case "rollback":
      return "purple";
    case "maintain":
      return "muted";
  }
}

function getActionColor(type: Decision["decision_type"]) {
  switch (type) {
    case "pause":
      return { icon: "text-red-400", bg: "bg-red-500/10" };
    case "scale":
      return { icon: "text-emerald-400", bg: "bg-emerald-500/10" };
    case "reallocate":
      return { icon: "text-blue-400", bg: "bg-blue-500/10" };
    case "creative_fatigue":
      return { icon: "text-yellow-400", bg: "bg-yellow-500/10" };
    case "rollback":
      return { icon: "text-purple-400", bg: "bg-purple-500/10" };
    case "maintain":
      return { icon: "text-text-muted", bg: "bg-bg-tertiary" };
  }
}

function getStatusLabel(status: Decision["status"]) {
  switch (status) {
    case "pending":
      return "En attente";
    case "applied":
      return "Appliqué";
    case "cancelled":
      return "Annulé";
    case "failed":
      return "Échoué";
  }
}

function getStatusBadge(
  status: Decision["status"],
): "yellow" | "default" | "muted" | "red" {
  switch (status) {
    case "pending":
      return "yellow";
    case "applied":
      return "default";
    case "cancelled":
      return "muted";
    case "failed":
      return "red";
  }
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Skeleton Loader ────────────────────────────────────────

function DecisionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 rounded-xl bg-bg-tertiary" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-bg-tertiary" />
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export function AutoDecisionsLog() {
  const { user, loading: userLoading } = useUser();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [togglingAutomation, setTogglingAutomation] = useState(false);
  const supabase = createClient();

  const fetchDecisions = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("ad_decisions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Impossible de charger les décisions");
    } else {
      setDecisions(data ?? []);
    }

    // Charger la config
    const { data: config } = await supabase
      .from("ad_automation_config")
      .select("enabled")
      .eq("user_id", user.id)
      .single();

    setAutomationEnabled(config?.enabled ?? false);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchDecisions();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading, fetchDecisions]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ads/auto-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(
          data.decisionsCount > 0
            ? `${data.decisionsCount} décision${data.decisionsCount > 1 ? "s" : ""} générée${data.decisionsCount > 1 ? "s" : ""}`
            : "Aucune décision nécessaire",
        );
        await fetchDecisions();
      } else {
        toast.error(data.error || "Erreur lors de l'analyse");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyDecision = async (decisionId: string) => {
    try {
      const res = await fetch("/api/ads/auto-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", decision_id: decisionId }),
      });
      const data = await res.json();

      if (data.success) {
        setDecisions((prev) =>
          prev.map((d) =>
            d.id === decisionId
              ? {
                  ...d,
                  status: "applied" as const,
                  applied_at: new Date().toISOString(),
                }
              : d,
          ),
        );
        toast.success("Décision appliquée");
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleCancelDecision = async (decisionId: string) => {
    try {
      const res = await fetch("/api/ads/auto-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", decision_id: decisionId }),
      });
      const data = await res.json();

      if (data.success) {
        setDecisions((prev) =>
          prev.map((d) =>
            d.id === decisionId ? { ...d, status: "cancelled" as const } : d,
          ),
        );
        toast.success("Décision annulée");
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleApplyAll = async () => {
    const pendingIds = decisions
      .filter((d) => d.status === "pending")
      .map((d) => d.id);
    for (const id of pendingIds) {
      await handleApplyDecision(id);
    }
  };

  const handleToggleAutomation = async () => {
    setTogglingAutomation(true);
    try {
      const res = await fetch("/api/ads/auto-decisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !automationEnabled }),
      });
      const data = await res.json();

      if (data.success) {
        setAutomationEnabled(data.enabled);
        toast.success(
          data.enabled
            ? "Automatisation activée — les décisions seront appliquées automatiquement"
            : "Automatisation désactivée — mode recommandations uniquement",
        );
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setTogglingAutomation(false);
    }
  };

  if (loading || userLoading) {
    return <DecisionsSkeleton />;
  }

  const pendingDecisions = decisions.filter((d) => d.status === "pending");
  const appliedDecisions = decisions.filter((d) => d.status === "applied");
  const otherDecisions = decisions.filter(
    (d) => d.status === "cancelled" || d.status === "failed",
  );

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                pendingDecisions.length > 0
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-emerald-400",
              )}
            />
            <span className="text-text-secondary">
              {pendingDecisions.length} décision
              {pendingDecisions.length !== 1 ? "s" : ""} en attente
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-text-secondary">
              {appliedDecisions.length} appliquée
              {appliedDecisions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle automation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAutomation}
            disabled={togglingAutomation}
            className={cn(
              automationEnabled
                ? "text-emerald-400 hover:text-emerald-300"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            {togglingAutomation ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : automationEnabled ? (
              <Power className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <PowerOff className="h-3.5 w-3.5 mr-1.5" />
            )}
            {automationEnabled ? "Auto ON" : "Auto OFF"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            Analyser maintenant
          </Button>

          {pendingDecisions.length > 0 && (
            <Button
              size="sm"
              onClick={handleApplyAll}
              className="bg-accent hover:bg-accent/90"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Tout appliquer ({pendingDecisions.length})
            </Button>
          )}
        </div>
      </div>

      {/* Automation status */}
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border transition-all",
          automationEnabled
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border-default bg-bg-tertiary",
        )}
      >
        <div
          className={cn(
            "p-2 rounded-lg",
            automationEnabled ? "bg-emerald-500/10" : "bg-bg-secondary",
          )}
        >
          {automationEnabled ? (
            <Zap className="h-4 w-4 text-emerald-400" />
          ) : (
            <PowerOff className="h-4 w-4 text-text-muted" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {automationEnabled
              ? "Automatisation activée"
              : "Mode recommandations uniquement"}
          </p>
          <p className="text-xs text-text-muted">
            {automationEnabled
              ? "Les décisions sont appliquées automatiquement via l'API Meta. Vous pouvez toujours annuler manuellement."
              : "Les recommandations sont générées mais doivent être approuvées manuellement."}
          </p>
        </div>
      </div>

      {/* Decisions timeline */}
      {decisions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Journal des décisions ({decisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {decisions.map((decision) => {
                const ActionIcon = getActionIcon(decision.decision_type);
                const colors = getActionColor(decision.decision_type);

                return (
                  <div
                    key={decision.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      decision.status === "pending"
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : decision.status === "applied"
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-border-default bg-bg-tertiary opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("p-2 rounded-lg mt-0.5", colors.bg)}>
                          <ActionIcon className={cn("h-4 w-4", colors.icon)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge
                              variant={getActionBadgeVariant(
                                decision.decision_type,
                              )}
                            >
                              {getActionLabel(decision.decision_type)}
                            </Badge>
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {decision.creative_name}
                            </span>
                            <Badge variant={getStatusBadge(decision.status)}>
                              {getStatusLabel(decision.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-secondary">
                            {decision.reason}
                          </p>
                          {decision.details && (
                            <p className="text-[10px] text-text-muted mt-1">
                              {decision.details}
                            </p>
                          )}

                          {/* Metrics snapshot */}
                          {decision.metrics_snapshot &&
                            decision.decision_type !== "maintain" && (
                              <div className="flex flex-wrap gap-3 mt-2">
                                {[
                                  { key: "roas", label: "ROAS", suffix: "x" },
                                  { key: "ctr", label: "CTR", suffix: "%" },
                                  {
                                    key: "spend",
                                    label: "Dépense",
                                    suffix: "€",
                                  },
                                  {
                                    key: "frequency",
                                    label: "Fréq.",
                                    suffix: "",
                                  },
                                ]
                                  .filter(
                                    (m) =>
                                      decision.metrics_snapshot![m.key] !==
                                      undefined,
                                  )
                                  .map((m) => (
                                    <div key={m.key} className="text-center">
                                      <p className="text-[9px] text-text-muted uppercase">
                                        {m.label}
                                      </p>
                                      <p className="text-xs font-semibold text-text-primary">
                                        {typeof decision.metrics_snapshot![
                                          m.key
                                        ] === "number"
                                          ? (
                                              decision.metrics_snapshot![
                                                m.key
                                              ] as number
                                            ).toFixed(
                                              m.key === "spend"
                                                ? 0
                                                : m.key === "frequency"
                                                  ? 1
                                                  : 2,
                                            )
                                          : decision.metrics_snapshot![m.key]}
                                        {m.suffix}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            )}

                          <p className="text-[10px] text-text-muted mt-2 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTimestamp(decision.created_at)}
                            {decision.applied_at && (
                              <>
                                {" "}
                                · Appliqué{" "}
                                {formatTimestamp(decision.applied_at)}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      {decision.status === "pending" && (
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApplyDecision(decision.id)}
                            className="h-7 px-2 text-emerald-400 hover:text-emerald-300"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelDecision(decision.id)}
                            className="h-7 px-2 text-red-400 hover:text-red-300"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-full bg-accent/10 mb-4">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Aucune décision pour le moment
              </p>
              <p className="text-xs text-text-muted mb-4">
                Lance une analyse pour générer des recommandations basées sur
                les performances de tes créatives.
              </p>
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Lancer l'analyse
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled/failed decisions */}
      {otherDecisions.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-2 mb-3">
            <XCircle className="h-3.5 w-3.5" />
            {otherDecisions.length} décision
            {otherDecisions.length !== 1 ? "s" : ""} annulée
            {otherDecisions.length !== 1 ? "s" : ""}
          </summary>
          <div className="space-y-2">
            {otherDecisions.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={getActionBadgeVariant(d.decision_type)}>
                    {getActionLabel(d.decision_type)}
                  </Badge>
                  <span className="text-xs text-text-primary">
                    {d.creative_name}
                  </span>
                </div>
                <Badge variant="muted">{getStatusLabel(d.status)}</Badge>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
