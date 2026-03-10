"use client";

import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { useUsage } from "@/hooks/use-usage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function WelcomeBanner() {
  const { profile, loading: userLoading } = useUser();
  const { usage, loading: usageLoading, isPro } = useUsage();

  const isLoading = userLoading || usageLoading;
  const firstName = profile?.full_name?.split(" ")[0] || "Utilisateur";
  const plan = profile?.subscription_plan || "free";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon apres-midi";
    return "Bonsoir";
  };

  const planConfig = {
    free: { label: "Free", icon: Zap, color: "bg-bg-tertiary text-text-secondary" },
    pro: { label: "Pro", icon: Sparkles, color: "bg-accent/15 text-accent" },
    premium: { label: "Premium", icon: Crown, color: "bg-[rgba(139,92,246,0.15)] text-[#A78BFA]" },
  };

  const currentPlan = planConfig[plan as keyof typeof planConfig] || planConfig.free;
  const PlanIcon = currentPlan.icon;

  return (
    <Card className="relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

      <CardContent className="py-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-text-primary">
                {isLoading ? (
                  <span className="inline-block h-6 w-40 animate-pulse rounded bg-white/10" />
                ) : (
                  `${getGreeting()}, ${firstName}`
                )}
              </h2>
              {!isLoading && (
                <Badge className={currentPlan.color}>
                  <PlanIcon className="h-3 w-3 mr-1" />
                  {currentPlan.label}
                </Badge>
              )}
            </div>
            {!isLoading && !isPro && usage && (
              <div className="space-y-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">
                    {usage.currentUsage}/{usage.limit ?? 5} generations IA
                  </p>
                  {usage.limit != null && usage.currentUsage >= usage.limit && (
                    <span className="text-xs text-warning font-medium">Limite atteinte</span>
                  )}
                </div>
                <div className="w-full max-w-xs h-2 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      usage.limit != null && usage.currentUsage >= usage.limit
                        ? "bg-warning"
                        : usage.limit != null && usage.currentUsage >= (usage.limit * 0.8)
                          ? "bg-yellow-500"
                          : "bg-accent"
                    )}
                    style={{
                      width: `${Math.min(100, ((usage.currentUsage) / (usage.limit ?? 5)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {!isLoading && isPro && (
              <p className="text-sm text-text-muted">
                Generations IA illimitees
              </p>
            )}
          </div>

          {!isLoading && !isPro && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/15 transition-colors shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              Passer a Pro
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
