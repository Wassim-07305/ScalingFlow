"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Lock, Zap } from "lucide-react";
import {
  isFeatureUnlocked,
  getRequiredLevel,
  getXPToNextLevel,
} from "@/lib/gamification/feature-gates";
import { useUser } from "@/hooks/use-user";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  className?: string;
  /** Si true, affiche le contenu en flou au lieu de le masquer complètement */
  blurContent?: boolean;
}

/**
 * Composant wrapper qui vérifie le niveau de l'utilisateur.
 * Si le niveau est suffisant, affiche les enfants normalement.
 * Sinon, affiche un overlay verrouillé avec le niveau requis.
 */
export function FeatureGate({
  feature,
  children,
  className,
  blurContent = true,
}: FeatureGateProps) {
  const { profile } = useUser();
  const userLevel = profile?.level ?? 1;
  const userXP = profile?.xp_points ?? 0;

  const unlocked = isFeatureUnlocked(userLevel, feature);

  if (unlocked) {
    return <>{children}</>;
  }

  const requiredLevel = getRequiredLevel(feature);
  const xpNeeded = getXPToNextLevel(userXP, userLevel);
  const progressPct = Math.min(
    100,
    Math.round((1 - xpNeeded / Math.max(1, xpNeeded + userXP)) * 100),
  );

  return (
    <div className={cn("relative", className)}>
      {/* Contenu flouté ou masqué */}
      {blurContent ? (
        <div className="pointer-events-none select-none blur-[6px] opacity-30 saturate-0">
          {children}
        </div>
      ) : (
        <div className="min-h-[200px]" />
      )}

      {/* Overlay verrouillé — glassmorphism */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-accent/15 bg-bg-primary/80 backdrop-blur-xl max-w-sm mx-auto shadow-2xl shadow-black/20">
          {/* Lock icon avec gradient ring */}
          <div className="relative mb-5">
            <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <Lock className="h-7 w-7 text-accent" />
              </div>
            </div>
            {/* Subtle glow */}
            <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl -z-10" />
          </div>

          {/* Message */}
          <h3 className="text-lg font-bold text-text-primary mb-1.5">
            Fonctionnalité verrouillée
          </h3>
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            Atteins le{" "}
            <span className="font-semibold text-accent">
              niveau {requiredLevel}
            </span>{" "}
            pour débloquer cette fonctionnalité.
          </p>

          {/* Progress towards next level */}
          <div className="w-full rounded-xl bg-bg-tertiary/50 border border-border-default/30 p-3.5 mb-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-text-muted flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-accent" />
                Progression
              </span>
              <span className="font-semibold text-accent">
                {xpNeeded.toLocaleString("fr-FR")} XP restants
              </span>
            </div>
            <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-emerald-300 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Current level indicator */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>
              Niveau actuel :{" "}
              <span className="font-bold text-text-primary">{userLevel}</span>
            </span>
            <span className="text-border-default">|</span>
            <span>
              Objectif :{" "}
              <span className="font-bold text-accent">{requiredLevel}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Badge indicateur de verrouillage pour les items de navigation.
 */
interface FeatureLockBadgeProps {
  feature: string;
  className?: string;
}

export function FeatureLockBadge({
  feature,
  className,
}: FeatureLockBadgeProps) {
  const { profile } = useUser();
  const userLevel = profile?.level ?? 1;
  const unlocked = isFeatureUnlocked(userLevel, feature);

  if (unlocked) return null;

  const requiredLevel = getRequiredLevel(feature);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-bg-tertiary/80 border border-border-default/30 px-1.5 py-0.5 text-[10px] font-medium text-text-muted",
        className,
      )}
      title={`Niveau ${requiredLevel} requis`}
    >
      <Lock className="h-2.5 w-2.5" />
      {requiredLevel}
    </span>
  );
}
