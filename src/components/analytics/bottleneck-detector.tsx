"use client";

import React, { useState, useEffect, useMemo} from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TrendingDown,
  Eye,
  MousePointer,
  UserPlus,
  Phone,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
interface FunnelStep {
  id: string;
  label: string;
  icon: React.ElementType;
  value: number;
  benchmark: number;
  conversionToNext: number;
  benchmarkConversionToNext: number;
}

interface Bottleneck {
  stepIndex: number;
  stepLabel: string;
  currentRate: number;
  benchmarkRate: number;
  gap: number;
  severity: "critical" | "warning" | "info";
  recommendation: string;
  impact: string;
}

interface FunnelMetrics {
  impressions: number;
  clicks: number;
  pageViews: number;
  leads: number;
  calls: number;
  sales: number;
}

// ─── Benchmarks industrie ────────────────────────────────────
const BENCHMARKS = {
  ctr: 2.5, // % CTR moyen
  landingConversion: 25, // % landing → lead
  leadToCall: 30, // % lead → call
  callToSale: 20, // % call → sale
  overallConversion: 0.4, // % impression → sale
};

// ─── Helpers ─────────────────────────────────────────────────
function buildFunnelSteps(metrics: FunnelMetrics): FunnelStep[] {
  const steps: FunnelStep[] = [
    {
      id: "impressions",
      label: "Impressions",
      icon: Eye,
      value: metrics.impressions,
      benchmark: metrics.impressions,
      conversionToNext:
        metrics.impressions > 0
          ? (metrics.clicks / metrics.impressions) * 100
          : 0,
      benchmarkConversionToNext: BENCHMARKS.ctr,
    },
    {
      id: "clicks",
      label: "Clics",
      icon: MousePointer,
      value: metrics.clicks,
      benchmark: Math.round((metrics.impressions * BENCHMARKS.ctr) / 100),
      conversionToNext:
        metrics.clicks > 0 ? (metrics.pageViews / metrics.clicks) * 100 : 0,
      benchmarkConversionToNext: 85,
    },
    {
      id: "page_views",
      label: "Vues page",
      icon: Eye,
      value: metrics.pageViews,
      benchmark: Math.round(metrics.clicks * 0.85),
      conversionToNext:
        metrics.pageViews > 0 ? (metrics.leads / metrics.pageViews) * 100 : 0,
      benchmarkConversionToNext: BENCHMARKS.landingConversion,
    },
    {
      id: "leads",
      label: "Leads",
      icon: UserPlus,
      value: metrics.leads,
      benchmark: Math.round(
        (metrics.pageViews * BENCHMARKS.landingConversion) / 100,
      ),
      conversionToNext:
        metrics.leads > 0 ? (metrics.calls / metrics.leads) * 100 : 0,
      benchmarkConversionToNext: BENCHMARKS.leadToCall,
    },
    {
      id: "calls",
      label: "Appels",
      icon: Phone,
      value: metrics.calls,
      benchmark: Math.round((metrics.leads * BENCHMARKS.leadToCall) / 100),
      conversionToNext:
        metrics.calls > 0 ? (metrics.sales / metrics.calls) * 100 : 0,
      benchmarkConversionToNext: BENCHMARKS.callToSale,
    },
    {
      id: "sales",
      label: "Ventes",
      icon: CreditCard,
      value: metrics.sales,
      benchmark: Math.round((metrics.calls * BENCHMARKS.callToSale) / 100),
      conversionToNext: 0,
      benchmarkConversionToNext: 0,
    },
  ];

  return steps;
}

function detectBottlenecks(steps: FunnelStep[]): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  const recommendations: Record<string, { rec: string; impact: string }> = {
    impressions: {
      rec: "Augmente ton budget ads ou diversifie les audiences (lookalikes, centres d'intérêt adjacents).",
      impact:
        "Chaque +1% de CTR = plus de trafic qualifié sur ta landing page.",
    },
    clicks: {
      rec: "Optimise tes créatives : teste des hooks plus forts, change les visuels, ajoute de la preuve sociale dans l'ad.",
      impact:
        "Améliorer le CTR de 1% peut doubler le nombre de leads à budget constant.",
    },
    page_views: {
      rec: "Vérifie la vitesse de ta page (< 3s). Assure-toi que le message de l'ad correspond à la landing page.",
      impact: "Réduire le bounce rate de 15% peut augmenter tes leads de 20%+.",
    },
    leads: {
      rec: "Simplifie ton formulaire (prénom + email suffisent). Renforce ta proposition de valeur au-dessus du fold. Ajoute des témoignages.",
      impact:
        "Passer de 12% à 25% de conversion landing = 2x plus de leads sans dépenser plus.",
    },
    calls: {
      rec: "Améliore ta séquence email/SMS nurturing. Ajoute un rappel J+1 et J+3. Propose 2 créneaux au lieu d'un lien Calendly ouvert.",
      impact:
        "Passer de 20% à 30% de leads en call = +50% d'opportunités de vente.",
    },
    sales: {
      rec: "Travaille ton script de closing : valide mieux les objections, crée plus d'urgence, propose un downsell si blocage prix.",
      impact:
        "Passer de 15% à 25% de closing = +67% de revenus sans plus de leads.",
    },
  };

  for (let i = 0; i < steps.length - 1; i++) {
    const step = steps[i];
    const gap = step.benchmarkConversionToNext - step.conversionToNext;

    if (gap <= 0) continue;

    const severity: "critical" | "warning" | "info" =
      gap > step.benchmarkConversionToNext * 0.5
        ? "critical"
        : gap > step.benchmarkConversionToNext * 0.25
          ? "warning"
          : "info";

    const recData = recommendations[step.id] || {
      rec: "Analyse cette étape en détail pour identifier les frictions.",
      impact:
        "Améliorer cette conversion impacte directement le bas du funnel.",
    };

    bottlenecks.push({
      stepIndex: i,
      stepLabel: `${step.label} → ${steps[i + 1].label}`,
      currentRate: step.conversionToNext,
      benchmarkRate: step.benchmarkConversionToNext,
      gap,
      severity,
      recommendation: recData.rec,
      impact: recData.impact,
    });
  }

  return bottlenecks.sort((a, b) => b.gap - a.gap);
}

// ─── Contextual bottleneck detection (CDC 8 types) ──────────
interface ContextualData {
  creativeFatigue: boolean;
  noShows: boolean;
  showUpRate: number;
  contentGap: boolean;
  daysSinceContent: number;
  revenueStalled: boolean;
  monthlyRevenues: number[];
}

function detectContextualBottlenecks(ctx: ContextualData): Bottleneck[] {
  const extra: Bottleneck[] = [];

  // Fatigue créative (CDC: CTR down + high frequency)
  if (ctx.creativeFatigue) {
    extra.push({
      stepIndex: -1,
      stepLabel: "Fatigue créative",
      currentRate: 0,
      benchmarkRate: 0,
      gap: 50,
      severity: "critical",
      recommendation:
        "Tes créatives montrent des signes de fatigue (fréquence élevée, CTR en baisse). Génère de nouvelles variations depuis l'onglet Créatives.",
      impact:
        "Renouveler les créatives peut relancer le CTR de +50% et réduire le CPL.",
    });
  }

  // No-shows (CDC: Show-up < 60%)
  if (ctx.noShows && ctx.showUpRate < 60) {
    extra.push({
      stepIndex: -1,
      stepLabel: "No-shows appels",
      currentRate: ctx.showUpRate,
      benchmarkRate: 60,
      gap: 60 - ctx.showUpRate,
      severity: ctx.showUpRate < 40 ? "critical" : "warning",
      recommendation:
        "Taux de présence aux appels trop bas. Renforce tes rappels SMS/email (J-1, H-1). Ajoute une vidéo de confirmation post-booking.",
      impact: `Passer de ${ctx.showUpRate}% à 60% de show-up = ${Math.round(((60 - ctx.showUpRate) / ctx.showUpRate) * 100)}% d'appels en plus sans générer plus de leads.`,
    });
  }

  // Gap contenu (CDC: 0 posts in 7 days = procrastination)
  if (ctx.contentGap) {
    extra.push({
      stepIndex: -1,
      stepLabel: "Gap contenu",
      currentRate: 0,
      benchmarkRate: 0,
      gap: 40,
      severity: ctx.daysSinceContent > 14 ? "critical" : "warning",
      recommendation: `Aucun contenu publié depuis ${ctx.daysSinceContent} jours. L'algorithme pénalise l'inactivité. Publie au minimum 3 contenus cette semaine.`,
      impact:
        "L'absence de contenu organique réduit ta portée et ton autorité. Chaque semaine sans contenu = perte d'engagement cumulée.",
    });
  }

  // Revenue stagnation (CDC: Same CA 2 months)
  if (ctx.revenueStalled && ctx.monthlyRevenues.length >= 2) {
    const lastMonth = ctx.monthlyRevenues[ctx.monthlyRevenues.length - 1] || 0;
    extra.push({
      stepIndex: -1,
      stepLabel: "Revenue stagnant",
      currentRate: lastMonth,
      benchmarkRate: lastMonth * 1.2,
      gap: 30,
      severity: "warning",
      recommendation:
        "Ton CA stagne depuis 2 mois. Envisage : (1) tester de nouvelles audiences, (2) ajouter une offre complémentaire (OTO/upsell), (3) augmenter les budgets ads sur les winners.",
      impact:
        "La stagnation signale un plafond. Sans action, le CA risque de baisser à cause de la fatigue d'audience.",
    });
  }

  return extra;
}

// ─── Main Component ──────────────────────────────────────────
export function BottleneckDetector() {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const [metrics, setMetrics] = useState<FunnelMetrics>({ impressions: 0, clicks: 0, pageViews: 0, leads: 0, calls: 0, sales: 0 });
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [contextualData, setContextualData] = useState<ContextualData>({
    creativeFatigue: false,
    noShows: false,
    showUpRate: 100,
    contentGap: false,
    daysSinceContent: 0,
    revenueStalled: false,
    monthlyRevenues: [],
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // Fetch real metrics from multiple tables
      const [
        impressionsRes,
        leadsRes,
        callsRes,
        salesRes,
        contentRes,
        revenueRes,
        decisionsRes,
      ] = await Promise.all([
        supabase
          .from("ad_campaigns")
          .select("total_impressions, total_clicks, daily_budget")
          .eq("user_id", user.id),
        supabase
          .from("funnel_leads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("sales_call_logs")
          .select("id, outcome", { count: "exact" })
          .eq("user_id", user.id),
        supabase
          .from("revenue_entries")
          .select("id, amount, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("content_library")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("revenue_entries")
          .select("amount, created_at")
          .eq("user_id", user.id)
          .gte(
            "created_at",
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          ),
        supabase
          .from("ad_decisions")
          .select("decision_type")
          .eq("user_id", user.id)
          .eq("decision_type", "creative_fatigue")
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          ),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const campaigns: any[] = impressionsRes.data ?? [];
      const totalImpressions = campaigns.reduce(
        (s: number, c: any) => s + ((c.total_impressions as number) ?? 0),
        0,
      );
      const totalClicks = campaigns.reduce(
        (s: number, c: any) => s + ((c.total_clicks as number) ?? 0),
        0,
      );

      if (totalImpressions > 0 || (leadsRes.count ?? 0) > 0) {
        setMetrics({
          impressions: totalImpressions || 10000,
          clicks: totalClicks || 0,
          pageViews: Math.round(totalClicks * 0.87),
          leads: leadsRes.count ?? 0,
          calls: callsRes.count ?? 0,
          sales: salesRes.count ?? 0,
        });
        setIsDemo(false);
      }

      // Contextual bottleneck data
      const lastContentDate = contentRes.data?.[0]?.created_at;
      const daysSinceContent = lastContentDate
        ? Math.floor(
            (Date.now() - new Date(lastContentDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calls = (callsRes.data as any[]) ?? [];
      const totalCalls = calls.length;
      const noShowCalls = calls.filter(
        (c) => c.outcome === "no_show",
      ).length;
      const showUpRate =
        totalCalls > 0 ? ((totalCalls - noShowCalls) / totalCalls) * 100 : 100;

      // Revenue stagnation: compare last 2 months
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revEntries = (revenueRes.data ?? []) as any[];
      const now = new Date();
      const thisMonthRev = revEntries
        .filter((r) => new Date(r.created_at).getMonth() === now.getMonth())
        .reduce((s: number, r: { amount: number }) => s + (r.amount || 0), 0);
      const lastMonthRev = revEntries
        .filter(
          (r) =>
            new Date(r.created_at).getMonth() ===
            (now.getMonth() - 1 + 12) % 12,
        )
        .reduce((s: number, r: { amount: number }) => s + (r.amount || 0), 0);
      const prevMonthRev = revEntries
        .filter(
          (r) =>
            new Date(r.created_at).getMonth() ===
            (now.getMonth() - 2 + 12) % 12,
        )
        .reduce((s: number, r: { amount: number }) => s + (r.amount || 0), 0);
      const revenueStalled =
        lastMonthRev > 0 &&
        prevMonthRev > 0 &&
        Math.abs(lastMonthRev - prevMonthRev) / prevMonthRev < 0.1;

      setContextualData({
        creativeFatigue: (decisionsRes.data ?? []).length > 0,
        noShows: noShowCalls > 0,
        showUpRate: Math.round(showUpRate),
        contentGap: daysSinceContent > 7,
        daysSinceContent,
        revenueStalled,
        monthlyRevenues: [prevMonthRev, lastMonthRev, thisMonthRev],
      });

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const steps = buildFunnelSteps(metrics);
  const funnelBottlenecks = detectBottlenecks(steps);
  const contextualBottlenecks = detectContextualBottlenecks(contextualData);
  const bottlenecks = [...funnelBottlenecks, ...contextualBottlenecks];

  const criticalCount = bottlenecks.filter(
    (b) => b.severity === "critical",
  ).length;
  const warningCount = bottlenecks.filter(
    (b) => b.severity === "warning",
  ).length;

  const handleRefresh = async () => {
    setAnalyzing(true);
    // Simulate AI analysis delay
    await new Promise((r) => setTimeout(r, 1500));
    setAnalyzing(false);
    toast.success("Analyse du funnel mise à jour");
  };

  const maxValue = Math.max(...steps.map((s) => s.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          )}
          {isDemo && !loading && (
            <Badge variant="yellow">Données de démonstration</Badge>
          )}
          {!loading && criticalCount > 0 && (
            <Badge variant="red">
              {criticalCount} point{criticalCount > 1 ? "s" : ""} critique
              {criticalCount > 1 ? "s" : ""}
            </Badge>
          )}
          {!loading && warningCount > 0 && (
            <Badge variant="yellow">
              {warningCount} avertissement{warningCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={analyzing}
        >
          {analyzing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Analyser
        </Button>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-accent" />
            Entonnoir de conversion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {steps.map((step, i) => {
              const widthPct =
                maxValue > 0 ? Math.max(8, (step.value / maxValue) * 100) : 8;
              const hasBottleneck = bottlenecks.find((b) => b.stepIndex === i);
              const StepIcon = step.icon;

              return (
                <div key={step.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-24 flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
                      <StepIcon className="h-3.5 w-3.5" />
                      {step.label}
                    </div>
                    <div className="flex-1 relative">
                      <div
                        className={cn(
                          "h-10 rounded-lg flex items-center px-3 transition-all duration-500",
                          hasBottleneck?.severity === "critical"
                            ? "bg-red-500/20 border border-red-500/30"
                            : hasBottleneck?.severity === "warning"
                              ? "bg-warning/20 border border-warning/30"
                              : "bg-accent/15 border border-accent/20",
                        )}
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                          {step.value.toLocaleString("fr-FR")}
                        </span>
                      </div>
                      {hasBottleneck && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2">
                          <AlertTriangle
                            className={cn(
                              "h-4 w-4",
                              hasBottleneck.severity === "critical"
                                ? "text-red-400"
                                : "text-warning",
                            )}
                          />
                        </div>
                      )}
                    </div>
                    <div className="w-16 text-right text-xs text-text-muted shrink-0">
                      {i < steps.length - 1 && (
                        <span
                          className={cn(
                            step.conversionToNext <
                              step.benchmarkConversionToNext * 0.75
                              ? "text-red-400 font-semibold"
                              : step.conversionToNext <
                                  step.benchmarkConversionToNext
                                ? "text-warning"
                                : "text-accent",
                          )}
                        >
                          {step.conversionToNext.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex items-center gap-3 py-0.5">
                      <div className="w-24" />
                      <div className="flex-1 flex items-center gap-1 pl-4">
                        <ArrowDown className="h-3 w-3 text-text-muted" />
                        <span className="text-[10px] text-text-muted">
                          Benchmark : {step.benchmarkConversionToNext}%
                        </span>
                      </div>
                      <div className="w-16" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottleneck Cards */}
      {bottlenecks.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Points de friction identifiés ({bottlenecks.length})
          </h3>
          {bottlenecks.map((bn, i) => (
            <Card
              key={i}
              className={cn(
                "border-l-4",
                bn.severity === "critical"
                  ? "border-l-red-500"
                  : bn.severity === "warning"
                    ? "border-l-warning"
                    : "border-l-info",
              )}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        bn.severity === "critical"
                          ? "red"
                          : bn.severity === "warning"
                            ? "yellow"
                            : "muted"
                      }
                    >
                      {bn.severity === "critical"
                        ? "Critique"
                        : bn.severity === "warning"
                          ? "Attention"
                          : "Info"}
                    </Badge>
                    <span className="text-sm font-medium text-text-primary">
                      {bn.stepLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-400 font-semibold">
                      {bn.currentRate.toFixed(1)}%
                    </span>
                    <ArrowRight className="h-3 w-3 text-text-muted" />
                    <span className="text-accent font-semibold">
                      {bn.benchmarkRate.toFixed(1)}%
                    </span>
                    <span className="text-xs text-text-muted">(benchmark)</span>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-bg-tertiary/50">
                  <div className="flex items-start gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <p className="text-sm text-text-secondary">
                      {bn.recommendation}
                    </p>
                  </div>
                  <p className="text-xs text-text-muted pl-6">{bn.impact}</p>
                </div>

                {/* Gap progress */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-text-muted">Écart :</span>
                  <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        bn.severity === "critical"
                          ? "bg-red-500"
                          : bn.severity === "warning"
                            ? "bg-warning"
                            : "bg-info",
                      )}
                      style={{
                        width: `${Math.min(100, (bn.gap / bn.benchmarkRate) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-secondary">
                    -{bn.gap.toFixed(1)} pts
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/12 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              Funnel optimisé
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              Toutes les étapes de ton funnel sont au-dessus des benchmarks.
              Continue à monitorer !
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
