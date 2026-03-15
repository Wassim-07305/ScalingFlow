"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Lock } from "lucide-react";
import { isFeatureUnlocked, getRequiredLevel, getXPToNextLevel } from "@/lib/gamification/feature-gates";
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
export function FeatureGate({ feature, children, className, blurContent = true }: FeatureGateProps) {
  const { profile } = useUser();
  const userLevel = profile?.level ?? 1;
  const userXP = profile?.xp_points ?? 0;

  const unlocked = isFeatureUnlocked(userLevel, feature);

  if (unlocked) {
    return <>{children}</>;
  }

  const requiredLevel = getRequiredLevel(feature);
  const xpNeeded = getXPToNextLevel(userXP, userLevel);

  return (
    <div className={cn("relative", className)}>
      {/* Contenu flouté ou masqué */}
      {blurContent ? (
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>
      ) : (
        <div className="min-h-[200px]" />
      )}

      {/* Overlay verrouillé */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-accent/20 bg-bg-primary/90 backdrop-blur-sm max-w-sm mx-auto shadow-xl">
          {/* Lock icon avec glow */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-4 ring-2 ring-accent/20">
            <Lock className="h-8 w-8 text-accent" />
          </div>

          {/* Message */}
          <h3 className="text-lg font-bold text-text-primary mb-2">
            Fonctionnalité verrouillée
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Atteins le niveau {requiredLevel} pour débloquer cette fonctionnalité
          </p>

          {/* XP info */}
          <div className="flex items-center gap-2 rounded-xl bg-accent/5 border border-accent/10 px-4 py-2">
            <span className="text-xs text-text-muted">
              Encore <span className="font-bold text-accent">{xpNeeded.toLocaleString("fr-FR")} XP</span> pour le prochain niveau
            </span>
          </div>

          {/* Current level indicator */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-text-muted">
              Ton niveau actuel : <span className="font-semibold text-text-primary">{userLevel}</span>
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

export function FeatureLockBadge({ feature, className }: FeatureLockBadgeProps) {
  const { profile } = useUser();
  const userLevel = profile?.level ?? 1;
  const unlocked = isFeatureUnlocked(userLevel, feature);

  if (unlocked) return null;

  const requiredLevel = getRequiredLevel(feature);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted",
        className
      )}
      title={`Niveau ${requiredLevel} requis`}
    >
      <Lock className="h-2.5 w-2.5" />
      {requiredLevel}
    </span>
  );
}
