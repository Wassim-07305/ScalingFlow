"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import type { OnboardingState, SituationDetails } from "@/stores/onboarding-store";
import { Rocket, Briefcase, Laptop, Building2 } from "lucide-react";

const SITUATIONS = [
  {
    value: "zero" as const,
    label: "Partir de zéro",
    desc: "Je n'ai pas encore de business en ligne.",
    icon: Rocket,
  },
  {
    value: "salarie" as const,
    label: "Salarié(e)",
    desc: "Je suis employé(e) et je veux me lancer.",
    icon: Briefcase,
  },
  {
    value: "freelance" as const,
    label: "Freelance",
    desc: "Je suis indépendant(e) et je veux scaler.",
    icon: Laptop,
  },
  {
    value: "entrepreneur" as const,
    label: "Entrepreneur",
    desc: "J'ai déjà un business en place.",
    icon: Building2,
  },
];

interface StepProps {
  store: OnboardingState;
}

export function StepSituation({ store }: StepProps) {
  const updateDetail = (key: keyof SituationDetails, value: string | number) => {
    store.setField("situationDetails", {
      ...store.situationDetails,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary">
          Quelle est ta situation actuelle ?
        </h2>
        <p className="text-text-secondary text-sm">
          Sélectionne la situation qui te correspond le mieux.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SITUATIONS.map((sit) => {
          const isSelected = store.situation === sit.value;
          return (
            <Card
              key={sit.value}
              className={cn(
                "cursor-pointer transition-all duration-200",
                isSelected
                  ? "border-accent bg-accent-muted"
                  : "hover:border-border-hover"
              )}
              onClick={() => store.setField("situation", sit.value)}
            >
              <div className="flex items-start gap-3">
                <sit.icon
                  className={cn(
                    "h-5 w-5 shrink-0 mt-0.5",
                    isSelected ? "text-accent" : "text-text-muted"
                  )}
                />
                <div>
                  <p className="font-semibold text-text-primary">
                    {sit.label}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {sit.desc}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sous-questions conditionnelles */}
      {store.situation === "zero" && (
        <div className="space-y-3 pt-2">
          <Label>Qu&apos;est-ce qui t&apos;attire dans l&apos;entrepreneuriat ?</Label>
          <Textarea
            value={store.situationDetails.biggest_challenge || ""}
            onChange={(e) => updateDetail("biggest_challenge", e.target.value)}
            placeholder="Liberté financière, indépendance, passion..."
            rows={3}
          />
        </div>
      )}

      {store.situation === "salarie" && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Ton poste actuel</Label>
            <Input
              value={store.situationDetails.poste || ""}
              onChange={(e) => updateDetail("poste", e.target.value)}
              placeholder="Ex: Chef de projet, Développeur..."
            />
          </div>
          <div className="space-y-2">
            <Label>Ton secteur</Label>
            <Input
              value={store.situationDetails.secteur || ""}
              onChange={(e) => updateDetail("secteur", e.target.value)}
              placeholder="Ex: Tech, Finance, Santé..."
            />
          </div>
        </div>
      )}

      {store.situation === "freelance" && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Tes missions principales</Label>
            <Input
              value={store.situationDetails.missions || ""}
              onChange={(e) => updateDetail("missions", e.target.value)}
              placeholder="Ex: Création de sites, consulting, design..."
            />
          </div>
          <div className="space-y-2">
            <Label>Ton plus gros challenge</Label>
            <Input
              value={store.situationDetails.biggest_challenge || ""}
              onChange={(e) => updateDetail("biggest_challenge", e.target.value)}
              placeholder="Ex: Trouver des clients, scaler, automatiser..."
            />
          </div>
        </div>
      )}

      {store.situation === "entrepreneur" && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CA mensuel actuel (EUR)</Label>
              <Input
                type="number"
                value={store.situationDetails.ca_actuel || ""}
                onChange={(e) => updateDetail("ca_actuel", Number(e.target.value))}
                placeholder="Ex: 5000"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de clients</Label>
              <Input
                type="number"
                value={store.situationDetails.clients_count || ""}
                onChange={(e) => updateDetail("clients_count", Number(e.target.value))}
                placeholder="Ex: 10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ton plus gros challenge</Label>
            <Input
              value={store.situationDetails.biggest_challenge || ""}
              onChange={(e) => updateDetail("biggest_challenge", e.target.value)}
              placeholder="Ex: Acquisition, rétention, pricing..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
