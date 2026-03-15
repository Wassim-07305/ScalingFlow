"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import {
  CheckCircle,
  Circle,
  Rocket,
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  BarChart3,
  Zap,
  ArrowUpRight,
  Trophy,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
interface KPI {
  name: string;
  target: string;
  alert: string;
}

interface Action {
  id: string;
  text: string;
}

interface DayGuide {
  day: string;
  title: string;
  objectif: string;
  actions: Action[];
  kpis: KPI[];
  category: "launch" | "analyse" | "optimisation" | "bilan" | "scale";
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  launch: {
    label: "Lancement",
    color: "text-blue-400",
    icon: <Rocket className="h-4 w-4" />,
  },
  analyse: {
    label: "Analyse",
    color: "text-purple-400",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  optimisation: {
    label: "Optimisation",
    color: "text-accent",
    icon: <Zap className="h-4 w-4" />,
  },
  bilan: {
    label: "Bilan",
    color: "text-yellow-400",
    icon: <Target className="h-4 w-4" />,
  },
  scale: {
    label: "Scale",
    color: "text-accent",
    icon: <ArrowUpRight className="h-4 w-4" />,
  },
};

// ─── Data ────────────────────────────────────────────────────
const TEN_DAY_GUIDE: DayGuide[] = [
  {
    day: "1-2",
    title: "Lancer les premières ads",
    objectif:
      "Mettre en ligne les premières publicités avec un budget test pour valider le marché et récolter les premières données.",
    actions: [
      { id: "d1-1", text: "Lancer 3 à 5 créatives différentes (angles variés)" },
      { id: "d1-2", text: "Budget test : 10-20€/jour maximum" },
      { id: "d1-3", text: "Vérifier que le pixel fire correctement sur chaque page" },
      { id: "d1-4", text: "Tester le funnel end-to-end (ad → landing → opt-in → merci)" },
      { id: "d1-5", text: "Vérifier les emails et SMS automatiques" },
    ],
    kpis: [
      { name: "CPM", target: "< 15€", alert: "> 25€ → audience trop petite ou contenu faible" },
      { name: "CTR", target: "> 1%", alert: "< 0.5% → changer le hook ou la créative" },
      { name: "CPC", target: "< 3€", alert: "> 5€ → revoir le ciblage" },
    ],
    category: "launch",
  },
  {
    day: "3-4",
    title: "Analyser les premiers résultats",
    objectif:
      "Identifier les créatives gagnantes et couper celles qui ne performent pas. Commencer à optimiser.",
    actions: [
      { id: "d3-1", text: "Analyser le CTR par créative (après 1000+ impressions)" },
      { id: "d3-2", text: "Pauser les créatives avec CTR < 0.8%" },
      { id: "d3-3", text: "Dupliquer la meilleure créative avec un nouvel angle" },
      { id: "d3-4", text: "Vérifier le taux de conversion de la landing page" },
      { id: "d3-5", text: "Ajuster les textes si le CTR est bon mais la conversion faible" },
    ],
    kpis: [
      {
        name: "CVR Landing",
        target: "> 20%",
        alert: "< 10% → problème de message match ou d'UX",
      },
      { name: "CPL", target: "< 10€", alert: "> 15€ → revoir offre ou ciblage" },
      {
        name: "Taux d'ouverture emails",
        target: "> 30%",
        alert: "< 20% → revoir l'objet des emails",
      },
    ],
    category: "analyse",
  },
  {
    day: "5-6",
    title: "Optimiser le funnel",
    objectif:
      "Maximiser le taux de conversion à chaque étape du funnel. Relancer les leads non-convertis.",
    actions: [
      { id: "d5-1", text: "A/B tester le headline de la landing page" },
      { id: "d5-2", text: "Optimiser le CTA (couleur, texte, placement)" },
      { id: "d5-3", text: "Envoyer un DM personnalisé aux leads chauds" },
      { id: "d5-4", text: "Tester une nouvelle audience (LAL ou intérêts différents)" },
      { id: "d5-5", text: "Vérifier les séquences de relance SMS" },
    ],
    kpis: [
      {
        name: "CVR opt-in",
        target: "> 20%",
        alert: "< 15% → le lead magnet n'est pas assez attractif",
      },
      {
        name: "Taux de réponse DM",
        target: "> 10%",
        alert: "< 5% → personnaliser davantage le message",
      },
      {
        name: "Coût par RDV",
        target: "< 30€",
        alert: "> 50€ → revoir la qualification des leads",
      },
    ],
    category: "optimisation",
  },
  {
    day: "7",
    title: "Premier bilan",
    objectif:
      "Analyser le ROAS, compiler les learnings et prendre une décision : continuer, ajuster ou pivoter.",
    actions: [
      { id: "d7-1", text: "Compiler tous les KPIs : dépense, leads, CPL, ROAS" },
      { id: "d7-2", text: "Identifier le meilleur angle / créative / audience" },
      { id: "d7-3", text: "Comparer les résultats aux benchmarks du secteur" },
      { id: "d7-4", text: "Couper les ads perdantes (ROAS < 0.5x)" },
      { id: "d7-5", text: "Décider : scaler les gagnantes ou pivoter la stratégie" },
    ],
    kpis: [
      { name: "ROAS", target: "> 1x", alert: "< 0.5x → pivoter l'offre ou l'angle" },
      {
        name: "CAC",
        target: "< 50% du panier moyen",
        alert: "> panier moyen → non viable",
      },
      {
        name: "Qualité des leads",
        target: "> 30% qualifiés",
        alert: "< 15% → problème de ciblage",
      },
    ],
    category: "bilan",
  },
  {
    day: "8-9",
    title: "Scaler les ads gagnantes",
    objectif:
      "Augmenter progressivement le budget sur les créatives gagnantes et ajouter de nouvelles variations.",
    actions: [
      { id: "d8-1", text: "Augmenter le budget de +20% sur les ads gagnantes" },
      { id: "d8-2", text: "Créer 2-3 nouvelles créatives basées sur les learnings" },
      { id: "d8-3", text: "Tester de nouvelles audiences lookalike" },
      { id: "d8-4", text: "Lancer du retargeting sur les visiteurs du funnel" },
      { id: "d8-5", text: "Optimiser la séquence email (changer les mails faibles)" },
    ],
    kpis: [
      {
        name: "ROAS",
        target: "> 2x",
        alert: "< 1x après scale → réduire le budget",
      },
      {
        name: "Fréquence",
        target: "< 2.5",
        alert: "> 3 → ad fatigue, changer la créative",
      },
      {
        name: "CPL après scale",
        target: "Stable ±20%",
        alert: "CPL x2 → trop rapide, réduire le budget",
      },
    ],
    category: "scale",
  },
  {
    day: "10",
    title: "Bilan complet",
    objectif:
      "Documenter tous les résultats, valider la stratégie et planifier la phase 2 de scaling.",
    actions: [
      { id: "d10-1", text: "Rapport complet des 10 jours (tous les KPIs)" },
      { id: "d10-2", text: "Identifier les 3 winners (créative, audience, angle)" },
      { id: "d10-3", text: "Calculer le ROI global de la phase test" },
      { id: "d10-4", text: "Planifier le budget semaine 2 et les nouvelles créatives" },
      { id: "d10-5", text: "Mettre à jour le dashboard ScalingFlow avec les résultats" },
    ],
    kpis: [
      {
        name: "ROI global",
        target: "> 1x",
        alert: "< 0.5x → revoir l'offre fondamentalement",
      },
      {
        name: "Nombre de leads",
        target: "> 30",
        alert: "< 10 → budget ou ciblage insuffisant",
      },
      {
        name: "Taux closing",
        target: "> 5%",
        alert: "< 2% → problème de qualité leads ou de vente",
      },
    ],
    category: "bilan",
  },
];

const STORAGE_KEY = "scalingflow-ten-day-guide";

// ─── Component ───────────────────────────────────────────────
export function TenDayGuide() {
  const { user } = useUser();
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    new Set()
  );
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [ready, setReady] = useState(false);

  // Load from localStorage
  useEffect(() => {
    if (!user) return;
    const key = `${STORAGE_KEY}-${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setCompletedActions(new Set(JSON.parse(saved)));
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, [user]);

  const toggleAction = (actionId: string) => {
    setCompletedActions((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      if (user) {
        localStorage.setItem(
          `${STORAGE_KEY}-${user.id}`,
          JSON.stringify([...next])
        );
      }
      return next;
    });
  };

  const totalActions = TEN_DAY_GUIDE.reduce(
    (acc, d) => acc + d.actions.length,
    0
  );
  const completedCount = completedActions.size;
  const progressPct = Math.round((completedCount / totalActions) * 100);
  const allDone = completedCount === totalActions;

  if (!ready) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-52 bg-bg-tertiary rounded animate-pulse" />
                  <div className="h-3 w-80 bg-bg-tertiary rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeDay = TEN_DAY_GUIDE[activeDayIndex];
  const activeCat = CATEGORY_CONFIG[activeDay.category];

  return (
    <div className="space-y-6">
      {/* All done banner */}
      {allDone && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center gap-3">
              <Trophy className="h-10 w-10 text-accent" />
              <div>
                <h3 className="text-lg font-bold text-accent">
                  10 jours complétés !
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Bravo ! Tu as terminé la phase de lancement. Place au scaling.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress bar */}
      <Card className="border-accent/20">
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-accent" />
              <div>
                <p className="font-semibold text-text-primary">
                  Guide des 10 premiers jours
                </p>
                <p className="text-xs text-text-muted">
                  {completedCount} / {totalActions} actions complétées
                </p>
              </div>
            </div>
            <Badge
              variant={
                progressPct >= 100
                  ? "default"
                  : progressPct >= 50
                    ? "blue"
                    : "muted"
              }
            >
              {progressPct}%
            </Badge>
          </div>
          <Progress value={progressPct} />
        </CardContent>
      </Card>

      {/* Timeline selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TEN_DAY_GUIDE.map((day, idx) => {
          const dayDone = day.actions.every((a) =>
            completedActions.has(a.id)
          );
          const dayPartial = day.actions.some((a) =>
            completedActions.has(a.id)
          );
          const cat = CATEGORY_CONFIG[day.category];

          return (
            <button
              key={day.day}
              onClick={() => setActiveDayIndex(idx)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                activeDayIndex === idx
                  ? "bg-accent text-white"
                  : dayDone
                    ? "bg-accent/20 text-accent"
                    : dayPartial
                      ? "bg-bg-tertiary text-text-primary"
                      : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              {dayDone ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>J{day.day}</span>
              {activeDayIndex !== idx && (
                <span className={cn("text-xs", cat.color)}>
                  {cat.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active day card */}
      <div className="space-y-4">
        {/* Header */}
        <Card className="border-accent/20">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
                  "bg-accent/10"
                )}
              >
                {activeCat.icon}
                <span className="sr-only">{activeCat.label}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Jour {activeDay.day} — {activeDay.title}
                  </h3>
                  <Badge variant="muted" className={cn("text-xs", activeCat.color)}>
                    {activeCat.label}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent shrink-0" />
                  {activeDay.objectif}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            Actions concrètes
          </h4>
          <div className="space-y-2">
            {activeDay.actions.map((action) => {
              const done = completedActions.has(action.id);
              return (
                <Card
                  key={action.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-accent/20",
                    done && "border-accent/30 bg-accent/5"
                  )}
                  onClick={() => toggleAction(action.id)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-text-muted shrink-0" />
                      )}
                      <p
                        className={cn(
                          "text-sm",
                          done
                            ? "text-accent line-through"
                            : "text-text-primary"
                        )}
                      >
                        {action.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* KPIs */}
        {activeDay.kpis.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              KPIs à surveiller
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeDay.kpis.map((kpi) => (
                <Card key={kpi.name}>
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="blue" className="text-xs">
                          {kpi.name}
                        </Badge>
                        <span className="text-sm font-bold text-accent">
                          {kpi.target}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300">{kpi.alert}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
