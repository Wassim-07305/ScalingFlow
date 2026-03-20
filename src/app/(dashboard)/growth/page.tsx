"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  TrendingUp,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GROWTH_TIERS,
  getCurrentTier,
  getProgressToNextTier,
  getTierColor,
  getTierBgColor,
  type GrowthTier,
} from "@/lib/services/growth-tiers";
import type { GrowthRecommendationsResult } from "@/lib/ai/prompts/growth-recommendations";

const FEATURE_LINKS: Record<string, string> = {
  "Scoring Business": "/progress",
  "Scoring Ads": "/ads/analytics",
  "Funnel Builder": "/funnel",
  Vault: "/vault",
  "Plan Quotidien": "/",
  Pipeline: "/sales/pipeline",
  Offre: "/offer",
  Contenu: "/content",
};

function getPriorityColor(priority: "haute" | "moyenne") {
  return priority === "haute" ? "text-danger" : "text-warning";
}

function getPriorityBg(priority: "haute" | "moyenne") {
  return priority === "haute" ? "bg-danger/10" : "bg-warning/10";
}

interface PageData {
  cached_recommendations: GrowthRecommendationsResult | null;
  current_revenue: number;
  current_tier: GrowthTier;
  next_tier: GrowthTier | null;
  progress_percent: number;
  missing_revenue: number;
}

export default function GrowthPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [pageData, setPageData] = React.useState<PageData | null>(null);
  const [recommendations, setRecommendations] =
    React.useState<GrowthRecommendationsResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetch("/api/ai/growth-recommendations")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setPageData(d);
          if (d.cached_recommendations) {
            setRecommendations(d.cached_recommendations);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/growth-recommendations", {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur");
      }
      const data = await res.json();
      setRecommendations(data);
      toast.success("Plan de croissance généré !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <AILoading text="Chargement de ton plan de croissance" />;

  const currentTier = pageData?.current_tier ?? getCurrentTier(0);
  const nextTier = pageData?.next_tier ?? null;
  const progress = pageData?.progress_percent ?? 0;
  const currentRevenue = pageData?.current_revenue ?? 0;
  const missingRevenue = pageData?.missing_revenue ?? 0;
  const tierColor = getTierColor(currentTier.id);
  const tierBg = getTierBgColor(currentTier.id);

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Mon Plan de Croissance"
        description="Recommandations personnalisées pour passer au palier suivant."
      />

      <div className="space-y-6">
        {/* Tier visualization */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Current tier */}
              <div className="flex-1 text-center sm:text-left">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-2",
                    tierBg,
                    tierColor,
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  Palier actuel — {currentTier.label}
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {currentRevenue > 0
                    ? `${currentRevenue.toLocaleString("fr-FR")} €/mois`
                    : "CA non renseigné"}
                </p>
                {nextTier && missingRevenue > 0 && (
                  <p className="text-sm text-text-muted mt-1">
                    {missingRevenue.toLocaleString("fr-FR")} € avant{" "}
                    {nextTier.label}
                  </p>
                )}
              </div>

              {/* Progress */}
              {nextTier && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex-1 sm:w-32">
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{currentTier.label}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold",
                      getTierBgColor(nextTier.id),
                      getTierColor(nextTier.id),
                    )}
                  >
                    {nextTier.label}
                  </div>
                </div>
              )}
            </div>

            {/* All tiers roadmap */}
            <div className="mt-6 flex items-center justify-center gap-1 overflow-x-auto pb-2">
              {GROWTH_TIERS.map((tier, i) => {
                const isActive = tier.id === currentTier.id;
                const isPast =
                  GROWTH_TIERS.indexOf(tier) <
                  GROWTH_TIERS.indexOf(currentTier);
                return (
                  <React.Fragment key={tier.id}>
                    <div
                      className={cn(
                        "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                        isActive
                          ? cn(tierBg, tierColor, "ring-1 ring-current/30")
                          : isPast
                            ? "text-accent/60 bg-accent/5"
                            : "text-text-muted bg-bg-tertiary",
                      )}
                    >
                      {isPast && <CheckCircle2 className="h-3 w-3" />}
                      <span>{tier.label}</span>
                      <span className="opacity-70">
                        {tier.range.max === Infinity
                          ? "50K+"
                          : `${(tier.range.max / 1000).toFixed(0)}K€`}
                      </span>
                    </div>
                    {i < GROWTH_TIERS.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {generating ? (
          <AILoading text="Génération de ton plan de croissance personnalisé" />
        ) : recommendations ? (
          <>
            {/* Blocking reasons */}
            {recommendations.blocking_reasons?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Pourquoi tu es encore à ce palier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.blocking_reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-warning mt-0.5 shrink-0">•</span>
                        <span className="text-sm text-text-secondary">
                          {reason}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 5 recommendations */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                Tes 5 priorités pour passer au palier suivant
              </h2>
              <div className="space-y-3">
                {recommendations.recommendations?.map((rec, i) => {
                  const featureLink = Object.entries(FEATURE_LINKS).find(
                    ([name]) =>
                      rec.scalingflow_feature
                        ?.toLowerCase()
                        .includes(name.toLowerCase()),
                  )?.[1];
                  return (
                    <Card key={i} className="border-border-default">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs font-bold text-text-muted">
                                #{i + 1}
                              </span>
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium",
                                  getPriorityBg(rec.priority),
                                  getPriorityColor(rec.priority),
                                )}
                              >
                                {rec.priority === "haute" ? "🔴 Haute" : "🟡 Moyenne"}
                              </span>
                              <h3 className="text-sm font-semibold text-text-primary">
                                {rec.title}
                              </h3>
                            </div>
                            <p className="text-sm text-text-secondary mb-3">
                              {rec.action}
                            </p>
                            <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {rec.kpi_target}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {rec.suggested_deadline}
                              </span>
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-accent" />
                                {rec.scalingflow_feature}
                              </span>
                            </div>
                          </div>
                          {featureLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(featureLink)}
                              className="shrink-0"
                            >
                              Ouvrir
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Transition plan */}
            {recommendations.transition_plan?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-accent" />
                    Les 3 changements les plus impactants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {recommendations.transition_plan.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Benchmark */}
            {recommendations.benchmark_comparison && (
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="pt-4">
                  <p className="text-sm text-text-secondary italic">
                    💡 {recommendations.benchmark_comparison}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Refresh */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={generating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser les recommandations
              </Button>
            </div>
          </>
        ) : (
          /* No recommendations yet */
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Sparkles className="h-10 w-10 text-accent mx-auto" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">
                  Génère ton plan de croissance
                </h3>
                <p className="text-sm text-text-muted max-w-md mx-auto">
                  L&apos;IA analyse ton CA, tes scores business, tes métriques
                  ads et ton pipeline pour créer un plan personnalisé.
                </p>
              </div>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Générer mon plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current tier focus areas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Focus du palier {currentTier.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Priorités
              </p>
              <ul className="space-y-1">
                {currentTier.focus_areas.map((area) => (
                  <li
                    key={area}
                    className="text-sm text-text-secondary flex items-center gap-2"
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", tierBg.replace("bg-", "bg-").replace("/10", ""))}>
                    </span>
                    {area.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Signaux d&apos;alarme
              </p>
              <ul className="space-y-1">
                {currentTier.danger_signs.slice(0, 3).map((sign, i) => (
                  <li
                    key={i}
                    className="text-sm text-text-secondary flex items-start gap-2"
                  >
                    <AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                    {sign}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
