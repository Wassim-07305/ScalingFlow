"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Lock, CheckCircle } from "lucide-react";

const MOCK_MODULES = [
  {
    id: 1,
    title: "Les Fondamentaux du Scaling",
    description: "Comprends les principes qui permettent de passer de freelance à entrepreneur IA.",
    lessons: 8,
    completed: 8,
    duration: "2h30",
    status: "completed" as const,
  },
  {
    id: 2,
    title: "Créer une Offre Irrésistible",
    description: "Mécanisme unique, pricing, garanties, et positionnement premium.",
    lessons: 12,
    completed: 7,
    duration: "4h15",
    status: "in_progress" as const,
  },
  {
    id: 3,
    title: "Construire ton Funnel",
    description: "Opt-in, VSL, page de vente : tout le parcours de conversion.",
    lessons: 10,
    completed: 0,
    duration: "3h45",
    status: "unlocked" as const,
  },
  {
    id: 4,
    title: "Maîtriser la Publicité Meta",
    description: "Créatives, audiences, scaling et optimisation de campagnes.",
    lessons: 15,
    completed: 0,
    duration: "5h",
    status: "unlocked" as const,
  },
  {
    id: 5,
    title: "Automatiser avec l'IA",
    description: "Agents IA, workflows, et automatisations pour ton business.",
    lessons: 10,
    completed: 0,
    duration: "3h30",
    status: "locked" as const,
  },
  {
    id: 6,
    title: "Vendre en High-Ticket",
    description: "Scripts de vente, objection handling, et closing avancé.",
    lessons: 8,
    completed: 0,
    duration: "2h45",
    status: "locked" as const,
  },
];

interface ModuleListProps {
  className?: string;
}

export function ModuleList({ className }: ModuleListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {MOCK_MODULES.map((mod) => {
        const progress = mod.lessons > 0 ? (mod.completed / mod.lessons) * 100 : 0;

        return (
          <Card
            key={mod.id}
            className={cn(
              "cursor-pointer transition-all hover:border-border-hover",
              mod.status === "locked" && "opacity-60"
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                  mod.status === "completed" ? "bg-accent/15" :
                  mod.status === "in_progress" ? "bg-accent/15" :
                  mod.status === "locked" ? "bg-bg-tertiary" : "bg-info/15"
                )}>
                  {mod.status === "completed" ? (
                    <CheckCircle className="h-6 w-6 text-accent" />
                  ) : mod.status === "locked" ? (
                    <Lock className="h-6 w-6 text-text-muted" />
                  ) : (
                    <PlayCircle className="h-6 w-6 text-accent" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text-primary">{mod.title}</h3>
                    {mod.status === "in_progress" && (
                      <Badge variant="default">En cours</Badge>
                    )}
                    {mod.status === "completed" && (
                      <Badge variant="cyan">Terminé</Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{mod.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-muted">{mod.lessons} leçons</span>
                    <span className="text-xs text-text-muted">{mod.duration}</span>
                    {mod.status !== "locked" && (
                      <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                        <Progress value={progress} className="h-1.5" />
                        <span className="text-xs text-text-muted">{Math.round(progress)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
