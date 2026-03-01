"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { OnboardingState } from "@/stores/onboarding-store";

const OBJECTIVES = [
  "Trouver ma niche",
  "Créer une offre irrésistible",
  "Générer des leads",
  "Lancer des pubs Meta",
  "Créer un funnel de vente",
  "Scaler mon activité",
  "Structurer mon delivery",
  "Automatiser mon business",
];

const DEADLINES = [
  { value: "1 mois", label: "1 mois" },
  { value: "3 mois", label: "3 mois" },
  { value: "6 mois", label: "6 mois" },
  { value: "12 mois", label: "12 mois" },
];

interface StepProps {
  store: OnboardingState;
  toggleArrayItem: (
    key: "skills" | "industries" | "objectives" | "formations",
    item: string
  ) => void;
}

export function StepObjectives({ store, toggleArrayItem }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary">
          Tes objectifs & contraintes
        </h2>
        <p className="text-text-secondary text-sm">
          Sélectionne tes objectifs principaux et définis tes contraintes.
        </p>
      </div>

      {/* Objectifs multi-select */}
      <div className="space-y-3">
        <Label>Objectifs</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OBJECTIVES.map((obj) => {
            const isSelected = store.objectives.includes(obj);
            return (
              <button
                key={obj}
                onClick={() => toggleArrayItem("objectives", obj)}
                className={cn(
                  "rounded-[8px] border p-3 text-left text-sm font-medium transition-all duration-200",
                  isSelected
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border-default text-text-secondary hover:border-border-hover"
                )}
              >
                {obj}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contraintes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Heures / semaine</Label>
          <Input
            type="number"
            min={1}
            max={80}
            value={store.hoursPerWeek || ""}
            onChange={(e) =>
              store.setField("hoursPerWeek", Number(e.target.value))
            }
            placeholder="Ex: 20"
          />
        </div>

        <div className="space-y-2">
          <Label>Deadline</Label>
          <Select
            value={store.deadline}
            onValueChange={(value) => store.setField("deadline", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisis un délai" />
            </SelectTrigger>
            <SelectContent>
              {DEADLINES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Taille d&apos;équipe</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={store.teamSize || ""}
            onChange={(e) =>
              store.setField("teamSize", Number(e.target.value))
            }
            placeholder="Ex: 1"
          />
        </div>
      </div>
    </div>
  );
}
