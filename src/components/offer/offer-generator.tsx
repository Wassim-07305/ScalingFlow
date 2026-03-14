"use client";

import React from "react";
import { Sparkles, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { OfferPreview } from "./offer-preview";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

interface OfferGeneratorProps {
  className?: string;
  marketAnalysisId?: string;
  marketName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function OfferGenerator({ className, marketAnalysisId, marketName, initialData }: OfferGeneratorProps) {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedOffer, setGeneratedOffer] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  // Charger les données historiques quand initialData change
  React.useEffect(() => {
    if (initialData) {
      setGeneratedOffer(initialData);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!marketAnalysisId) {
      setError("Complète d'abord ton analyse de marché dans l'onboarding.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedOffer(null);

    try {
      const response = await fetch("/api/ai/generate-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketAnalysisId }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }

      const data = await response.json();
      setGeneratedOffer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (generatedOffer) {
    return (
      <OfferPreview
        offer={generatedOffer}
        onRegenerate={() => {
          setGeneratedOffer(null);
          handleGenerate();
        }}
        className={className}
      />
    );
  }

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Génération de ton offre irrésistible" className={className} />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {marketAnalysisId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Générer une offre
            </CardTitle>
            <CardDescription>
              L&apos;IA va créer une offre irrésistible basée sur ton analyse de marché
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketName && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Marché :</span>
                <Badge variant="default">{marketName}</Badge>
              </div>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button size="lg" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer mon offre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Package}
          title="Aucune analyse de marché"
          description="Complète d'abord l'onboarding pour analyser ton marché et pouvoir générer une offre."
          actionLabel="Aller à l'onboarding"
          onAction={async () => {
            if (user) {
              const supabase = createClient();
              await supabase.from("profiles").update({ onboarding_completed: false, onboarding_step: 0 }).eq("id", user.id);
            }
            window.location.href = "/onboarding";
          }}
        />
      )}
    </div>
  );
}
