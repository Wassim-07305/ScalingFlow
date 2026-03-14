"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { GlowCard } from "@/components/shared/glow-card";
import { cn } from "@/lib/utils/cn";
import {
  Sparkles,
  Gift,
  Clock,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  FileDown,
  Package,
} from "lucide-react";
import { exportToPDF } from "@/lib/utils/export-pdf";

interface OtoGeneratorProps {
  offerId?: string;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function OtoGenerator({ offerId, className, initialData }: OtoGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [otoData, setOtoData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Charger les données historiques quand initialData change
  React.useEffect(() => {
    if (initialData?.oto_data) {
      setOtoData(initialData.oto_data);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!offerId) {
      setError("Veuillez d'abord générer une offre principale.");
      return;
    }

    setLoading(true);
    setError(null);
    setOtoData(null);

    try {
      const response = await fetch("/api/ai/generate-oto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération de l'offre OTO");
      }

      const data = await response.json();
      setOtoData(data.oto_data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AILoading text="Creation de ton offre OTO" className={className} />;
  }

  if (otoData) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header : hook + headline + subheadline */}
        <div className="flex items-start justify-between">
          <div>
            {otoData.hook && (
              <p className="text-sm font-medium text-warning mb-2">{otoData.hook}</p>
            )}
            <h2 className="text-2xl font-bold text-text-primary">
              {otoData.headline || otoData.oto_name}
            </h2>
            {otoData.subheadline && (
              <p className="mt-2 text-text-secondary max-w-2xl">{otoData.subheadline}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToPDF({
                  title: otoData.oto_name || "Offre OTO",
                  subtitle: "OTO générée par ScalingFlow",
                  content: otoData,
                  filename: `oto-${(otoData.oto_name || "offre").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
                })
              }
            >
              <FileDown className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setOtoData(null); handleGenerate(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Régénérer
            </Button>
          </div>
        </div>

        {/* Problème sans OTO */}
        {otoData.problem_without_oto && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Pourquoi l&apos;offre principale seule ne suffit pas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary text-sm">{otoData.problem_without_oto}</p>
            </CardContent>
          </Card>
        )}

        {/* Description de l'OTO */}
        {otoData.oto_description && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-5 w-5 text-accent" />
                Ce que contient l&apos;OTO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary text-sm">{otoData.oto_description}</p>
            </CardContent>
          </Card>
        )}

        {/* Bénéfices en grille */}
        {otoData.benefits?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Benefices</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {otoData.benefits.map(
                (b: { title: string; description: string }, i: number) => (
                  <GlowCard key={i} glowColor="cyan">
                    <h4 className="font-medium text-text-primary mb-1">{b.title}</h4>
                    <p className="text-text-secondary text-sm">{b.description}</p>
                  </GlowCard>
                )
              )}
            </div>
          </div>
        )}

        {/* Value Stack */}
        {otoData.value_stack?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-accent" />
                Empilement de valeur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {otoData.value_stack.map(
                  (item: { item: string; value: string }, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between py-2 border-b border-border-default/50"
                    >
                      <span className="text-text-primary text-sm">{item.item}</span>
                      <span className="text-accent font-medium text-sm">{item.value}</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Affichage du prix */}
        <GlowCard glowColor="orange">
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <p className="text-sm text-text-secondary">Valeur totale</p>
            {otoData.total_value && (
              <span className="text-2xl text-text-muted line-through">
                {otoData.total_value}
              </span>
            )}
            {otoData.oto_price && (
              <span className="text-4xl font-bold text-accent">
                {otoData.oto_price}
              </span>
            )}
            {otoData.discount_percentage && (
              <Badge variant="red">{otoData.discount_percentage} de reduction</Badge>
            )}
          </div>
        </GlowCard>

        {/* Elements d'urgence */}
        {otoData.urgency_elements?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Urgence
            </h3>
            <div className="flex flex-wrap gap-2">
              {otoData.urgency_elements.map((el: string, i: number) => (
                <Badge key={i} variant="yellow">{el}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center gap-4">
              {otoData.cta_text && (
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-lg">
                  <ArrowRight className="h-5 w-5" />
                  {otoData.cta_text}
                </div>
              )}
              {otoData.decline_text && (
                <p className="text-text-muted text-sm italic">{otoData.decline_text}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Page copy */}
        {otoData.page_copy && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Texte de la page OTO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {otoData.page_copy.opening && (
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase mb-1">Ouverture</p>
                  <p className="text-text-secondary text-sm">{otoData.page_copy.opening}</p>
                </div>
              )}
              {otoData.page_copy.body && (
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase mb-1">Corps</p>
                  <p className="text-text-secondary text-sm">{otoData.page_copy.body}</p>
                </div>
              )}
              {otoData.page_copy.closing && (
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase mb-1">Conclusion</p>
                  <p className="text-text-secondary text-sm">{otoData.page_copy.closing}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Garantie */}
        {otoData.guarantee && (
          <GlowCard glowColor="blue">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold text-text-primary">Garantie OTO</h3>
            </div>
            <p className="text-text-secondary text-sm">{otoData.guarantee}</p>
          </GlowCard>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {offerId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-accent" />
              Offre OTO (One-Time Offer)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-text-secondary text-sm">
              Génère une offre OTO irrésistible qui se présente juste après l&apos;achat
              de ton offre principale pour maximiser la valeur client.
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button size="lg" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer l&apos;offre OTO
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Package}
          title="Aucune offre principale"
          description="Génère d'abord une offre principale dans l'onglet Générer pour pouvoir créer une offre OTO."
          actionLabel="Aller à Générer"
          onAction={() => window.location.href = "/offer"}
        />
      )}
    </div>
  );
}
