"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Lock, Trophy } from "lucide-react";

const MILESTONES = [
  { id: 1, title: "Profil complété", description: "Onboarding terminé", status: "completed" as const, xp: 100 },
  { id: 2, title: "Marché validé", description: "Score viabilité > 70", status: "completed" as const, xp: 200 },
  { id: 3, title: "Offre créée", description: "Offre générée et validée", status: "completed" as const, xp: 300 },
  { id: 4, title: "Funnel construit", description: "3 pages de funnel prêtes", status: "in_progress" as const, xp: 400 },
  { id: 5, title: "1er Lead", description: "Premier lead capturé", status: "locked" as const, xp: 500 },
  { id: 6, title: "1ère Vente", description: "Premier client converti", status: "locked" as const, xp: 1000 },
  { id: 7, title: "5K€/mois", description: "Atteindre 5 000€ de MRR", status: "locked" as const, xp: 2000 },
  { id: 8, title: "10K€/mois", description: "Atteindre 10 000€ de MRR", status: "locked" as const, xp: 5000 },
];

interface MilestoneTrackerProps {
  className?: string;
}

export function MilestoneTracker({ className }: MilestoneTrackerProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border-default" />
          <div className="space-y-4">
            {MILESTONES.map((milestone) => (
              <div key={milestone.id} className="relative flex items-start gap-4 pl-12">
                <div className="absolute left-2.5">
                  {milestone.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-accent" />
                  ) : milestone.status === "in_progress" ? (
                    <Circle className="h-5 w-5 text-accent animate-pulse" />
                  ) : (
                    <Lock className="h-5 w-5 text-text-muted" />
                  )}
                </div>
                <div className={cn(
                  "flex-1 p-3 rounded-xl",
                  milestone.status === "completed" ? "bg-accent/5 border border-accent/20" :
                  milestone.status === "in_progress" ? "bg-accent/5 border border-accent/20" :
                  "bg-bg-tertiary border border-border-default opacity-60"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-text-primary text-sm">{milestone.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{milestone.description}</p>
                    </div>
                    <Badge variant={milestone.status === "completed" ? "cyan" : "muted"}>
                      +{milestone.xp} XP
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
