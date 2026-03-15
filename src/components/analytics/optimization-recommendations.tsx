"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Palette,
  Users,
  DollarSign,
  Filter,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import type { DailyMetric } from "./performance-dashboard";

// ─── Types ───────────────────────────────────────────────────
interface Recommendation {
  title: string;
  description: string;
  category: string;
  priority: string;
  expected_impact: string;
  action_steps: string[];
  metric_to_watch: string;
}

interface OptimizationResult {
  overall_health: string;
  health_score: number;
  summary: string;
  recommendations: Recommendation[];
  quick_wins: string[];
  warnings: string[];
}

// ─── Helpers ─────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/client";

async function loadMetricsFromSupabase(userId: string): Promise<DailyMetric[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_performance_metrics")
    .select("date, spend, impressions, clicks, leads, calls, clients, revenue")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (!data || data.length === 0) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row: any) => ({
    date: typeof row.date === "string" ? row.date : new Date(row.date).toISOString().split("T")[0],
    spend: Number(row.spend),
    impressions: row.impressions,
    clicks: row.clicks,
    leads: row.leads,
    calls: row.calls,
    clients: row.clients,
    revenue: Number(row.revenue),
  }));
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Creatives": Palette,
  "Audiences": Users,
  "Budget": DollarSign,
  "Funnel": Filter,
  "Pricing": Tag,
};

const PRIORITY_VARIANTS: Record<string, "red" | "yellow" | "default"> = {
  "Haute": "red",
  "Moyenne": "yellow",
  "Basse": "default",
};

const HEALTH_CONFIG: Record<string, { color: string; bgColor: string }> = {
  "Bon": { color: "text-accent", bgColor: "bg-accent/12" },
  "Moyen": { color: "text-warning", bgColor: "bg-warning/12" },
  "Critique": { color: "text-danger", bgColor: "bg-danger/12" },
};

// ─── Main component ──────────────────────────────────────────
export function OptimizationRecommendations() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [expandedReco, setExpandedReco] = useState<number | null>(null);
  const [hasMetrics, setHasMetrics] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadMetricsFromSupabase(user.id).then((m) => setHasMetrics(m.length > 0));
  }, [user]);

  const handleGenerate = useCallback(async () => {
    if (!user) return;

    const metrics = await loadMetricsFromSupabase(user.id);

    // Build summary from metrics (or demo data)
    let metricsData = metrics;
    if (metricsData.length === 0) {
      // Use totals from demo for a summary
      metricsData = [];
    }

    // Compute aggregated summary
    const totals = metricsData.length > 0
      ? metricsData.reduce(
          (acc, m) => ({
            spend: acc.spend + m.spend,
            impressions: acc.impressions + m.impressions,
            clicks: acc.clicks + m.clicks,
            leads: acc.leads + m.leads,
            calls: acc.calls + m.calls,
            clients: acc.clients + m.clients,
            revenue: acc.revenue + m.revenue,
            days: acc.days + 1,
          }),
          { spend: 0, impressions: 0, clicks: 0, leads: 0, calls: 0, clients: 0, revenue: 0, days: 0 }
        )
      : {
          spend: 2710,
          impressions: 271200,
          clicks: 4615,
          leads: 245,
          calls: 85,
          clients: 29,
          revenue: 32813,
          days: 14,
        };

    const summary = {
      periode_jours: totals.days,
      depense_totale: totals.spend,
      impressions: totals.impressions,
      clics: totals.clicks,
      leads: totals.leads,
      appels: totals.calls,
      clients: totals.clients,
      revenu: totals.revenue,
      cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      cpl: totals.leads > 0 ? totals.spend / totals.leads : 0,
      cpa: totals.clients > 0 ? totals.spend / totals.clients : 0,
      roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
      taux_lead_to_call: totals.leads > 0 ? (totals.calls / totals.leads) * 100 : 0,
      taux_call_to_client: totals.calls > 0 ? (totals.clients / totals.calls) * 100 : 0,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/ai/optimize-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: summary }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la génération");
      }

      const data = (await res.json()) as OptimizationResult;
      setResult(data);
      toast.success("Recommandations générées !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération des recommandations");
    } finally {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Generate button */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Optimisation IA de tes campagnes
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {hasMetrics
                ? "L'IA va analyser tes métriques réelles et générer des recommandations personnalisées."
                : "Ajoute tes données dans l'onglet Dashboard d'abord, ou génère sur les données de démo."}
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="shrink-0">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {loading ? "Analyse en cours..." : "Générer les recommandations"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Health Score */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={result.health_score >= 70 ? "#34D399" : result.health_score >= 40 ? "#F59E0B" : "#EF4444"}
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${(result.health_score / 100) * 213.6} 213.6`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={cn(
                        "text-2xl font-bold",
                        HEALTH_CONFIG[result.overall_health]?.color || "text-text-primary"
                      )}
                    >
                      {result.health_score}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-text-primary">
                      Santé globale
                    </h3>
                    <Badge
                      variant={
                        result.overall_health === "Bon"
                          ? "default"
                          : result.overall_health === "Moyen"
                          ? "yellow"
                          : "red"
                      }
                    >
                      {result.overall_health}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">{result.summary}</p>
                </div>
              </div>

              {/* Health bar */}
              <div className="mt-4 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    result.health_score >= 70
                      ? "bg-accent"
                      : result.health_score >= 40
                      ? "bg-warning"
                      : "bg-danger"
                  )}
                  style={{ width: `${result.health_score}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Card className="border-danger/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Quick Wins */}
          {result.quick_wins && result.quick_wins.length > 0 && (
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                  <Zap className="h-5 w-5" />
                  Victoires rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.quick_wins.map((qw, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      {qw}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary">
              Recommandations détaillées ({result.recommendations.length})
            </h3>
            {result.recommendations.map((reco, idx) => {
              const isExpanded = expandedReco === idx;
              const IconComp = CATEGORY_ICONS[reco.category] || Target;

              return (
                <Card key={idx} className="overflow-hidden">
                  <button
                    className="w-full text-left p-5 flex items-start gap-4"
                    onClick={() => setExpandedReco(isExpanded ? null : idx)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center shrink-0">
                      <IconComp className="h-5 w-5 text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-text-primary text-sm">
                          {reco.title}
                        </span>
                        <Badge variant={PRIORITY_VARIANTS[reco.priority] || "muted"}>
                          {reco.priority}
                        </Badge>
                        <Badge variant="muted">{reco.category}</Badge>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {reco.description}
                      </p>
                      {reco.expected_impact && (
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className="h-3 w-3 text-accent" />
                          <span className="text-xs text-accent font-medium">
                            {reco.expected_impact}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-text-muted" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-border-default">
                      <div className="pt-4 space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Étapes d&apos;action
                          </h4>
                          <ol className="space-y-2">
                            {reco.action_steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                <span className="w-5 h-5 rounded-full bg-accent/12 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                        {reco.metric_to_watch && (
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-text-muted" />
                            <span className="text-xs text-text-muted">
                              Métrique à surveiller :
                            </span>
                            <Badge variant="muted">{reco.metric_to_watch}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/12 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Optimise tes campagnes avec l&apos;IA
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              Clique sur &quot;Générer les recommandations&quot; pour obtenir une analyse complète
              de tes métriques publicitaires et des recommandations actionnables.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
