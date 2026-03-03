"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { Sparkles, Target, Heart, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import type { ContentStrategyResult } from "@/lib/ai/prompts/content-strategy";

interface StrategyOverviewProps {
  className?: string;
  onStrategyGenerated?: (result: ContentStrategyResult) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const PILIER_CONFIG = {
  know: { label: "Know", icon: Target, color: "bg-info", textColor: "text-info" },
  like: { label: "Like", icon: Heart, color: "bg-[#A78BFA]", textColor: "text-[#A78BFA]" },
  trust: { label: "Trust", icon: Shield, color: "bg-accent", textColor: "text-accent" },
  convert: { label: "Convert", icon: Zap, color: "bg-warning", textColor: "text-warning" },
} as const;

export function StrategyOverview({ className, onStrategyGenerated, initialData }: StrategyOverviewProps) {
  const [loading, setLoading] = React.useState(false);
  const [strategy, setStrategy] = React.useState<ContentStrategyResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setStrategy(initialData as ContentStrategyResult);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "strategy" }),
      });

      if (!response.ok) throw new Error("Erreur lors de la generation");
      const data = await response.json();
      const result = data.result as ContentStrategyResult;
      setStrategy(result);
      onStrategyGenerated?.(result);
      toast.success("Strategie de contenu generee avec succes !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AILoading text="Creation de ta strategie de contenu" className={className} />;
  }

  if (!strategy) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer ma strategie 30 jours
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          Strategie basee sur les 4 piliers KLCT
        </p>
      </div>
    );
  }

  const { strategie_globale } = strategy;
  const ratio = strategie_globale.ratio_klct;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Strategie globale</h3>
          <p className="text-sm text-text-secondary mt-0.5">
            {strategie_globale.frequence_recommandee}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          Regenerer
        </Button>
      </div>

      {/* Ratio KLCT */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-text-primary mb-4">Repartition KLCT</p>
          <div className="space-y-3">
            {(Object.keys(PILIER_CONFIG) as Array<keyof typeof PILIER_CONFIG>).map((key) => {
              const config = PILIER_CONFIG[key];
              const value = ratio[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <config.icon className={cn("h-4 w-4", config.textColor)} />
                      <span className="text-text-secondary">{config.label}</span>
                    </div>
                    <span className={cn("font-medium", config.textColor)}>{value}%</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", config.color)}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Plateformes prioritaires */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-text-primary mb-3">Plateformes prioritaires</p>
          <div className="flex flex-wrap gap-2">
            {strategie_globale.plateformes_prioritaires.map((p, i) => (
              <Badge key={i} variant="cyan">{p}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
