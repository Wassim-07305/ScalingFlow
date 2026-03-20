"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { Sparkles, Target, Heart, Shield, Zap, Compass } from "lucide-react";
import { toast } from "sonner";
import type { ContentStrategyResult } from "@/lib/ai/prompts/content-strategy";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

const STRATEGY_TYPES = [
  { key: "organique", label: "Organique" },
  { key: "payant", label: "Payant" },
  { key: "mixte", label: "Mixte" },
] as const;

const PRIMARY_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "multi", label: "Multi-plateforme" },
] as const;

interface StrategyOverviewProps {
  className?: string;
  onStrategyGenerated?: (result: ContentStrategyResult) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const PILIER_CONFIG = {
  know: {
    label: "Know",
    icon: Target,
    color: "bg-info",
    textColor: "text-info",
  },
  like: {
    label: "Like",
    icon: Heart,
    color: "bg-[#A78BFA]",
    textColor: "text-[#A78BFA]",
  },
  trust: {
    label: "Trust",
    icon: Shield,
    color: "bg-accent",
    textColor: "text-accent",
  },
  convert: {
    label: "Convert",
    icon: Zap,
    color: "bg-warning",
    textColor: "text-warning",
  },
} as const;

export function StrategyOverview({
  className,
  onStrategyGenerated,
  initialData,
}: StrategyOverviewProps) {
  const [loading, setLoading] = React.useState(false);
  const [strategy, setStrategy] = React.useState<ContentStrategyResult | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);

  // Form state
  const [strategyType, setStrategyType] = React.useState("organique");
  const [primaryPlatform, setPrimaryPlatform] = React.useState("instagram");
  const [objective, setObjective] = React.useState("");
  const [showForm, setShowForm] = React.useState(true);

  React.useEffect(() => {
    if (initialData) {
      setStrategy(initialData as ContentStrategyResult);
      setShowForm(false);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "strategy",
          strategyType,
          primaryPlatform,
          objective: objective || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      const result = data.result as ContentStrategyResult;
      setStrategy(result);
      setShowForm(false);
      onStrategyGenerated?.(result);
      toast.success("Stratégie de contenu générée avec succès !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (usageLimited) {
    return (
      <UpgradeWall
        currentUsage={usageLimited.currentUsage}
        limit={usageLimited.limit}
        className={className}
      />
    );
  }

  if (loading) {
    return (
      <AILoading
        text="Création de la stratégie de contenu"
        className={className}
      />
    );
  }

  if (!strategy || showForm) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-accent" />
              Paramètres de stratégie
            </CardTitle>
            <CardDescription>
              Définis le type de stratégie, la plateforme principale et tes
              objectifs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Strategy type */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Type de stratégie
              </label>
              <div className="flex flex-wrap gap-2">
                {STRATEGY_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setStrategyType(t.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      strategyType === t.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary platform */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Plateforme principale
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIMARY_PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPrimaryPlatform(p.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      primaryPlatform === p.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Business objective */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Objectif principal{" "}
                <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ex: augmenter les leads, renforcer l'autorité, lancer un produit..."
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button size="lg" onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer ma stratégie 30 jours
            </Button>
            <p className="text-xs text-text-muted text-center">
              Stratégie basée sur les 4 piliers KLCT
            </p>
          </CardContent>
        </Card>
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
          <h3 className="text-base font-semibold text-text-primary">
            Stratégie globale
          </h3>
          <p className="text-sm text-text-secondary mt-0.5">
            {strategie_globale.frequence_recommandee}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            Nouveau brief
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            Régénérer
          </Button>
        </div>
      </div>

      {/* Ratio KLCT */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-text-primary mb-4">
            Répartition KLCT
          </p>
          <div className="space-y-3">
            {(
              Object.keys(PILIER_CONFIG) as Array<keyof typeof PILIER_CONFIG>
            ).map((key) => {
              const config = PILIER_CONFIG[key];
              const value = ratio[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <config.icon
                        className={cn("h-4 w-4", config.textColor)}
                      />
                      <span className="text-text-secondary">
                        {config.label}
                      </span>
                    </div>
                    <span className={cn("font-medium", config.textColor)}>
                      {value}%
                    </span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        config.color,
                      )}
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
          <p className="text-sm font-medium text-text-primary mb-3">
            Plateformes prioritaires
          </p>
          <div className="flex flex-wrap gap-2">
            {(strategie_globale.plateformes_prioritaires ?? []).map((p, i) => (
              <Badge key={i} variant="cyan">
                {p}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
