"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle,
  Clock,
  Shield,
  TrendingDown,
  Eye,
  MousePointer,
  DollarSign,
  BarChart3,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

// ─── Types ──────────────────────────────────────────────────

interface Alert {
  id: string;
  creative_name: string;
  campaign_name: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  message: string;
  kpi_snapshot: Record<string, number> | null;
  resolved: boolean;
  created_at: string;
}

interface MonitorCheck {
  alertsCount: number;
  campaignsChecked: number;
  timestamp: string;
}

// ─── Helpers ────────────────────────────────────────────────

function getSeverityConfig(severity: Alert["severity"]) {
  switch (severity) {
    case "critical":
      return {
        label: "Critique",
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        dot: "bg-red-400",
      };
    case "warning":
      return {
        label: "Attention",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        dot: "bg-yellow-400",
      };
    case "info":
      return {
        label: "Info",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        dot: "bg-blue-400",
      };
  }
}

function getAlertIcon(type: string) {
  switch (type) {
    case "low_ctr":
      return MousePointer;
    case "high_cpc":
      return DollarSign;
    case "high_cpm":
      return BarChart3;
    case "high_frequency":
      return RefreshCw;
    case "low_roas":
      return TrendingDown;
    default:
      return AlertTriangle;
  }
}

function getAlertTypeLabel(type: string) {
  switch (type) {
    case "low_ctr":
      return "CTR bas";
    case "high_cpc":
      return "CPC élevé";
    case "high_cpm":
      return "CPM élevé";
    case "high_frequency":
      return "Fréquence élevée";
    case "low_roas":
      return "ROAS bas";
    default:
      return "Anomalie";
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

function MonitorSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-bg-tertiary" />
        ))}
      </div>
      <div className="h-12 rounded-xl bg-bg-tertiary" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-bg-tertiary" />
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export function AdsMonitor() {
  const { user, loading: userLoading } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [history, setHistory] = useState<MonitorCheck[]>([]);
  const supabase = createClient();

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("ad_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Impossible de charger les alertes");
    } else {
      setAlerts(data ?? []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchAlerts();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading, fetchAlerts]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/ads/monitor", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        toast.success(
          data.alertsCount > 0
            ? `${data.alertsCount} alerte${data.alertsCount > 1 ? "s" : ""} détectée${data.alertsCount > 1 ? "s" : ""}`
            : "Aucune anomalie détectée",
        );
        setHistory((prev) => [
          {
            alertsCount: data.alertsCount,
            campaignsChecked: data.campaignsChecked,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
        await fetchAlerts();
      } else {
        toast.error(data.error || "Erreur lors du check");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setChecking(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    const { error } = await supabase
      .from("ad_alerts")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", alertId)
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Impossible de résoudre l'alerte");
    } else {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)),
      );
      toast.success("Alerte résolue");
    }
  };

  if (loading || userLoading) {
    return <MonitorSkeleton />;
  }

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);
  const criticalCount = unresolvedAlerts.filter(
    (a) => a.severity === "critical",
  ).length;
  const warningCount = unresolvedAlerts.filter(
    (a) => a.severity === "warning",
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Alertes actives",
            value: unresolvedAlerts.length,
            color:
              unresolvedAlerts.length > 0 ? "text-red-400" : "text-emerald-400",
            bg:
              unresolvedAlerts.length > 0
                ? "bg-red-500/10"
                : "bg-emerald-500/10",
            icon: AlertTriangle,
          },
          {
            label: "Critiques",
            value: criticalCount,
            color: criticalCount > 0 ? "text-red-400" : "text-text-muted",
            bg: criticalCount > 0 ? "bg-red-500/10" : "bg-bg-tertiary",
            icon: Shield,
          },
          {
            label: "Avertissements",
            value: warningCount,
            color: warningCount > 0 ? "text-yellow-400" : "text-text-muted",
            bg: warningCount > 0 ? "bg-yellow-500/10" : "bg-bg-tertiary",
            icon: Eye,
          },
          {
            label: "Résolues",
            value: resolvedAlerts.length,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            icon: CheckCircle,
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              "p-4 rounded-xl border border-border-default",
              item.bg,
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">
                {item.label}
              </p>
              <item.icon className={cn("h-4 w-4", item.color)} />
            </div>
            <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          Check automatique toutes les 6h
          {history.length > 0 && (
            <>
              <span className="text-text-muted/50">·</span>
              Dernier : {formatTimestamp(history[0].timestamp)}
            </>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleManualCheck}
          disabled={checking}
          className="bg-accent hover:bg-accent/90"
        >
          {checking ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5 mr-1.5" />
          )}
          Vérifier maintenant
        </Button>
      </div>

      {/* Active alerts */}
      {unresolvedAlerts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Alertes actives ({unresolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unresolvedAlerts.map((alert) => {
                const cfg = getSeverityConfig(alert.severity);
                const AlertIcon = getAlertIcon(alert.alert_type);

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      cfg.border,
                      cfg.bg,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("p-2 rounded-lg mt-0.5", cfg.bg)}>
                          <AlertIcon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge
                              variant={
                                alert.severity === "critical"
                                  ? "red"
                                  : alert.severity === "warning"
                                    ? "yellow"
                                    : "blue"
                              }
                            >
                              {cfg.label}
                            </Badge>
                            <Badge variant="muted">
                              {getAlertTypeLabel(alert.alert_type)}
                            </Badge>
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {alert.creative_name}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted">
                            <span>{alert.campaign_name}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTimestamp(alert.created_at)}
                            </span>
                          </div>

                          {/* KPI Snapshot */}
                          {alert.kpi_snapshot && (
                            <div className="flex flex-wrap gap-3 mt-2">
                              {[
                                {
                                  label: "CTR",
                                  value: `${(alert.kpi_snapshot.ctr ?? 0).toFixed(2)}%`,
                                  warn: alert.alert_type === "low_ctr",
                                },
                                {
                                  label: "CPC",
                                  value: `${(alert.kpi_snapshot.cpc ?? 0).toFixed(2)}€`,
                                  warn: alert.alert_type === "high_cpc",
                                },
                                {
                                  label: "CPM",
                                  value: `${(alert.kpi_snapshot.cpm ?? 0).toFixed(2)}€`,
                                  warn: alert.alert_type === "high_cpm",
                                },
                                {
                                  label: "ROAS",
                                  value: `${(alert.kpi_snapshot.roas ?? 0).toFixed(2)}x`,
                                  warn: alert.alert_type === "low_roas",
                                },
                                {
                                  label: "Fréq.",
                                  value: `${(alert.kpi_snapshot.frequency ?? 0).toFixed(1)}`,
                                  warn: alert.alert_type === "high_frequency",
                                },
                              ].map((kpi) => (
                                <div key={kpi.label} className="text-center">
                                  <p className="text-[9px] text-text-muted uppercase">
                                    {kpi.label}
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs font-semibold",
                                      kpi.warn
                                        ? "text-red-400"
                                        : "text-text-primary",
                                    )}
                                  >
                                    {kpi.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolve(alert.id)}
                        className="h-7 px-2 text-emerald-400 hover:text-emerald-300 shrink-0"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
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
              <div className="p-3 rounded-full bg-emerald-500/10 mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Aucune anomalie détectée
              </p>
              <p className="text-xs text-text-muted">
                Toutes tes créatives fonctionnent dans les seuils normaux.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check history */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Historique des vérifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((check, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        check.alertsCount > 0
                          ? "bg-yellow-400"
                          : "bg-emerald-400",
                      )}
                    />
                    <div>
                      <p className="text-xs text-text-primary">
                        {check.campaignsChecked} campagne
                        {check.campaignsChecked !== 1 ? "s" : ""} vérifiée
                        {check.campaignsChecked !== 1 ? "s" : ""}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {formatTimestamp(check.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={check.alertsCount > 0 ? "yellow" : "default"}>
                    {check.alertsCount} alerte
                    {check.alertsCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved alerts (collapsed) */}
      {resolvedAlerts.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-2 mb-3">
            <CheckCircle className="h-3.5 w-3.5" />
            {resolvedAlerts.length} alerte
            {resolvedAlerts.length !== 1 ? "s" : ""} résolue
            {resolvedAlerts.length !== 1 ? "s" : ""}
          </summary>
          <div className="space-y-2">
            {resolvedAlerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default opacity-60"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-text-primary">{alert.message}</p>
                    <p className="text-[10px] text-text-muted">
                      {formatTimestamp(alert.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant="muted">Résolu</Badge>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
