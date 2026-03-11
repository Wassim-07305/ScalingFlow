"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────

interface CampaignHealth {
  status: "healthy" | "warning" | "critical" | "scaling";
  roas7d: number;
  ctr7d: number;
  cpa7d: number;
  spend7d: number;
  conversions7d: number;
  trend: "up" | "down" | "stable";
}

interface AutoAction {
  id: string;
  type: "pause" | "scale" | "refresh" | "test";
  title: string;
  description: string;
  severity: "info" | "warning" | "danger" | "success";
  impact: string;
}

// ─── Component ──────────────────────────────────────────────

export function AdsAutomation() {
  const { user } = useUser();
  const [health, setHealth] = useState<CampaignHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchHealth = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: metrics } = await supabase
        .from("ad_daily_metrics")
        .select("spend, roas, ctr, cpa, conversions")
        .eq("user_id", user.id)
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (!metrics || metrics.length === 0) {
        setHealth(null);
        setLoading(false);
        return;
      }

      const totalSpend = metrics.reduce((s, m) => s + (m.spend || 0), 0);
      const avgRoas = metrics.reduce((s, m) => s + (m.roas || 0), 0) / metrics.length;
      const avgCtr = metrics.reduce((s, m) => s + (m.ctr || 0), 0) / metrics.length;
      const avgCpa = metrics.filter((m) => m.cpa > 0).reduce((s, m) => s + (m.cpa || 0), 0) / (metrics.filter((m) => m.cpa > 0).length || 1);
      const totalConversions = metrics.reduce((s, m) => s + (m.conversions || 0), 0);

      // Determine trend (compare first half vs second half)
      const mid = Math.floor(metrics.length / 2);
      const firstHalf = metrics.slice(mid);
      const secondHalf = metrics.slice(0, mid);
      const firstRoas = firstHalf.reduce((s, m) => s + (m.roas || 0), 0) / (firstHalf.length || 1);
      const secondRoas = secondHalf.reduce((s, m) => s + (m.roas || 0), 0) / (secondHalf.length || 1);
      const trend = secondRoas > firstRoas * 1.1 ? "up" : secondRoas < firstRoas * 0.9 ? "down" : "stable";

      // Determine status
      let status: CampaignHealth["status"] = "healthy";
      if (avgRoas < 1) status = "critical";
      else if (avgRoas < 1.5) status = "warning";
      else if (avgRoas > 3 && trend === "up") status = "scaling";

      setHealth({
        status,
        roas7d: avgRoas,
        ctr7d: avgCtr,
        cpa7d: avgCpa,
        spend7d: totalSpend,
        conversions7d: totalConversions,
        trend,
      });
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  // ─── Automated Actions ──────────────────────────────────────

  const actions = useMemo<AutoAction[]>(() => {
    if (!health) return [];
    const list: AutoAction[] = [];

    // #69 Monitoring continu
    if (health.status === "critical") {
      list.push({
        id: "pause_bleeding",
        type: "pause",
        title: "Mettre en pause les campagnes deficitaires",
        description: `ROAS de ${health.roas7d.toFixed(2)}x — tu perds de l'argent. Pause les campagnes et revois tes creatives.`,
        severity: "danger",
        impact: `Economie estimee : ${(health.spend7d * 0.3).toFixed(0)}EUR/semaine`,
      });
    }

    if (health.status === "warning") {
      list.push({
        id: "optimize_creatives",
        type: "refresh",
        title: "Rafraichir les creatives",
        description: `ROAS de ${health.roas7d.toFixed(2)}x — en dessous du seuil optimal. Teste de nouveaux hooks et angles.`,
        severity: "warning",
        impact: "Potentiel : +30-50% de CTR avec de nouveaux angles",
      });
    }

    // #70 Decisions automatiques
    if (health.cpa7d > 50 && health.conversions7d > 0) {
      list.push({
        id: "reduce_cpa",
        type: "test",
        title: "CPA trop eleve — optimise le ciblage",
        description: `CPA moyen de ${health.cpa7d.toFixed(0)}EUR. Reduis les audiences larges et teste des lookalikes plus precises.`,
        severity: "warning",
        impact: "Objectif : CPA < 30EUR",
      });
    }

    if (health.ctr7d < 1) {
      list.push({
        id: "improve_ctr",
        type: "refresh",
        title: "CTR faible — hooks peu performants",
        description: `CTR de ${health.ctr7d.toFixed(2)}% (objectif > 1.5%). Tes hooks n'accrochent pas. Genere de nouvelles variations.`,
        severity: "warning",
        impact: "Objectif : CTR > 1.5%",
      });
    }

    // #71 Cycle creatif auto
    if (health.trend === "down" && health.status !== "critical") {
      list.push({
        id: "creative_fatigue",
        type: "refresh",
        title: "Fatigue creative detectee",
        description: "Les performances baissent — signe de fatigue creative. Lance un nouveau batch de creatives avec des angles differents.",
        severity: "warning",
        impact: "Rotation recommandee toutes les 2-3 semaines",
      });
    }

    // #72 Scaling progressif
    if (health.status === "scaling") {
      list.push({
        id: "scale_budget",
        type: "scale",
        title: "Pret a scaler — augmente le budget",
        description: `ROAS de ${health.roas7d.toFixed(2)}x en hausse. Augmente le budget de 20-30% par palier.`,
        severity: "success",
        impact: `Budget suggere : +${(health.spend7d * 0.2 / 7).toFixed(0)}EUR/jour`,
      });
    }

    if (health.status === "healthy" && health.roas7d > 2) {
      list.push({
        id: "duplicate_winners",
        type: "scale",
        title: "Duplique tes meilleures campagnes",
        description: "Tes campagnes sont rentables. Duplique les gagnantes avec de nouvelles audiences.",
        severity: "success",
        impact: "Potentiel de scaling : x2 sans degrader le ROAS",
      });
    }

    if (list.length === 0) {
      list.push({
        id: "all_good",
        type: "test",
        title: "Tout est stable",
        description: "Tes campagnes tournent correctement. Continue a monitorer et teste de nouvelles variations regulierement.",
        severity: "info",
        impact: "Recommandation : tester 2-3 nouvelles creatives par semaine",
      });
    }

    return list;
  }, [health]);

  // ─── AI Recommendations ─────────────────────────────────────

  const getAIRecommendations = async () => {
    if (!health) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "ads",
          messages: [
            {
              role: "user",
              content: `Analyse ces metriques publicitaires des 7 derniers jours et donne-moi 3 actions concretes a faire aujourd'hui :
- ROAS : ${health.roas7d.toFixed(2)}x
- CTR : ${health.ctr7d.toFixed(2)}%
- CPA : ${health.cpa7d.toFixed(0)}EUR
- Depense totale : ${health.spend7d.toFixed(0)}EUR
- Conversions : ${health.conversions7d}
- Tendance : ${health.trend === "up" ? "hausse" : health.trend === "down" ? "baisse" : "stable"}

Reponds en francais, format bullet points, concis et actionnable.`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiRecommendations(data.content || data.message);
      } else {
        toast.error("Erreur lors de l'analyse IA");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!health) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary text-sm">
          Aucune donnee publicitaire disponible. Synchronise tes campagnes Meta Ads pour activer le monitoring automatique.
        </p>
      </div>
    );
  }

  const statusConfig = {
    healthy: { label: "Sain", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle },
    warning: { label: "Attention", color: "text-yellow-400", bg: "bg-yellow-500/10", icon: AlertTriangle },
    critical: { label: "Critique", color: "text-red-400", bg: "bg-red-500/10", icon: XCircle },
    scaling: { label: "En croissance", color: "text-purple-400", bg: "bg-purple-500/10", icon: ArrowUpRight },
  };

  const cfg = statusConfig[health.status];

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Monitoring Campagnes
            </div>
            <Button variant="ghost" size="sm" onClick={fetchHealth}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg", cfg.bg)}>
              <cfg.icon className={cn("h-5 w-5", cfg.color)} />
            </div>
            <div>
              <p className={cn("text-sm font-semibold", cfg.color)}>{cfg.label}</p>
              <p className="text-xs text-text-muted">Derniers 7 jours</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {health.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : health.trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-red-400" />
              ) : (
                <Activity className="h-4 w-4 text-text-muted" />
              )}
              <span className="text-xs text-text-muted capitalize">{health.trend === "up" ? "Hausse" : health.trend === "down" ? "Baisse" : "Stable"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "ROAS", value: `${health.roas7d.toFixed(2)}x`, good: health.roas7d >= 2 },
              { label: "CTR", value: `${health.ctr7d.toFixed(2)}%`, good: health.ctr7d >= 1.5 },
              { label: "CPA", value: `${health.cpa7d.toFixed(0)}EUR`, good: health.cpa7d <= 30 },
              { label: "Depense", value: `${health.spend7d.toFixed(0)}EUR`, good: true },
              { label: "Conversions", value: `${health.conversions7d}`, good: health.conversions7d > 0 },
            ].map((kpi) => (
              <div key={kpi.label} className="p-3 rounded-xl bg-bg-tertiary border border-border-default">
                <p className="text-[10px] text-text-muted uppercase">{kpi.label}</p>
                <p className={cn("text-lg font-bold", kpi.good ? "text-text-primary" : "text-yellow-400")}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automated Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Actions recommandees ({actions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action) => {
            const severityStyles = {
              danger: "border-red-500/30 bg-red-500/5",
              warning: "border-yellow-500/30 bg-yellow-500/5",
              success: "border-emerald-500/30 bg-emerald-500/5",
              info: "border-blue-500/30 bg-blue-500/5",
            };
            const badgeVariant = {
              danger: "red" as const,
              warning: "yellow" as const,
              success: "default" as const,
              info: "blue" as const,
            };

            return (
              <div
                key={action.id}
                className={cn("rounded-xl border p-4", severityStyles[action.severity])}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={badgeVariant[action.severity]}>
                        {action.type === "pause" ? "Pause" : action.type === "scale" ? "Scale" : action.type === "refresh" ? "Refresh" : "Test"}
                      </Badge>
                      <p className="text-sm font-semibold text-text-primary">{action.title}</p>
                    </div>
                    <p className="text-xs text-text-secondary">{action.description}</p>
                    <p className="text-[10px] text-text-muted mt-1">{action.impact}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* AI Deep Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Analyse IA approfondie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiRecommendations ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="text-sm text-text-secondary whitespace-pre-wrap">{aiRecommendations}</div>
              <Button variant="ghost" size="sm" className="mt-3" onClick={getAIRecommendations} disabled={aiLoading}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Reanalyser
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Button onClick={getAIRecommendations} disabled={aiLoading}>
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Obtenir des recommandations IA
              </Button>
              <p className="text-xs text-text-muted mt-2">
                L&apos;agent IA Ads analysera tes metriques et donnera des actions concretes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
