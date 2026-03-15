"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Magnet, Hammer, Package, TrendingUp, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface Phase {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Magnet;
  milestoneKeys: string[];
}

const PHASES: Phase[] = [
  {
    key: "hook",
    title: "Hook",
    subtitle: "Construire et marketer ton business",
    icon: Magnet,
    milestoneKeys: ["Profil complete", "Marché validé"],
  },
  {
    key: "build",
    title: "Build",
    subtitle: "Créer ton offre, onboarding, process",
    icon: Hammer,
    milestoneKeys: ["Offre créée", "Funnel construit"],
  },
  {
    key: "deliver",
    title: "Deliver",
    subtitle: "Gérer tes clients, delivery",
    icon: Package,
    milestoneKeys: ["1er Lead", "1ere Vente"],
  },
  {
    key: "scale",
    title: "Scale",
    subtitle: "Analyser la data, ads, optimiser",
    icon: TrendingUp,
    milestoneKeys: ["5K/mois", "10K/mois"],
  },
];

interface PhaseProgressionProps {
  className?: string;
}

export function PhaseProgression({ className }: PhaseProgressionProps) {
  const { user, profile } = useUser();
  const [completedTitles, setCompletedTitles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMilestones = async () => {
      const supabase = createClient();

      const [milestonesRes, userMilestonesRes] = await Promise.all([
        supabase
          .from("milestones")
          .select("id, title")
          .order("milestone_order", { ascending: true }),
        supabase
          .from("user_milestones")
          .select("milestone_id, completed")
          .eq("user_id", user.id)
          .eq("completed", true),
      ]);

      const milestoneMap = new Map<string, string>();
      ((milestonesRes.data ?? []) as { id: string; title: string }[]).forEach((m) => milestoneMap.set(m.id, m.title));

      const completed = new Set<string>();
      ((userMilestonesRes.data ?? []) as { milestone_id: string; completed: boolean }[]).forEach((um) => {
        const title = milestoneMap.get(um.milestone_id);
        if (title) completed.add(title);
      });

      // Auto-detect from profile
      if (profile?.onboarding_completed) completed.add("Profil complete");
      if (profile?.market_viability_score && profile.market_viability_score > 70)
        completed.add("Marché validé");

      setCompletedTitles(completed);
      setLoading(false);
    };

    fetchMilestones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.onboarding_completed, profile?.market_viability_score]);

  const getPhaseCompletion = (phase: Phase): number => {
    if (phase.milestoneKeys.length === 0) return 0;
    const done = phase.milestoneKeys.filter((k) => completedTitles.has(k)).length;
    return Math.round((done / phase.milestoneKeys.length) * 100);
  };

  // Find current phase (first not 100%)
  const currentPhaseIndex = PHASES.findIndex((p) => getPhaseCompletion(p) < 100);
  const activeIndex = currentPhaseIndex === -1 ? PHASES.length - 1 : currentPhaseIndex;

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className={cn("mb-6", className)}>
      {/* Desktop view */}
      <div className="hidden md:flex items-start gap-0 relative">
        {PHASES.map((phase, index) => {
          const completion = getPhaseCompletion(phase);
          const isActive = index === activeIndex;
          const isCompleted = completion === 100;
          const Icon = phase.icon;

          return (
            <React.Fragment key={phase.key}>
              {/* Phase card */}
              <div className="flex-1 relative">
                <div
                  className={cn(
                    "relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all",
                    isActive
                      ? "border-accent/40 bg-accent/5 shadow-lg shadow-accent/10"
                      : isCompleted
                        ? "border-accent/20 bg-accent/5"
                        : "border-border-default bg-bg-secondary/50"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl mb-3 transition-all",
                      isActive
                        ? "bg-accent/20 ring-2 ring-accent/30 shadow-lg shadow-accent/20"
                        : isCompleted
                          ? "bg-accent/15"
                          : "bg-bg-tertiary"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isActive || isCompleted ? "text-accent" : "text-text-muted"
                      )}
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className={cn(
                      "text-sm font-bold mb-1",
                      isActive || isCompleted ? "text-text-primary" : "text-text-secondary"
                    )}
                  >
                    {phase.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-[11px] text-text-muted leading-tight mb-3">
                    {phase.subtitle}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted ? "bg-accent" : isActive ? "bg-accent" : "bg-text-muted/30"
                      )}
                      style={{ width: `${completion}%` }}
                    />
                  </div>

                  {/* Percentage */}
                  <span
                    className={cn(
                      "text-xs font-medium mt-2",
                      isCompleted ? "text-accent" : isActive ? "text-accent" : "text-text-muted"
                    )}
                  >
                    {completion}%
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {index < PHASES.length - 1 && (
                <div className="flex items-center pt-10 px-1 shrink-0">
                  <div
                    className={cn(
                      "w-8 h-0.5 rounded-full transition-all",
                      getPhaseCompletion(PHASES[index]) === 100
                        ? "bg-accent"
                        : "bg-border-default"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {PHASES.map((phase, index) => {
          const completion = getPhaseCompletion(phase);
          const isActive = index === activeIndex;
          const isCompleted = completion === 100;
          const Icon = phase.icon;

          return (
            <div
              key={phase.key}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl border transition-all",
                isActive
                  ? "border-accent/40 bg-accent/5 shadow-lg shadow-accent/10"
                  : isCompleted
                    ? "border-accent/20 bg-accent/5"
                    : "border-border-default bg-bg-secondary/50"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                  isActive
                    ? "bg-accent/20 ring-2 ring-accent/30"
                    : isCompleted
                      ? "bg-accent/15"
                      : "bg-bg-tertiary"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive || isCompleted ? "text-accent" : "text-text-muted"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={cn(
                      "text-sm font-bold",
                      isActive || isCompleted ? "text-text-primary" : "text-text-secondary"
                    )}
                  >
                    {phase.title}
                  </h3>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isCompleted ? "text-accent" : isActive ? "text-accent" : "text-text-muted"
                    )}
                  >
                    {completion}%
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mb-2">{phase.subtitle}</p>
                <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isCompleted ? "bg-accent" : isActive ? "bg-accent" : "bg-text-muted/30"
                    )}
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
