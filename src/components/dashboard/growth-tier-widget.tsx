"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import {
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCurrentTier,
  getProgressToNextTier,
  getTierColor,
  getTierBgColor,
} from "@/lib/services/growth-tiers";

interface TierData {
  current_revenue: number;
  progress_percent: number;
  missing_revenue: number;
  current_tier: ReturnType<typeof getCurrentTier>;
  next_tier: ReturnType<typeof getCurrentTier> | null;
}

export function GrowthTierWidget() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [data, setData] = React.useState<TierData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetch("/api/ai/growth-recommendations")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-24">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { current_tier, next_tier, progress_percent, current_revenue, missing_revenue } =
    data;

  const tierColor = getTierColor(current_tier.id);
  const tierBg = getTierBgColor(current_tier.id);

  return (
    <Card className="border-border-default hover:border-accent/40 transition-colors">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: tier info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                tierBg,
              )}
            >
              <TrendingUp className={cn("h-4 w-4", tierColor)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    tierBg,
                    tierColor,
                  )}
                >
                  {current_tier.label}
                </span>
                <span className="text-sm text-text-primary font-medium">
                  {current_revenue > 0
                    ? `${current_revenue.toLocaleString("fr-FR")} €/mois`
                    : "CA non renseigné"}
                </span>
              </div>
              {next_tier && (
                <p className="text-xs text-text-muted mt-0.5">
                  {missing_revenue > 0
                    ? `${missing_revenue.toLocaleString("fr-FR")} € avant ${next_tier.label}`
                    : `Prêt pour ${next_tier.label}`}
                </p>
              )}
            </div>
          </div>

          {/* Right: progress + CTA */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {next_tier && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${progress_percent}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {progress_percent}%
                </span>
                <ArrowRight className="h-3 w-3 text-text-muted" />
                <span className="text-xs text-text-secondary">
                  {next_tier.label}
                </span>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/growth")}
              className="shrink-0"
            >
              Mon plan
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Progress bar mobile */}
        {next_tier && (
          <div className="mt-3 sm:hidden">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>{current_tier.label}</span>
              <span>{progress_percent}% → {next_tier.label}</span>
            </div>
            <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${progress_percent}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
