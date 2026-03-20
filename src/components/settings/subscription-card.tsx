"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useUsage } from "@/hooks/use-usage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PLANS, getPlanById, resolvePlanId } from "@/lib/stripe/plans";
import { toast } from "sonner";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Check,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  scale: Crown,
  agency: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  free: "text-zinc-400",
  scale: "text-purple-400",
  agency: "text-amber-400",
};

export function SubscriptionCard() {
  const { profile } = useUser();
  const { usage } = useUsage();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  const isActive = profile?.subscription_status === "active";
  const currentPlanId = resolvePlanId(
    isActive ? profile?.subscription_plan || "scale" : "free",
  );
  const currentPlan = getPlanById(currentPlanId);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'accès au portail.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Impossible d'accéder au portail de facturation.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleCheckout = async (priceId: string, planId: string) => {
    setLoadingCheckout(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création du checkout.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Impossible de créer la session de paiement.");
    } finally {
      setLoadingCheckout(null);
    }
  };

  // Plans payants pour la liste d'upgrade
  const paidPlans = PLANS.filter((p) => p.price > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          Abonnement
        </CardTitle>
        <CardDescription>Gère ton abonnement ScalingFlow</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Plan actuel */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Plan actuel</p>
            <p className="text-xs text-text-muted">
              {isActive ? "Abonnement actif" : "Aucun abonnement"}
            </p>
          </div>
          <Badge variant={isActive ? "cyan" : "muted"}>
            {currentPlan?.name || "Gratuit"}
          </Badge>
        </div>

        {/* Quota usage */}
        {usage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Générations IA ce mois</span>
              <span className="text-text-secondary">
                {usage.currentUsage}/{usage.limit}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.percentUsed > 90
                    ? "bg-red-400"
                    : usage.percentUsed > 70
                      ? "bg-amber-400"
                      : "bg-accent"
                }`}
                style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Features du plan actuel */}
        <div className="space-y-1.5">
          {currentPlan?.features.slice(0, 5).map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-xs text-text-secondary"
            >
              <Check className="h-3.5 w-3.5 text-accent shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        {/* Manage existing subscription */}
        {isActive && profile?.stripe_customer_id && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageSubscription}
            disabled={loadingPortal}
          >
            {loadingPortal ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Gérer l&apos;abonnement
          </Button>
        )}

        <Separator />

        {/* Plans disponibles */}
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">
            {isActive ? "Changer de plan" : "Choisir un plan"}
          </p>
          <div className="space-y-3">
            {paidPlans.map((plan) => {
              const Icon = PLAN_ICONS[plan.id] || Zap;
              const color = PLAN_COLORS[plan.id] || "text-text-muted";
              const isCurrent = plan.id === currentPlanId;

              return (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? "border-accent/30 bg-accent/5"
                      : plan.popular
                        ? "border-accent/20 bg-bg-tertiary/30"
                        : "border-border-default/50 bg-bg-tertiary/30"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0">
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {plan.name}
                        </span>
                        {plan.popular && !isCurrent && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            Populaire
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge variant="cyan" className="text-[10px] px-1.5 py-0">
                            Actuel
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted truncate">
                        {plan.limits.aiGenerationsPerMonth} générations/mois
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-text-primary">
                      {plan.price}€
                      <span className="text-[10px] text-text-muted font-normal">
                        /mois
                      </span>
                    </span>
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant={plan.popular ? "default" : "outline"}
                        disabled={loadingCheckout === plan.id}
                        onClick={() => handleCheckout(plan.stripePriceId, plan.id)}
                        className="h-8 text-xs"
                      >
                        {loadingCheckout === plan.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Choisir"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
