"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, type Plan } from "@/lib/stripe/plans";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { Check, Loader2, Sparkles, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  pro: <Sparkles className="h-5 w-5" />,
  premium: <Crown className="h-5 w-5" />,
};

export default function PricingPage() {
  const { profile } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const isActive = profile?.subscription_status === "active";
  const currentPlanId = isActive ? "pro" : "free";

  const handleSubscribe = async (plan: Plan) => {
    if (plan.id === "free") return;

    setLoadingPlan(plan.id);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.stripePriceId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la creation du paiement.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Impossible de lancer le paiement.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tarifs"
        description="Choisis le plan adapte a tes ambitions."
      />

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                isPopular && "border-accent/50 shadow-[0_0_24px_rgba(52,211,153,0.08)]"
              )}
            >
              {/* Badge populaire */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="px-3 py-1 text-xs font-semibold">
                    Le plus populaire
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-lg",
                      plan.id === "free" && "bg-bg-tertiary text-text-secondary",
                      plan.id === "pro" && "bg-accent-muted text-accent",
                      plan.id === "premium" && "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]"
                    )}
                  >
                    {PLAN_ICONS[plan.id]}
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <p className="text-xs text-text-muted">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Prix */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-text-primary">
                    {plan.price === 0 ? "0" : plan.price}
                  </span>
                  <span className="text-sm text-text-muted">
                    {plan.price === 0 ? "EUR" : "EUR/mois"}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          plan.id === "premium" ? "text-[#A78BFA]" : "text-accent"
                        )}
                      />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled
                  >
                    Plan actuel
                  </Button>
                ) : plan.id === "free" ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled
                  >
                    Inclus
                  </Button>
                ) : (
                  <Button
                    variant={isPopular ? "default" : "secondary"}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Commencer
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Note */}
      <p className="text-xs text-text-muted mt-6 max-w-2xl">
        Tous les plans incluent un acces a la plateforme ScalingFlow. Les paiements
        sont securises via Stripe. Tu peux annuler a tout moment depuis les
        parametres de ton compte.
      </p>
    </div>
  );
}
