"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  Rocket,
  TrendingUp,
  Crown,
  Target,
  Zap,
  CheckCircle,
  Circle,
  ArrowRight,
} from "lucide-react";

// ─── Growth Tier Definitions ────────────────────────────────

interface GrowthTier {
  id: string;
  name: string;
  icon: React.ElementType;
  revenueMin: number;
  revenueMax: number;
  color: string;
  bgColor: string;
  checkpoints: string[];
  nextActions: string[];
}

const GROWTH_TIERS: GrowthTier[] = [
  {
    id: "launch",
    name: "Lancement",
    icon: Rocket,
    revenueMin: 0,
    revenueMax: 5000,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    checkpoints: [
      "Analyse de marche terminee",
      "Offre creee et validee",
      "Funnel de vente en place",
      "Premieres publicites lancees",
      "Premier client signe",
    ],
    nextActions: [
      "Optimise ton offre avec les retours clients",
      "Teste 3 angles publicitaires differents",
      "Mets en place un suivi des KPIs",
    ],
  },
  {
    id: "traction",
    name: "Traction",
    icon: TrendingUp,
    revenueMin: 5000,
    revenueMax: 10000,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    checkpoints: [
      "ROAS > 2x stable sur 7 jours",
      "Pipeline de vente regulier (5+ leads/semaine)",
      "Systeme de contenu en place",
      "Sequences email automatisees",
      "3+ temoignages clients",
    ],
    nextActions: [
      "Scale tes campagnes gagnantes (budget x2)",
      "Cree un systeme de referral",
      "Automatise le suivi prospect",
    ],
  },
  {
    id: "growth",
    name: "Croissance",
    icon: Target,
    revenueMin: 10000,
    revenueMax: 30000,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    checkpoints: [
      "CPA < 50EUR stable",
      "LTV/CAC > 3x",
      "Multi-canal (Meta + contenu organique)",
      "Equipe ou assistants en place",
      "Process de vente documente",
    ],
    nextActions: [
      "Diversifie tes canaux d'acquisition",
      "Lance une offre complementaire (OTO/upsell)",
      "Construis ton personal branding",
    ],
  },
  {
    id: "acceleration",
    name: "Acceleration",
    icon: Zap,
    revenueMin: 30000,
    revenueMax: 50000,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    checkpoints: [
      "Revenue previsible et recurrent",
      "Equipe de closers/setters en place",
      "Multiple offres/produits (front-end + back-end)",
      "Systeme de contenu organique automatise",
      "Processus de recrutement en place",
    ],
    nextActions: [
      "Developpe un programme de formation/certification",
      "Lance des campagnes sur un 2e canal (YouTube/TikTok)",
      "Mets en place un advisory board",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    icon: Crown,
    revenueMin: 50000,
    revenueMax: Infinity,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    checkpoints: [
      "Systeme qui tourne sans toi (automatisation complete)",
      "Equipe structuree (ops, marketing, vente)",
      "Multiple sources de revenus",
      "Communaute engagee (1000+ membres)",
      "Personal branding fort",
    ],
    nextActions: [
      "Cree une communaute payante premium",
      "Explore de nouveaux marches / international",
      "Envisage levee de fonds ou franchise",
    ],
  },
];

interface GrowthTiersProps {
  monthlyRevenue?: number;
  completedCheckpoints?: Record<string, string[]>;
}

export function GrowthTiers({
  monthlyRevenue = 0,
  completedCheckpoints = {},
}: GrowthTiersProps) {
  const currentTier = useMemo(() => {
    for (let i = GROWTH_TIERS.length - 1; i >= 0; i--) {
      if (monthlyRevenue >= GROWTH_TIERS[i].revenueMin) {
        return GROWTH_TIERS[i];
      }
    }
    return GROWTH_TIERS[0];
  }, [monthlyRevenue]);

  const progressToNext = useMemo(() => {
    const idx = GROWTH_TIERS.findIndex((t) => t.id === currentTier.id);
    if (idx >= GROWTH_TIERS.length - 1) return 100;
    const next = GROWTH_TIERS[idx + 1];
    const range = next.revenueMin - currentTier.revenueMin;
    const progress = monthlyRevenue - currentTier.revenueMin;
    return Math.min(100, Math.round((progress / range) * 100));
  }, [monthlyRevenue, currentTier]);

  return (
    <div className="space-y-6">
      {/* Current Tier Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentTier.icon className={cn("h-5 w-5", currentTier.color)} />
            Palier actuel : {currentTier.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Revenu mensuel : <strong className="text-text-primary">{monthlyRevenue.toLocaleString("fr-FR")}EUR</strong>
            </span>
            {currentTier.revenueMax < Infinity && (
              <span className="text-text-muted">
                Prochain palier : {currentTier.revenueMax.toLocaleString("fr-FR")}EUR
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="relative h-3 rounded-full bg-bg-primary overflow-hidden">
            <div
              className={cn("absolute inset-y-0 left-0 rounded-full transition-all", currentTier.bgColor.replace("/10", "/40"))}
              style={{ width: `${progressToNext}%` }}
            />
          </div>

          {/* Next actions */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Actions recommandees</p>
            <div className="space-y-2">
              {currentTier.nextActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", currentTier.color)} />
                  <p className="text-sm text-text-secondary">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Tiers */}
      <div className="grid gap-4 md:grid-cols-2">
        {GROWTH_TIERS.map((tier) => {
          const isActive = tier.id === currentTier.id;
          const isPast = GROWTH_TIERS.indexOf(tier) < GROWTH_TIERS.indexOf(currentTier);
          const completed = completedCheckpoints[tier.id] || [];

          return (
            <Card
              key={tier.id}
              className={cn(
                "transition-all",
                isActive && "ring-1 ring-accent/30",
                !isActive && !isPast && "opacity-60"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", tier.bgColor)}>
                      <tier.icon className={cn("h-4 w-4", tier.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tier.name}</p>
                      <p className="text-xs text-text-muted font-normal">
                        {tier.revenueMax < Infinity
                          ? `${tier.revenueMin.toLocaleString("fr-FR")} - ${tier.revenueMax.toLocaleString("fr-FR")}EUR/mois`
                          : `${tier.revenueMin.toLocaleString("fr-FR")}EUR+/mois`}
                      </p>
                    </div>
                  </div>
                  {isActive && <Badge variant="default">Actuel</Badge>}
                  {isPast && <Badge variant="muted">Complete</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {tier.checkpoints.map((cp, i) => {
                    const isDone = isPast || completed.includes(cp);
                    return (
                      <div key={i} className="flex items-start gap-2">
                        {isDone ? (
                          <CheckCircle className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                        )}
                        <p className={cn("text-xs", isDone ? "text-text-secondary" : "text-text-muted")}>
                          {cp}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
