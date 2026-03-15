/**
 * Feature gating basé sur le niveau utilisateur.
 * Chaque feature est accessible à partir d'un niveau minimum.
 */

export interface FeatureGate {
  feature: string;
  label: string;
  requiredLevel: number;
  description: string;
}

export const FEATURE_GATES: FeatureGate[] = [
  // Niveau 0 — accessible immédiatement
  { feature: "onboarding", label: "Onboarding", requiredLevel: 0, description: "Parcours d'onboarding complet" },
  { feature: "market", label: "Analyse de marché", requiredLevel: 0, description: "Analyse et validation de ton marché" },
  { feature: "offer", label: "Offre", requiredLevel: 0, description: "Création et packaging de ton offre" },
  { feature: "vault", label: "Vault", requiredLevel: 0, description: "Ton coffre-fort d'expertise" },
  { feature: "brand", label: "Marque", requiredLevel: 0, description: "Identité de marque" },

  // Niveau 1
  { feature: "funnel", label: "Funnel", requiredLevel: 1, description: "Construction de ton funnel de vente" },
  { feature: "assets", label: "Assets de vente", requiredLevel: 1, description: "VSL, emails, lettres de vente" },

  // Niveau 2
  { feature: "ads", label: "Publicités", requiredLevel: 2, description: "Création et gestion de campagnes ads" },
  { feature: "content", label: "Contenu", requiredLevel: 2, description: "Stratégie et génération de contenu" },
  { feature: "prospection", label: "Prospection", requiredLevel: 2, description: "Scripts et stratégies de prospection" },
  { feature: "sales", label: "Vente", requiredLevel: 2, description: "Outils et scripts de vente" },

  // Niveau 3
  { feature: "launch", label: "Lancement", requiredLevel: 3, description: "Pipeline et lancement de produit" },
  { feature: "analytics", label: "Analytics", requiredLevel: 3, description: "Analyse de performance avancée" },

  // Niveau 4
  { feature: "portal", label: "Portail Whitelabel", requiredLevel: 4, description: "Espace brandé pour tes clients" },
];

/**
 * Vérifie si une fonctionnalité est débloquée pour un niveau donné.
 */
export function isFeatureUnlocked(level: number, feature: string): boolean {
  const gate = FEATURE_GATES.find((g) => g.feature === feature);
  if (!gate) return true; // Feature non gatée = accessible
  return level >= gate.requiredLevel;
}

/**
 * Retourne le niveau requis pour une fonctionnalité.
 * Retourne 0 si la feature n'est pas gatée.
 */
export function getRequiredLevel(feature: string): number {
  const gate = FEATURE_GATES.find((g) => g.feature === feature);
  return gate?.requiredLevel ?? 0;
}

/**
 * Retourne toutes les features verrouillées pour un niveau donné.
 */
export function getLockedFeatures(level: number): FeatureGate[] {
  return FEATURE_GATES.filter((g) => g.requiredLevel > level);
}

/**
 * Retourne toutes les features débloquées pour un niveau donné.
 */
export function getUnlockedFeatures(level: number): FeatureGate[] {
  return FEATURE_GATES.filter((g) => g.requiredLevel <= level);
}

/**
 * XP nécessaire pour atteindre un niveau donné.
 * Reprend les seuils de xp-engine.ts.
 */
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
];

export function getXPForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level > LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return LEVEL_THRESHOLDS[level - 1];
}

export function getXPToNextLevel(currentXP: number, currentLevel: number): number {
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return Math.max(0, nextLevelXP - currentXP);
}
