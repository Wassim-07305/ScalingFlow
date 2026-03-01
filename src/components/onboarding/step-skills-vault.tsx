"use client";

import { cn } from "@/lib/utils/cn";
import type { OnboardingState, VaultSkillCategory } from "@/stores/onboarding-store";
import {
  Megaphone,
  HandCoins,
  PenTool,
  Cpu,
  Palette,
  BarChart3,
} from "lucide-react";

const SKILL_CATEGORIES = [
  { name: "Marketing Digital", icon: Megaphone },
  { name: "Vente & Closing", icon: HandCoins },
  { name: "Copywriting", icon: PenTool },
  { name: "Tech & Automatisation", icon: Cpu },
  { name: "Design & Créatif", icon: Palette },
  { name: "Business & Stratégie", icon: BarChart3 },
];

const LEVELS: { value: VaultSkillCategory["level"]; label: string }[] = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "avance", label: "Avancé" },
];

interface StepProps {
  store: OnboardingState;
}

export function StepSkillsVault({ store }: StepProps) {
  const getSkillLevel = (name: string): VaultSkillCategory["level"] | null => {
    const found = store.vaultSkills.find((s) => s.name === name);
    return found ? found.level : null;
  };

  const setSkillLevel = (name: string, level: VaultSkillCategory["level"]) => {
    const existing = store.vaultSkills.filter((s) => s.name !== name);
    const currentLevel = getSkillLevel(name);

    // Si on clique sur le meme niveau, on deselectionne
    if (currentLevel === level) {
      store.setField("vaultSkills", existing);
    } else {
      store.setField("vaultSkills", [...existing, { name, level }]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary">
          Évalue tes compétences
        </h2>
        <p className="text-text-secondary text-sm">
          Pour chaque catégorie, sélectionne ton niveau actuel.
        </p>
      </div>

      <div className="space-y-3">
        {SKILL_CATEGORIES.map((cat) => {
          const currentLevel = getSkillLevel(cat.name);
          const isSelected = currentLevel !== null;

          return (
            <div
              key={cat.name}
              className={cn(
                "rounded-[12px] border p-4 transition-all duration-200",
                isSelected
                  ? "border-accent/50 bg-bg-secondary"
                  : "border-border-default bg-bg-secondary"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <cat.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isSelected ? "text-accent" : "text-text-muted"
                  )}
                />
                <span className="text-sm font-semibold text-text-primary">
                  {cat.name}
                </span>
              </div>

              <div className="flex gap-2">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    onClick={() => setSkillLevel(cat.name, lvl.value)}
                    className={cn(
                      "flex-1 rounded-[8px] border px-3 py-2 text-xs font-medium transition-all duration-200",
                      currentLevel === lvl.value
                        ? "border-accent bg-accent-muted text-accent"
                        : "border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary"
                    )}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
