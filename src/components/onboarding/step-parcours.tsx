"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { OnboardingState } from "@/stores/onboarding-store";
import { Rocket, ArrowRightLeft, TrendingUp, Repeat, Compass } from "lucide-react";

const PARCOURS = [
  {
    value: "A1" as const,
    label: "Partir de Zéro",
    desc: "Tu n'as jamais lancé de business en ligne.",
    icon: Rocket,
    color: "cyan",
  },
  {
    value: "A2" as const,
    label: "Salarié → Freelance",
    desc: "Tu veux quitter ton job pour te lancer.",
    icon: ArrowRightLeft,
    color: "blue",
  },
  {
    value: "A3" as const,
    label: "Freelance → Entrepreneur",
    desc: "Tu es freelance et veux scaler.",
    icon: TrendingUp,
    color: "purple",
  },
  {
    value: "B" as const,
    label: "Scaler",
    desc: "Tu as déjà un business et veux passer au niveau supérieur.",
    icon: TrendingUp,
    color: "default",
  },
  {
    value: "C" as const,
    label: "Pivoter",
    desc: "Tu veux changer de niche ou repositionner ton offre.",
    icon: Compass,
    color: "yellow",
  },
];

interface StepProps {
  store: OnboardingState;
}

export function StepParcours({ store }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary">
          Quel parcours te correspond ?
        </h2>
        <p className="text-text-secondary text-sm">
          Choisis le parcours qui décrit le mieux ta situation.
          L&apos;IA adaptera son accompagnement en conséquence.
        </p>
      </div>

      <div className="grid gap-3">
        {PARCOURS.map((p) => {
          const isSelected = store.parcours === p.value;
          return (
            <Card
              key={p.value}
              className={cn(
                "cursor-pointer transition-all duration-200",
                isSelected
                  ? "border-accent bg-accent-muted"
                  : "hover:border-border-hover"
              )}
              onClick={() => store.setField("parcours", p.value)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <p.icon
                    className={cn(
                      "h-5 w-5 shrink-0 mt-0.5",
                      isSelected ? "text-accent" : "text-text-muted"
                    )}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary">
                        {p.label}
                      </p>
                      <Badge variant={p.color as "cyan" | "blue" | "purple" | "default" | "yellow"}>
                        {p.value}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
