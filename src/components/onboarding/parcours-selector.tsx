"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Briefcase,
  User,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Clock,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  PARCOURS_LIST,
  recommendParcours,
  type ParcoursId,
} from "@/lib/parcours";

const ICONS: Record<string, React.ElementType> = {
  Rocket,
  Briefcase,
  User,
  TrendingUp,
  RefreshCw,
};

interface ParcoursSelectorProps {
  value: string;
  onChange: (value: string) => void;
  /** Data collected so far — used for recommendation */
  formData: Record<string, unknown>;
}

export function ParcoursSelector({
  value,
  onChange,
  formData,
}: ParcoursSelectorProps) {
  const recommendations = useMemo(
    () =>
      recommendParcours({
        situation: formData.situation as string,
        currentRevenue: Number(formData.currentRevenue) || 0,
        experienceLevel: formData.experienceLevel as string,
        objectives: (formData.objectives as string[]) || [],
        situationDetails:
          (formData.situationDetails as Record<string, unknown>) || {},
      }),
    [formData]
  );

  const topRec = recommendations[0];
  const recMap = Object.fromEntries(recommendations.map((r) => [r.id, r]));

  return (
    <div className="space-y-4">
      {/* Recommendation banner */}
      {topRec && topRec.score > 30 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-300">
              Parcours recommande : {PARCOURS_LIST.find((p) => p.id === topRec.id)?.label}
            </p>
            <p className="mt-0.5 text-xs text-white/40">{topRec.reason}</p>
          </div>
        </motion.div>
      )}

      {/* Parcours cards */}
      <div className="grid gap-3">
        {PARCOURS_LIST.map((parcours, i) => {
          const Icon = ICONS[parcours.icon] || Rocket;
          const isSelected = value === parcours.id;
          const isRecommended = topRec?.id === parcours.id && topRec.score > 30;
          const rec = recMap[parcours.id];
          const fitScore = rec?.score || 0;

          return (
            <motion.button
              key={parcours.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              type="button"
              onClick={() => onChange(parcours.id)}
              className={cn(
                "group relative w-full rounded-2xl border-2 px-5 py-4 text-left transition-all",
                isSelected
                  ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
              )}
            >
              {/* Selected check */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400"
                >
                  <Check className="h-3.5 w-3.5 text-black" />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isSelected
                      ? "bg-emerald-400/20 text-emerald-400"
                      : "bg-white/10 text-white/50 group-hover:text-white/70"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-base font-semibold",
                        isSelected ? "text-emerald-300" : "text-white/80"
                      )}
                    >
                      {parcours.label}
                    </span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/30">
                      {parcours.id}
                    </span>
                    {isRecommended && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Recommande
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-white/40">
                    {parcours.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-white/25">
                      <Clock className="h-3 w-3" />
                      {parcours.timeline}
                    </span>
                    {fitScore > 0 && (
                      <span className="text-xs text-white/25">
                        Fit : {Math.min(fitScore, 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
