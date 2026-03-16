"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Clock,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

interface PricingCalculatorProps {
  className?: string;
}

export function PricingCalculator({ className }: PricingCalculatorProps) {
  const [revenuPotentiel, setRevenuPotentiel] = useState<number>(0);
  const [dureeAccompagnement, setDureeAccompagnement] = useState<number>(3);
  const [coutDelivery, setCoutDelivery] = useState<number>(0);
  const [nombreClients, setNombreClients] = useState<number>(0);
  const [prixMarche, setPrixMarche] = useState<number>(0);
  const [coutAcquisition, setCoutAcquisition] = useState<number>(0);
  const [probabiliteResultat, setProbabiliteResultat] = useState<number>(80);

  const calculations = useMemo(() => {
    // Règle du 10% ajustée par le multiplicateur de probabilité
    const prixBrut = Math.round(revenuPotentiel * 0.1);
    const multiplicateurProba = probabiliteResultat / 100;
    const prixAjuste = Math.round(prixBrut * multiplicateurProba);

    // Floor : (CAC + coût delivery) × 2
    const prixPlancher = Math.round((coutAcquisition + coutDelivery) * 2);

    // Le prix recommandé est le MAX entre le prix ajusté et le plancher
    const prixRecommande = Math.max(prixAjuste, prixPlancher);
    const floorApplied =
      prixRecommande === prixPlancher && prixPlancher > prixAjuste;

    const tiers = {
      basic: {
        name: "Basic",
        prix: Math.round(prixRecommande * 0.6),
        description: "Accès au programme principal",
      },
      premium: {
        name: "Premium",
        prix: prixRecommande,
        description: "Programme + accompagnement personnalisé",
      },
      vip: {
        name: "VIP",
        prix: Math.round(prixRecommande * 1.8),
        description: "Programme + accompagnement + accès illimité",
      },
    };

    const margeNette =
      prixRecommande > 0
        ? Math.round(((prixRecommande - coutDelivery) / prixRecommande) * 100)
        : 0;

    const roiClient =
      prixRecommande > 0
        ? Math.round((revenuPotentiel / prixRecommande) * 100) / 100
        : 0;

    let positionnement: "inférieur" | "aligné" | "supérieur" = "aligné";
    let positionnementDelta = 0;
    if (prixMarche > 0 && prixRecommande > 0) {
      positionnementDelta = Math.round(
        ((prixRecommande - prixMarche) / prixMarche) * 100,
      );
      if (positionnementDelta > 15) positionnement = "supérieur";
      else if (positionnementDelta < -15) positionnement = "inférieur";
    }

    const revenuMensuelEstime =
      nombreClients > 0 ? prixRecommande * nombreClients : 0;

    return {
      prixRecommande,
      prixPlancher,
      floorApplied,
      prixAjuste,
      multiplicateurProba,
      tiers,
      margeNette,
      roiClient,
      positionnement,
      positionnementDelta,
      revenuMensuelEstime,
    };
  }, [
    revenuPotentiel,
    dureeAccompagnement,
    coutDelivery,
    nombreClients,
    prixMarche,
    coutAcquisition,
    probabiliteResultat,
  ]);

  const getPositionnementIcon = () => {
    switch (calculations.positionnement) {
      case "supérieur":
        return <ArrowUpRight className="h-4 w-4 text-accent" />;
      case "inférieur":
        return <ArrowDownRight className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-blue-400" />;
    }
  };

  const getPositionnementColor = () => {
    switch (calculations.positionnement) {
      case "supérieur":
        return "text-accent";
      case "inférieur":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-accent" />
            Calculateur de Prix Automatique
          </CardTitle>
          <CardDescription>
            Renseigne les données de ton marché pour calculer le prix optimal de
            ton offre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className="h-3.5 w-3.5 text-text-muted" />
                Revenu potentiel du client (€)
              </Label>
              <Input
                type="number"
                value={revenuPotentiel || ""}
                onChange={(e) =>
                  setRevenuPotentiel(parseInt(e.target.value) || 0)
                }
                placeholder="Ex : 50000"
              />
              <p className="text-xs text-text-muted mt-1">
                Combien ton client peut gagner grâce à ton accompagnement
              </p>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-text-muted" />
                Durée d&apos;accompagnement (mois)
              </Label>
              <Input
                type="number"
                value={dureeAccompagnement || ""}
                onChange={(e) =>
                  setDureeAccompagnement(parseInt(e.target.value) || 1)
                }
                placeholder="Ex : 3"
                min={1}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-text-muted" />
                Coût de delivery (€)
              </Label>
              <Input
                type="number"
                value={coutDelivery || ""}
                onChange={(e) => setCoutDelivery(parseInt(e.target.value) || 0)}
                placeholder="Ex : 500"
              />
              <p className="text-xs text-text-muted mt-1">
                Ton coût réel pour délivrer le service
              </p>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Users className="h-3.5 w-3.5 text-text-muted" />
                Nombre de clients actuels
              </Label>
              <Input
                type="number"
                value={nombreClients || ""}
                onChange={(e) =>
                  setNombreClients(parseInt(e.target.value) || 0)
                }
                placeholder="Ex : 10"
                min={0}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Target className="h-3.5 w-3.5 text-text-muted" />
                Coût d&apos;acquisition client — CAC (€)
              </Label>
              <Input
                type="number"
                value={coutAcquisition || ""}
                onChange={(e) =>
                  setCoutAcquisition(parseInt(e.target.value) || 0)
                }
                placeholder="Ex : 200"
              />
              <p className="text-xs text-text-muted mt-1">
                Combien tu dépenses pour acquérir un client (ads, sales, etc.)
              </p>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-text-muted" />
                Probabilité de résultat (%)
              </Label>
              <Input
                type="number"
                value={probabiliteResultat || ""}
                onChange={(e) =>
                  setProbabiliteResultat(
                    Math.min(100, Math.max(1, parseInt(e.target.value) || 80)),
                  )
                }
                placeholder="Ex : 80"
                min={1}
                max={100}
              />
              <p className="text-xs text-text-muted mt-1">
                Probabilité que le client atteigne le résultat promis (ajuste le
                prix)
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Target className="h-3.5 w-3.5 text-text-muted" />
                Prix du marché — concurrents (€)
              </Label>
              <Input
                type="number"
                value={prixMarche || ""}
                onChange={(e) => setPrixMarche(parseInt(e.target.value) || 0)}
                placeholder="Ex : 3000"
              />
              <p className="text-xs text-text-muted mt-1">
                Le prix moyen pratiqué par tes concurrents directs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prix recommandé */}
      {revenuPotentiel > 0 && (
        <>
          <Card className="border-accent/30">
            <CardContent className="py-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-text-secondary">Prix recommandé</p>
                <p className="text-4xl font-bold text-accent">
                  {calculations.prixRecommande.toLocaleString("fr-FR")} €
                </p>
                <p className="text-xs text-text-muted">
                  = 10% × {revenuPotentiel.toLocaleString("fr-FR")} € ×{" "}
                  {calculations.multiplicateurProba * 100}% probabilité
                </p>
                {calculations.floorApplied && (
                  <p className="text-xs text-warning font-medium">
                    Plancher appliqué : (CAC{" "}
                    {coutAcquisition.toLocaleString("fr-FR")} € + Delivery{" "}
                    {coutDelivery.toLocaleString("fr-FR")} €) × 2 ={" "}
                    {calculations.prixPlancher.toLocaleString("fr-FR")} €
                  </p>
                )}
                {!calculations.floorApplied && coutAcquisition > 0 && (
                  <p className="text-xs text-text-muted">
                    Plancher (CAC + Delivery) × 2 ={" "}
                    {calculations.prixPlancher.toLocaleString("fr-FR")} € — non
                    appliqué
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3 Tiers */}
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(calculations.tiers).map(([key, tier]) => {
              const isRecommended = key === "premium";
              return (
                <Card
                  key={key}
                  className={cn(
                    "relative transition-all",
                    isRecommended &&
                      "border-accent/50 shadow-lg shadow-accent/5",
                  )}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="default">Recommandé</Badge>
                    </div>
                  )}
                  <CardContent className="py-6 text-center space-y-3">
                    <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                      {tier.name}
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-bold",
                        isRecommended ? "text-accent" : "text-text-primary",
                      )}
                    >
                      {tier.prix.toLocaleString("fr-FR")} €
                    </p>
                    <p className="text-xs text-text-muted">
                      {tier.description}
                    </p>
                    {nombreClients > 0 && (
                      <div className="pt-2 border-t border-border-default">
                        <p className="text-xs text-text-muted">
                          Revenu estimé :{" "}
                          {(tier.prix * nombreClients).toLocaleString("fr-FR")}{" "}
                          €/mois
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Marge Nette */}
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Marge nette</p>
                    <p
                      className={cn(
                        "text-xl font-bold",
                        calculations.margeNette >= 70
                          ? "text-accent"
                          : calculations.margeNette >= 40
                            ? "text-yellow-400"
                            : "text-red-400",
                      )}
                    >
                      {calculations.margeNette} %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ROI Client */}
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ChevronRight className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">ROI client</p>
                    <p className="text-xl font-bold text-blue-400">
                      x{calculations.roiClient}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Pour 1 € investi → {calculations.roiClient} € générés
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Positionnement */}
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    {getPositionnementIcon()}
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">
                      Positionnement vs marché
                    </p>
                    <p
                      className={cn(
                        "text-xl font-bold capitalize",
                        getPositionnementColor(),
                      )}
                    >
                      {calculations.positionnement}
                    </p>
                    {prixMarche > 0 && (
                      <p className="text-[10px] text-text-muted">
                        {calculations.positionnementDelta > 0 ? "+" : ""}
                        {calculations.positionnementDelta} % vs concurrents
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenu mensuel estimé */}
          {calculations.revenuMensuelEstime > 0 && (
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">
                        Revenu mensuel estimé (prix recommandé)
                      </p>
                      <p className="text-2xl font-bold text-accent">
                        {calculations.revenuMensuelEstime.toLocaleString(
                          "fr-FR",
                        )}{" "}
                        €
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Revenu annuel</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {(calculations.revenuMensuelEstime * 12).toLocaleString(
                        "fr-FR",
                      )}{" "}
                      €
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
