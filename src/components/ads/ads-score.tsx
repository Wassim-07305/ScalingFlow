"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { AdsScoreResult } from "@/lib/ai/prompts/ads-scoring";

interface NoDataResult {
  has_data: false;
  message: string;
}

type ScoreResponse = AdsScoreResult | NoDataResult;

const DIMENSION_LABELS: Record<keyof AdsScoreResult["dimensions"], string> = {
  creatives: "Créatives",
  audiences: "Audiences",
  budget: "Budget",
  performance: "Performance",
  optimisation: "Optimisation",
  structure: "Structure",
};

const DIMENSION_ORDER: Array<keyof AdsScoreResult["dimensions"]> = [
  "performance",
  "creatives",
  "audiences",
  "budget",
  "structure",
  "optimisation",
];

const PRIORITY_COLORS = {
  haute: "text-red-400 bg-red-500/10 border-red-500/20",
  moyenne: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  faible: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const PRIORITY_LABELS = {
  haute: "Haute",
  moyenne: "Moyenne",
  faible: "Faible",
};

function getScoreColor(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 75) return "text-emerald-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getGlobalScoreColor(score: number) {
  if (score >= 65) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function getBarColor(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function AdsScore() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ScoreResponse | null>(null);
  const [expandedDimension, setExpandedDimension] = React.useState<
    string | null
  >(null);

  const runScoring = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/score-ads", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erreur lors du scoring");
        return;
      }
      const data: ScoreResponse = await res.json();
      setResult(data);
    } catch {
      toast.error("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  // Empty state — no result yet
  if (!result && !loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Sparkles className="h-7 w-7 text-accent" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-base font-semibold text-text-primary mb-1">
              Score tes publicités
            </p>
            <p className="text-sm text-text-muted">
              L&apos;IA analyse tes campagnes, créatives et performances en 6
              dimensions et te donne un score /100 avec des recommandations
              actionnables.
            </p>
          </div>
          <Button onClick={runScoring} className="gap-2 mt-2">
            <Sparkles className="h-4 w-4" />
            Score mes ads
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
          <p className="text-sm text-text-muted">
            Analyse de tes publicités en cours…
          </p>
        </CardContent>
      </Card>
    );
  }

  // No data state — only show if there's truly nothing (no dimensions)
  if (result && !result.has_data && !("dimensions" in result)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10">
            <AlertTriangle className="h-7 w-7 text-yellow-400" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-base font-semibold text-text-primary mb-1">
              Aucune donnée publicitaire
            </p>
            <p className="text-sm text-text-muted">{result.message}</p>
          </div>
          <Button variant="outline" onClick={runScoring} className="gap-2 mt-2">
            <Sparkles className="h-4 w-4" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const score = result as AdsScoreResult;

  return (
    <div className="space-y-6">
      {/* Global score header */}
      <Card>
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p
                  className={cn(
                    "text-5xl font-bold tabular-nums",
                    getGlobalScoreColor(score.score_global),
                  )}
                >
                  {score.score_global}
                </p>
                <p className="text-xs text-text-muted mt-0.5">/100</p>
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">
                  Score global
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {score.quality_gate_passed ? (
                    <Badge variant="cyan" className="gap-1 text-xs">
                      <TrendingUp className="h-3 w-3" />
                      Seuil atteint (≥65)
                    </Badge>
                  ) : (
                    <Badge variant="muted" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      Sous le seuil (&lt;65)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runScoring}
              disabled={loading}
              className="gap-2 shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Rescorer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 6 dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par dimension</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DIMENSION_ORDER.map((key) => {
            const dim = score.dimensions[key];
            const pct = Math.round((dim.score / dim.max) * 100);
            const isExpanded = expandedDimension === key;

            return (
              <div
                key={key}
                className="rounded-xl border border-border-default bg-bg-tertiary p-4"
              >
                <button
                  className="w-full text-left"
                  onClick={() =>
                    setExpandedDimension(isExpanded ? null : key)
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {DIMENSION_LABELS[key]}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          getScoreColor(dim.score, dim.max),
                        )}
                      >
                        {dim.score}/{dim.max}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{pct}%</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-bg-secondary overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        getBarColor(dim.score, dim.max),
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>

                {/* Expanded feedback */}
                {isExpanded && (
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed border-t border-border-default pt-3">
                    {dim.feedback}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {score.recommandations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations prioritaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {score.recommandations.map((rec, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3",
                  PRIORITY_COLORS[rec.priorite],
                )}
              >
                <Badge
                  className={cn("shrink-0 text-[10px] mt-0.5", PRIORITY_COLORS[rec.priorite])}
                >
                  {PRIORITY_LABELS[rec.priorite]}
                </Badge>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-0.5">
                    {DIMENSION_LABELS[rec.dimension as keyof typeof DIMENSION_LABELS] ?? rec.dimension}
                  </p>
                  <p className="text-sm text-text-primary">{rec.action}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
