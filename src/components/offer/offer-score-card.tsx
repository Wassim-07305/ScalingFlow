"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  Target,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import type { OfferScoreResult } from "@/lib/ai/prompts/offer-scoring";

const CRITERIA_LABELS: Record<string, { label: string; maxScore: number }> = {
  clarte_promesse: { label: "Clarte de la promesse", maxScore: 17 },
  force_mecanisme: { label: "Force du mecanisme", maxScore: 17 },
  pricing_justifie: { label: "Pricing justifie", maxScore: 17 },
  garantie_solide: { label: "Garantie solide", maxScore: 17 },
  urgence_rarete: { label: "Urgence & rarete", maxScore: 16 },
  value_stack: { label: "Value Stack", maxScore: 16 },
};

interface OfferScoreCardProps {
  offerId?: string;
  className?: string;
}

export function OfferScoreCard({ offerId, className }: OfferScoreCardProps) {
  const [loading, setLoading] = React.useState(false);
  const [score, setScore] = React.useState<OfferScoreResult | null>(null);

  const handleScore = async () => {
    if (!offerId) {
      toast.error("Veuillez d'abord generer une offre.");
      return;
    }

    setLoading(true);
    setScore(null);

    try {
      const response = await fetch("/api/ai/score-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de l'evaluation");
      }

      const data: OfferScoreResult = await response.json();
      setScore(data);
      toast.success("Evaluation terminee !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AILoading text="Evaluation de ton offre en cours" className={className} />;
  }

  if (!score) {
    return (
      <div className={cn("space-y-6", className)}>
        {offerId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Score de l&apos;offre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                L&apos;IA va evaluer ton offre sur 6 criteres et te donner un score sur 100 avec des recommandations d&apos;amelioration.
              </p>
              <Button size="lg" onClick={handleScore}>
                <Sparkles className="h-4 w-4 mr-2" />
                Evaluer mon offre
              </Button>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Target}
            title="Aucune offre disponible"
            description="Genere d'abord une offre pour pouvoir l'evaluer."
          />
        )}
      </div>
    );
  }

  const scoreColor =
    score.score_total >= 80
      ? "text-accent"
      : score.score_total >= 70
      ? "text-info"
      : score.score_total >= 50
      ? "text-warning"
      : "text-danger";

  const scoreBgColor =
    score.score_total >= 80
      ? "bg-accent"
      : score.score_total >= 70
      ? "bg-info"
      : score.score_total >= 50
      ? "bg-warning"
      : "bg-danger";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Total Score */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Circular gauge */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-bg-tertiary"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(score.score_total / 100) * 264} 264`}
                    className={scoreColor}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-2xl font-bold", scoreColor)}>
                    {score.score_total}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-text-primary">Score global</p>
                <p className="text-sm text-text-secondary">sur 100 points</p>
              </div>
            </div>

            {/* Quality Gate */}
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl",
                score.quality_gate_passed
                  ? "bg-accent-muted text-accent"
                  : "bg-danger/12 text-danger"
              )}
            >
              {score.quality_gate_passed ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {score.quality_gate_passed ? "Quality Gate passe" : "Quality Gate echoue"}
              </span>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-text-muted">
              <span>0</span>
              <span className="text-text-secondary">Seuil : 70</span>
              <span>100</span>
            </div>
            <div className="relative">
              <Progress value={score.score_total} />
              {/* 70 threshold marker */}
              <div
                className="absolute top-0 h-full w-px bg-text-muted"
                style={{ left: "70%" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detail des criteres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(score.criteres).map(([key, value]) => {
            const meta = CRITERIA_LABELS[key];
            if (!meta) return null;

            const percent = Math.round((value.score / meta.maxScore) * 100);
            const barColor =
              percent >= 80
                ? "bg-accent"
                : percent >= 60
                ? "bg-info"
                : percent >= 40
                ? "bg-warning"
                : "bg-danger";

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {meta.label}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {value.score}/{meta.maxScore}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted">{value.feedback}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {score.recommandations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {score.recommandations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-default"
              >
                <Badge variant="yellow" className="shrink-0 mt-0.5">
                  {i + 1}
                </Badge>
                <p className="text-sm text-text-secondary">{rec}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Re-score button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={handleScore}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-evaluer l&apos;offre
        </Button>
      </div>
    </div>
  );
}
