"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  SKILL_CATEGORIES,
  type SelectedSkill,
  type SkillLevel,
} from "./skill-categories";

interface SkillMatrixSelectorProps {
  value: SelectedSkill[];
  onChange: (skills: SelectedSkill[]) => void;
}

const LEVEL_LABELS: Record<SkillLevel, { label: string; color: string }> = {
  debutant: {
    label: "Débutant",
    color: "border-yellow-400/50 bg-yellow-400/10 text-yellow-300",
  },
  intermediaire: {
    label: "Intermédiaire",
    color: "border-blue-400/50 bg-blue-400/10 text-blue-300",
  },
  avance: {
    label: "Avancé",
    color: "border-emerald-400/50 bg-emerald-400/10 text-emerald-300",
  },
};

export function SkillMatrixSelector({
  value,
  onChange,
}: SkillMatrixSelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    SKILL_CATEGORIES[0].id,
  );

  const isSelected = (skillId: string) =>
    value.some((s) => s.skillId === skillId);

  const getLevel = (skillId: string) =>
    value.find((s) => s.skillId === skillId)?.level;

  const toggleSkill = (skillId: string, categoryId: string) => {
    if (isSelected(skillId)) {
      onChange(value.filter((s) => s.skillId !== skillId));
    } else {
      onChange([...value, { skillId, categoryId, level: "debutant" }]);
    }
  };

  const setLevel = (skillId: string, level: SkillLevel) => {
    onChange(value.map((s) => (s.skillId === skillId ? { ...s, level } : s)));
  };

  const categoryCount = (categoryId: string) =>
    value.filter((s) => s.categoryId === categoryId).length;

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
      {SKILL_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategory === cat.id;
        const count = categoryCount(cat.id);

        return (
          <div
            key={cat.id}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            {/* Category header */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">
                  {cat.name}
                </span>
                {count > 0 && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    {count}
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-white/40" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/40" />
              )}
            </button>

            {/* Skills list */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 px-4 pb-4">
                    {cat.skills.map((skill) => {
                      const selected = isSelected(skill.id);
                      const level = getLevel(skill.id);

                      return (
                        <div key={skill.id}>
                          <button
                            onClick={() => toggleSkill(skill.id, cat.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                              selected
                                ? "bg-emerald-500/10 border border-emerald-500/30"
                                : "border border-transparent hover:bg-white/5",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                selected
                                  ? "border-emerald-400 bg-emerald-500"
                                  : "border-white/20",
                              )}
                            >
                              {selected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-sm",
                                selected ? "text-white" : "text-white/60",
                              )}
                            >
                              {skill.label}
                            </span>
                          </button>

                          {/* Level selector */}
                          {selected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="ml-8 mt-1 flex gap-2"
                            >
                              {(
                                Object.entries(LEVEL_LABELS) as [
                                  SkillLevel,
                                  { label: string; color: string },
                                ][]
                              ).map(([lvl, info]) => (
                                <button
                                  key={lvl}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLevel(skill.id, lvl);
                                  }}
                                  className={cn(
                                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                                    level === lvl
                                      ? info.color
                                      : "border-white/10 text-white/30 hover:border-white/20",
                                  )}
                                >
                                  {info.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {value.length > 0 && (
        <p className="text-center text-xs text-white/30">
          {value.length} compétence{value.length > 1 ? "s" : ""} sélectionnée
          {value.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
