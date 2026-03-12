"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import {
  Rocket,
  CheckCircle,
  Circle,
  TrendingUp,
  Target,
  Clock,
  Code2,
} from "lucide-react";
import { PixelCAPIGenerator } from "@/components/launch/pixel-capi-generator";

interface DayTask {
  id: string;
  task: string;
  description: string;
  kpi?: string;
  target?: string;
  category: "setup" | "monitoring" | "optimization" | "analysis";
}

const LAUNCH_GUIDE: {
  day: number;
  title: string;
  focus: string;
  tasks: DayTask[];
}[] = [
  {
    day: 1,
    title: "Jour 1 — Lancement & Vérification",
    focus: "S'assurer que tout fonctionne",
    tasks: [
      {
        id: "1-1",
        task: "Vérifier que les ads sont en diffusion",
        description:
          "Vérifier dans Ads Manager que les campagnes sont bien actives et en learning phase.",
        category: "setup",
      },
      {
        id: "1-2",
        task: "Checker le pixel / tracking",
        description:
          "S'assurer que le pixel Meta fire correctement sur les pages du funnel.",
        category: "setup",
      },
      {
        id: "1-3",
        task: "Tester le funnel end-to-end",
        description:
          "Faire un test complet : clic ad → landing → opt-in → thank you page.",
        category: "setup",
      },
      {
        id: "1-4",
        task: "Vérifier les emails automatiques",
        description:
          "S'assurer que la séquence email se déclenche après l'opt-in.",
        category: "setup",
      },
    ],
  },
  {
    day: 2,
    title: "Jour 2 — Premières données",
    focus: "Observer sans toucher",
    tasks: [
      {
        id: "2-1",
        task: "Noter les premiers KPIs",
        description:
          "CPM, CTR, CPC — ne pas paniquer, laisser l'algo apprendre.",
        kpi: "CPM",
        target: "< 20€",
        category: "monitoring",
      },
      {
        id: "2-2",
        task: "Vérifier les leads entrants",
        description:
          "Y a-t-il des opt-ins ? Vérifier dans le CRM/email.",
        kpi: "Leads",
        target: "1-3 leads",
        category: "monitoring",
      },
      {
        id: "2-3",
        task: "Checker les taux d'ouverture email",
        description:
          "Premiers emails de la séquence : taux d'ouverture correct ?",
        kpi: "Open rate",
        target: "> 30%",
        category: "monitoring",
      },
    ],
  },
  {
    day: 3,
    title: "Jour 3 — Analyse rapide",
    focus: "Premiers ajustements légers",
    tasks: [
      {
        id: "3-1",
        task: "Analyser le CTR par créative",
        description:
          "Identifier les creatives qui performent vs celles qui sont faibles.",
        kpi: "CTR",
        target: "> 1%",
        category: "analysis",
      },
      {
        id: "3-2",
        task: "Vérifier le CPC",
        description: "Le CPC est-il dans la fourchette attendue ?",
        kpi: "CPC",
        target: "< 3€",
        category: "monitoring",
      },
      {
        id: "3-3",
        task: "Analyser la landing page",
        description:
          "Taux de conversion landing page. Si < 20%, optimiser.",
        kpi: "CVR Landing",
        target: "> 20%",
        category: "analysis",
      },
    ],
  },
  {
    day: 4,
    title: "Jour 4 — Optimisation créatives",
    focus: "Couper les perdants",
    tasks: [
      {
        id: "4-1",
        task: "Pauser les créatives < 0.8% CTR",
        description:
          "Après 1000+ impressions, couper les creatives qui ne performent pas.",
        category: "optimization",
      },
      {
        id: "4-2",
        task: "Dupliquer la meilleure créative",
        description:
          "Prendre la meilleure et la tester avec un angle légèrement différent.",
        category: "optimization",
      },
      {
        id: "4-3",
        task: "Vérifier le CPL",
        description: "Coût par lead. Est-il viable ?",
        kpi: "CPL",
        target: "< 10€",
        category: "monitoring",
      },
    ],
  },
  {
    day: 5,
    title: "Jour 5 — Point mi-parcours",
    focus: "Bilan des 5 premiers jours",
    tasks: [
      {
        id: "5-1",
        task: "Calculer le ROAS préliminaire",
        description: "Combien de revenue vs dépense pub.",
        kpi: "ROAS",
        target: "> 1x",
        category: "analysis",
      },
      {
        id: "5-2",
        task: "Analyser la qualité des leads",
        description:
          "Les leads sont-ils qualifiés ? Répondent-ils aux emails ?",
        category: "analysis",
      },
      {
        id: "5-3",
        task: "Ajuster le budget si nécessaire",
        description:
          "Si les résultats sont bons, augmenter de 20%. Si mauvais, réduire.",
        category: "optimization",
      },
    ],
  },
  {
    day: 6,
    title: "Jour 6 — Nurture & Follow-up",
    focus: "Maximiser les conversions",
    tasks: [
      {
        id: "6-1",
        task: "Relancer les leads non-convertis",
        description:
          "Envoyer un DM ou email personnalisé aux leads chauds.",
        category: "optimization",
      },
      {
        id: "6-2",
        task: "Tester une nouvelle audience",
        description:
          "Dupliquer la campagne avec une audience LAL ou intérêt différent.",
        category: "optimization",
      },
      {
        id: "6-3",
        task: "Vérifier les séquences SMS",
        description:
          "Les SMS de relance se déclenchent-ils correctement ?",
        category: "monitoring",
      },
    ],
  },
  {
    day: 7,
    title: "Jour 7 — Bilan semaine 1",
    focus: "Décision : continuer, ajuster ou pivoter",
    tasks: [
      {
        id: "7-1",
        task: "Rapport hebdomadaire complet",
        description:
          "Compiler tous les KPIs : spend, leads, CPL, ROAS, conversion rates.",
        category: "analysis",
      },
      {
        id: "7-2",
        task: "Comparer aux benchmarks",
        description:
          "Est-ce que tes résultats sont au-dessus ou en-dessous des standards ?",
        category: "analysis",
      },
      {
        id: "7-3",
        task: "Décision stratégique",
        description:
          "Continuer sans changement, ajuster la stratégie, ou pivoter complètement.",
        category: "optimization",
      },
    ],
  },
  {
    day: 8,
    title: "Jour 8 — Scale ou Pivot",
    focus: "Appliquer les décisions du jour 7",
    tasks: [
      {
        id: "8-1",
        task: "Implémenter les changements décidés",
        description:
          "Nouvelles creatives, nouveaux angles, nouvelles audiences.",
        category: "optimization",
      },
      {
        id: "8-2",
        task: "Lancer les nouvelles créatives",
        description:
          "Au moins 2-3 nouvelles variations basées sur les learnings.",
        category: "optimization",
      },
    ],
  },
  {
    day: 9,
    title: "Jour 9 — Affinage",
    focus: "Optimisations granulaires",
    tasks: [
      {
        id: "9-1",
        task: "A/B test landing page",
        description:
          "Tester un nouveau headline ou CTA sur la landing page.",
        category: "optimization",
      },
      {
        id: "9-2",
        task: "Optimiser la séquence email",
        description:
          "Modifier les emails qui ont un faible taux d'ouverture.",
        category: "optimization",
      },
      {
        id: "9-3",
        task: "Analyser les heures de diffusion",
        description:
          "Les ads performent mieux à quelle heure ? Ajuster le scheduling.",
        category: "analysis",
      },
    ],
  },
  {
    day: 10,
    title: "Jour 10 — Bilan & Next Steps",
    focus: "Préparer la phase de scale",
    tasks: [
      {
        id: "10-1",
        task: "Rapport complet des 10 jours",
        description:
          "Tous les KPIs, learnings, et décisions documentés.",
        category: "analysis",
      },
      {
        id: "10-2",
        task: "Identifier les winners",
        description:
          "Quelle creative, audience, et angle fonctionnent le mieux ?",
        category: "analysis",
      },
      {
        id: "10-3",
        task: "Plan de scale semaine 2",
        description:
          "Budget, nouvelles audiences, nouvelles creatives à tester.",
        category: "optimization",
      },
      {
        id: "10-4",
        task: "Mettre à jour le dashboard ScalingFlow",
        description:
          "Renseigner tous les résultats dans l'outil pour le suivi long-terme.",
        category: "setup",
      },
    ],
  },
];

const CATEGORY_STYLES: Record<string, { label: string; color: string }> = {
  setup: { label: "Setup", color: "text-blue-400" },
  monitoring: { label: "Monitoring", color: "text-yellow-400" },
  optimization: { label: "Optimisation", color: "text-accent" },
  analysis: { label: "Analyse", color: "text-purple-400" },
};

export default function LaunchGuidePage() {
  const { user } = useUser();
  const [completedTasks, setCompletedTasks] = React.useState<Set<string>>(
    new Set()
  );
  const [activeDay, setActiveDay] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<"guide" | "pixel">("guide");
  const [loading, setLoading] = React.useState(true);

  // Charger les taches completees depuis localStorage
  React.useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`launch-guide-${user.id}`);
    if (saved) {
      setCompletedTasks(new Set(JSON.parse(saved)));
    }
    setLoading(false);
  }, [user]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      // Sauvegarder dans localStorage
      if (user) {
        localStorage.setItem(
          `launch-guide-${user.id}`,
          JSON.stringify([...next])
        );
      }
      return next;
    });
  };

  const totalTasks = LAUNCH_GUIDE.reduce(
    (acc, day) => acc + day.tasks.length,
    0
  );
  const completedCount = completedTasks.size;
  const progressPct = Math.round((completedCount / totalTasks) * 100);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Guide de Lancement"
          description="Tes 10 premiers jours après le lancement."
        />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Guide de Lancement"
        description="Tes 10 premiers jours après le lancement de tes ads."
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("guide")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            activeTab === "guide"
              ? "bg-accent text-white"
              : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
          )}
        >
          <Rocket className="h-4 w-4" />
          Guide 10 jours
        </button>
        <button
          onClick={() => setActiveTab("pixel")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            activeTab === "pixel"
              ? "bg-accent text-white"
              : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
          )}
        >
          <Code2 className="h-4 w-4" />
          Pixel & CAPI
        </button>
      </div>

      {activeTab === "pixel" && <PixelCAPIGenerator />}

      {activeTab === "guide" && (
      <>
      {/* Banniere de progression */}
      <Card className="mb-6 border-accent/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-accent" />
              <div>
                <p className="font-semibold text-text-primary">
                  Progression du lancement
                </p>
                <p className="text-xs text-text-muted">
                  {completedCount} / {totalTasks} tâches complétées
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
          <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selecteur de jour */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {LAUNCH_GUIDE.map((day) => {
          const dayCompleted = day.tasks.every((t) =>
            completedTasks.has(t.id)
          );
          const dayPartial = day.tasks.some((t) =>
            completedTasks.has(t.id)
          );
          return (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                activeDay === day.day
                  ? "bg-accent text-white"
                  : dayCompleted
                    ? "bg-accent/20 text-accent"
                    : dayPartial
                      ? "bg-bg-tertiary text-text-primary"
                      : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              {dayCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              J{day.day}
            </button>
          );
        })}
      </div>

      {/* Contenu du jour */}
      {LAUNCH_GUIDE.filter((d) => d.day === activeDay).map((day) => (
        <div key={day.day} className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-text-primary">
              {day.title}
            </h3>
            <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
              <Target className="h-4 w-4 text-accent" />
              Focus : {day.focus}
            </p>
          </div>

          {day.tasks.map((task) => {
            const isCompleted = completedTasks.has(task.id);
            const catStyle = CATEGORY_STYLES[task.category];

            return (
              <Card
                key={task.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-accent/20",
                  isCompleted && "border-accent/30 bg-accent/5"
                )}
                onClick={() => toggleTask(task.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-accent" />
                      ) : (
                        <Circle className="h-5 w-5 text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isCompleted
                              ? "text-accent line-through"
                              : "text-text-primary"
                          )}
                        >
                          {task.task}
                        </p>
                        <Badge
                          variant="muted"
                          className={cn("text-xs", catStyle.color)}
                        >
                          {catStyle.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {task.description}
                      </p>
                      {task.kpi && (
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="blue" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {task.kpi}
                          </Badge>
                          {task.target && (
                            <span className="text-xs text-accent font-medium">
                              Objectif : {task.target}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
      </>
      )}
    </div>
  );
}
