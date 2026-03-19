"use client";

import React, { useEffect, useState, useMemo} from "react";
import { cn } from "@/lib/utils/cn";
import {
  Magnet,
  Hammer,
  Package,
  TrendingUp,
  Loader2,
  Check,
  Lock,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface Phase {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Magnet;
  milestoneKeys: string[];
}

const PHASE_COLORS = {
  hook: {
    accent: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    ring: "ring-blue-400/30",
    text: "text-blue-400",
    gradient: "from-blue-400",
  },
  build: {
    accent: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    ring: "ring-purple-400/30",
    text: "text-purple-400",
    gradient: "from-purple-400",
  },
  deliver: {
    accent: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    ring: "ring-orange-400/30",
    text: "text-orange-400",
    gradient: "from-orange-400",
  },
  scale: {
    accent: "#34D399",
    bg: "rgba(52,211,153,0.12)",
    ring: "ring-emerald-400/30",
    text: "text-emerald-400",
    gradient: "from-emerald-400",
  },
};

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

/* ── Skeleton loader ── */

function PhaseProgressionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mb-6", className)}>
      {/* Desktop */}
      <div className="hidden md:flex items-start gap-0 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <div className="flex-1">
              <div className="flex flex-col items-center p-5 rounded-2xl border border-border-default/30 bg-bg-secondary/30">
                <div className="h-12 w-12 rounded-xl bg-bg-tertiary mb-3" />
                <div className="h-4 w-16 rounded-md bg-bg-tertiary mb-2" />
                <div className="h-3 w-32 rounded-md bg-bg-tertiary mb-3" />
                <div className="h-1.5 w-full rounded-full bg-bg-tertiary" />
              </div>
            </div>
            {i < 4 && (
              <div className="flex items-center pt-10 px-1 shrink-0">
                <div className="w-8 h-0.5 rounded-full bg-border-default/30" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Mobile */}
      <div className="md:hidden space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3.5 rounded-xl border border-border-default/30 bg-bg-secondary/30"
          >
            <div className="h-10 w-10 rounded-lg bg-bg-tertiary shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-20 rounded-md bg-bg-tertiary" />
              <div className="h-2.5 w-36 rounded-md bg-bg-tertiary" />
              <div className="h-1 w-full rounded-full bg-bg-tertiary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhaseProgression({ className }: PhaseProgressionProps) {
  const { user, profile } = useUser();
  const [completedTitles, setCompletedTitles] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchMilestones = async () => {
      try {
        const supabase = useMemo(() => createClient(), []);

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
        ((milestonesRes.data ?? []) as { id: string; title: string }[]).forEach(
          (m) => milestoneMap.set(m.id, m.title),
        );

        const completed = new Set<string>();
        (
          (userMilestonesRes.data ?? []) as {
            milestone_id: string;
            completed: boolean;
          }[]
        ).forEach((um) => {
          const title = milestoneMap.get(um.milestone_id);
          if (title) completed.add(title);
        });

        // Auto-detect from profile
        if (profile?.onboarding_completed) completed.add("Profil complete");
        if (
          profile?.market_viability_score &&
          profile.market_viability_score > 70
        )
          completed.add("Marché validé");

        // Auto-detect from data (offers, funnels, leads, sales)
        const [offersRes, funnelsRes, leadsRes, salesRes] = await Promise.all([
          supabase
            .from("offers")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("funnels")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("funnel_leads")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("funnel_leads")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "converted"),
        ]);

        if ((offersRes.count ?? 0) > 0) completed.add("Offre créée");
        if ((funnelsRes.count ?? 0) > 0) completed.add("Funnel construit");
        if ((leadsRes.count ?? 0) > 0) completed.add("1er Lead");
        if ((salesRes.count ?? 0) > 0) completed.add("1ere Vente");

        setCompletedTitles(completed);
      } catch (err) {
        console.error("PhaseProgression: failed to fetch milestones", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.onboarding_completed, profile?.market_viability_score]);

  const getPhaseCompletion = (phase: Phase): number => {
    if (phase.milestoneKeys.length === 0) return 0;
    const done = phase.milestoneKeys.filter((k) =>
      completedTitles.has(k),
    ).length;
    return Math.round((done / phase.milestoneKeys.length) * 100);
  };

  // Find current phase (first not at 75% threshold)
  const currentPhaseIndex = PHASES.findIndex(
    (p) => getPhaseCompletion(p) < 75,
  );
  const activeIndex =
    currentPhaseIndex === -1 ? PHASES.length - 1 : currentPhaseIndex;

  if (loading) {
    return <PhaseProgressionSkeleton className={className} />;
  }

  return (
    <div className={cn("mb-6", className)}>
      {/* Desktop view */}
      <div className="hidden md:flex items-start gap-0 relative">
        {PHASES.map((phase, index) => {
          const completion = getPhaseCompletion(phase);
          const isActive = index === activeIndex;
          const isCompleted = completion === 100;
          const isFuture = index > activeIndex;
          const Icon = phase.icon;
          const phaseColor =
            PHASE_COLORS[phase.key as keyof typeof PHASE_COLORS];

          return (
            <React.Fragment key={phase.key}>
              {/* Phase card */}
              <div className="flex-1 relative">
                <div
                  className={cn(
                    "relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300",
                    isActive
                      ? `border-[${phaseColor.accent}]/40 shadow-lg`
                      : isCompleted
                        ? "border-accent/20 bg-accent/5"
                        : "border-border-default/50 bg-bg-secondary/30",
                  )}
                  style={
                    isActive
                      ? {
                          borderColor: `${phaseColor.accent}40`,
                          background: `linear-gradient(to bottom, ${phaseColor.accent}18, ${phaseColor.accent}08)`,
                          boxShadow: `0 8px 32px ${phaseColor.accent}15`,
                        }
                      : undefined
                  }
                >
                  {/* Completed checkmark */}
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-bg-primary ring-2 ring-bg-secondary">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}

                  {/* Locked indicator for future */}
                  {isFuture && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-bg-tertiary border border-border-default text-text-muted ring-2 ring-bg-secondary">
                      <Lock className="h-3 w-3" />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl mb-3 transition-all duration-300",
                      isActive
                        ? "ring-2 shadow-lg"
                        : isCompleted
                          ? "bg-accent/15"
                          : "bg-bg-tertiary",
                    )}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${phaseColor.accent}30`,
                            boxShadow: `0 4px 16px ${phaseColor.accent}25`,
                            outlineColor: `${phaseColor.accent}40`,
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isCompleted ? "text-accent" : "text-text-muted/60",
                      )}
                      style={
                        isActive ? { color: phaseColor.accent } : undefined
                      }
                    />
                  </div>

                  {/* Phase number + title */}
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-widest font-semibold mb-0.5",
                      isActive
                        ? "text-accent"
                        : isCompleted
                          ? "text-accent/60"
                          : "text-text-muted/50",
                    )}
                  >
                    Phase {index + 1}
                  </span>
                  <h3
                    className={cn(
                      "text-sm font-bold mb-1",
                      isActive || isCompleted
                        ? "text-text-primary"
                        : "text-text-secondary/60",
                    )}
                  >
                    {phase.title}
                  </h3>

                  {/* Subtitle */}
                  <p
                    className={cn(
                      "text-[11px] leading-tight mb-3",
                      isFuture ? "text-text-muted/40" : "text-text-muted",
                    )}
                  >
                    {phase.subtitle}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${completion}%`,
                        backgroundColor:
                          isCompleted || isActive
                            ? phaseColor.accent
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                  </div>

                  {/* Percentage */}
                  <span
                    className={cn(
                      "text-xs font-semibold mt-2",
                      !isCompleted && !isActive && "text-text-muted/40",
                    )}
                    style={
                      isCompleted || isActive
                        ? { color: phaseColor.accent }
                        : undefined
                    }
                  >
                    {completion}%
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {index < PHASES.length - 1 && (
                <div className="flex items-center pt-12 px-1 shrink-0">
                  <div className="relative w-10 h-0.5">
                    <div className="absolute inset-0 rounded-full bg-border-default/30" />
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                        getPhaseCompletion(PHASES[index]) >= 75
                          ? "bg-accent w-full"
                          : "bg-border-default/30 w-0",
                      )}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile view — vertical timeline */}
      <div className="md:hidden relative">
        {/* Timeline line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-border-default/30" />
        <div
          className="absolute left-[27px] top-4 w-0.5 bg-accent transition-all duration-700"
          style={{
            height: `${Math.max(0, ((activeIndex + (getPhaseCompletion(PHASES[activeIndex]) > 0 ? 0.5 : 0)) / (PHASES.length - 1)) * 100)}%`,
            maxHeight: "calc(100% - 2rem)",
          }}
        />

        <div className="space-y-3 relative">
          {PHASES.map((phase, index) => {
            const completion = getPhaseCompletion(phase);
            const isActive = index === activeIndex;
            const isCompleted = completion === 100;
            const isFuture = index > activeIndex;
            const Icon = phase.icon;

            return (
              <div
                key={phase.key}
                className={cn(
                  "flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300 ml-2",
                  isActive
                    ? "border-accent/40 bg-gradient-to-r from-accent/10 to-accent/5 shadow-lg shadow-accent/10"
                    : isCompleted
                      ? "border-accent/20 bg-accent/5"
                      : "border-border-default/30 bg-bg-secondary/30",
                )}
              >
                {/* Icon with status indicator */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                      isActive
                        ? "bg-accent/20 ring-2 ring-accent/30"
                        : isCompleted
                          ? "bg-accent/15"
                          : "bg-bg-tertiary",
                    )}
                  >
                    {isCompleted ? (
                      <Check
                        className="h-5 w-5 text-accent"
                        strokeWidth={2.5}
                      />
                    ) : isFuture ? (
                      <Lock className="h-4 w-4 text-text-muted/40" />
                    ) : (
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-accent" : "text-text-muted",
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider font-semibold",
                          isActive
                            ? "text-accent"
                            : isCompleted
                              ? "text-accent/60"
                              : "text-text-muted/40",
                        )}
                      >
                        Phase {index + 1}
                      </span>
                      <h3
                        className={cn(
                          "text-sm font-bold",
                          isActive || isCompleted
                            ? "text-text-primary"
                            : "text-text-secondary/60",
                        )}
                      >
                        {phase.title}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isCompleted
                          ? "text-accent"
                          : isActive
                            ? "text-accent"
                            : "text-text-muted/40",
                      )}
                    >
                      {completion}%
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-[11px] mb-2",
                      isFuture ? "text-text-muted/40" : "text-text-muted",
                    )}
                  >
                    {phase.subtitle}
                  </p>
                  <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        isCompleted || isActive
                          ? "bg-accent"
                          : "bg-text-muted/20",
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
    </div>
  );
}
