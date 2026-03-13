"use client";

import {
  MessageSquare,
  HandCoins,
  PenTool,
  Megaphone,
  Users,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { VaultSkillCategory } from "@/stores/onboarding-store";

const CATEGORIES = [
  { name: "Acquisition & Prospection", icon: MessageSquare },
  { name: "Vente & Closing", icon: HandCoins },
  { name: "Creation de contenu", icon: PenTool },
  { name: "Marketing & Ads", icon: Megaphone },
  { name: "Delivery & Gestion client", icon: Users },
  { name: "Automatisation & Outils", icon: Cpu },
] as const;

const LEVELS = [
  { value: "debutant" as const, label: "Debutant" },
  { value: "intermediaire" as const, label: "Intermediaire" },
  { value: "avance" as const, label: "Avance" },
];

interface OnboardingSkillMatrixProps {
  value: VaultSkillCategory[];
  onChange: (skills: VaultSkillCategory[]) => void;
}

export function OnboardingSkillMatrix({
  value,
  onChange,
}: OnboardingSkillMatrixProps) {
  const safeValue = Array.isArray(value) ? value : [];

  const getLevel = (name: string) => {
    const skill = safeValue.find((s) => s.name === name);
    return skill?.level;
  };

  const setLevel = (
    name: string,
    level: "debutant" | "intermediaire" | "avance"
  ) => {
    const existing = safeValue.find((s) => s.name === name);
    if (existing?.level === level) {
      onChange(safeValue.filter((s) => s.name !== name));
    } else {
      const filtered = safeValue.filter((s) => s.name !== name);
      onChange([...filtered, { name, level }]);
    }
  };

  return (
    <div className="space-y-4">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const currentLevel = getLevel(cat.name);

        return (
          <div
            key={cat.name}
            className="flex items-center gap-4 rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Icon className="h-4 w-4 flex-shrink-0 text-emerald-400" />
              <span className="truncate text-sm font-medium text-white/80">
                {cat.name}
              </span>
            </div>
            <div className="flex gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => setLevel(cat.name, lvl.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    currentLevel === lvl.value
                      ? "bg-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/20"
                      : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
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
  );
}
