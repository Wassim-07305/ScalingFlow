"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface UpgradeWallProps {
  /** Current number of generations used this month */
  currentUsage?: number;
  /** Monthly generation limit for the plan */
  limit?: number;
  /** If set, shows a feature-locked message instead of quota message */
  featureName?: string;
  /** Minimum plan required to access the feature */
  minPlan?: string;
  className?: string;
}

export function UpgradeWall({
  currentUsage = 0,
  limit = 0,
  featureName,
  minPlan,
  className,
}: UpgradeWallProps) {
  const isFeatureLock = !!featureName;
  const percent = limit > 0 ? Math.round((currentUsage / limit) * 100) : 100;
  const planLabel = minPlan
    ? minPlan.charAt(0).toUpperCase() + minPlan.slice(1)
    : "supérieur";

  return (
    <div className={cn("relative", className)}>
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5 blur-3xl" />

      <Card className="relative overflow-hidden border-accent/20 backdrop-blur-sm bg-bg-secondary/80">
        {/* Decorative gradient border top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        <CardContent className="py-12 text-center space-y-6">
          {/* Animated lock icon with glow */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-accent/20 blur-xl animate-pulse" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-accent/20 to-emerald-600/10 border border-accent/30 flex items-center justify-center backdrop-blur-sm">
                {isFeatureLock ? (
                  <ShieldAlert className="h-8 w-8 text-accent" />
                ) : (
                  <Lock className="h-8 w-8 text-accent" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-text-primary">
              {isFeatureLock
                ? `${featureName} — Fonctionnalité verrouillée`
                : "Limite de générations atteinte"}
            </h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              {isFeatureLock
                ? `${featureName} est disponible à partir du plan ${planLabel}. Upgrade ton plan pour y accéder.`
                : "Tu as utilisé toutes tes générations IA pour ce mois-ci. Passe au plan supérieur pour débloquer plus de générations."}
            </p>
          </div>

          {/* Usage bar — only show for quota limits, not feature locks */}
          {!isFeatureLock && limit > 0 && (
            <div className="max-w-xs mx-auto space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Utilisation</span>
                <Badge variant="muted">
                  {currentUsage}/{limit} générations
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted">
                {percent}% de ton quota mensuel utilisé
              </p>
            </div>
          )}

          {/* CTA */}
          <Button
            size="lg"
            className="bg-gradient-to-r from-accent to-emerald-400 hover:from-accent/90 hover:to-emerald-400/90 text-white font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300"
            onClick={() => (window.location.href = "/settings")}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isFeatureLock ? `Passer au plan ${planLabel}` : "Voir les plans"}
          </Button>

          {!isFeatureLock && (
            <p className="text-xs text-text-muted">
              Ou réessaie le mois prochain avec ton plan actuel
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
