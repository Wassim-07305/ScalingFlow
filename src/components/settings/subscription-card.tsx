"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
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
import { PLANS, getPlanById } from "@/lib/stripe/plans";
import { toast } from "sonner";
import { CreditCard, ExternalLink, Loader2, Sparkles, Check } from "lucide-react";
import Link from "next/link";

export function SubscriptionCard() {
  const { profile } = useUser();
  const [loadingPortal, setLoadingPortal] = useState(false);

  const isActive = profile?.subscription_status === "active";

  // Determiner le plan actuel (par defaut "free" si pas d'abonnement actif)
  const currentPlanId = isActive ? "pro" : "free";
  const currentPlan = getPlanById(currentPlanId);
  const freePlan = PLANS[0];

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'acces au portail.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Impossible d'acceder au portail de facturation.");
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          Abonnement
        </CardTitle>
        <CardDescription>Gere ton abonnement ScalingFlow</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Features du plan actuel */}
        <div className="space-y-1.5">
          {(isActive ? currentPlan?.features : freePlan?.features)?.map(
            (feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-xs text-text-secondary"
              >
                <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                {feature}
              </div>
            )
          )}
        </div>

        <Separator />

        {/* Actions */}
        {isActive ? (
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
            Gerer l&apos;abonnement
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href="/pricing">
              <Sparkles className="h-4 w-4 mr-2" />
              Passer a Pro
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
