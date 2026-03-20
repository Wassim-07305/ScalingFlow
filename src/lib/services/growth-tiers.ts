export interface GrowthTier {
  id: "0-5k" | "5-10k" | "10-30k" | "30-50k" | "50k+";
  label: "Lancement" | "Traction" | "Croissance" | "Scale" | "Expansion";
  range: { min: number; max: number };
  focus_areas: string[];
  key_metrics: string[];
  typical_team: string;
  typical_channels: string[];
  danger_signs: string[];
  next_level_requirements: string[];
}

export const GROWTH_TIERS: GrowthTier[] = [
  {
    id: "0-5k",
    label: "Lancement",
    range: { min: 0, max: 5000 },
    focus_areas: ["offre", "premiers_clients", "validation_marché"],
    key_metrics: [
      "Nombre de clients payants",
      "Taux de conversion prospect → client",
      "Revenu mensuel récurrent",
    ],
    typical_team: "Solo",
    typical_channels: [
      "Prospection directe LinkedIn/Instagram",
      "Réseau personnel",
      "Bouche-à-oreille",
    ],
    danger_signs: [
      "Aucune offre claire définie",
      "Pas de client payant depuis 30 jours",
      "Prix trop bas (syndrome de l'imposteur)",
      "Tarifer à l'heure plutôt qu'à la valeur",
      "Trop de personnalisation, impossible à systématiser",
    ],
    next_level_requirements: [
      "3+ clients payants réguliers",
      "Offre packagée avec prix fixe",
      "Process de delivery répétable documenté",
      "Premiers témoignages clients",
    ],
  },
  {
    id: "5-10k",
    label: "Traction",
    range: { min: 5000, max: 10000 },
    focus_areas: ["acquisition", "systématisation", "prix"],
    key_metrics: [
      "Coût d'acquisition client (CAC)",
      "Taux de rétention / renouvellements",
      "Marge nette par client",
    ],
    typical_team: "Solo + VA",
    typical_channels: [
      "Content marketing (Instagram/LinkedIn)",
      "Prospection semi-automatisée",
      "Premiers tests publicitaires",
    ],
    danger_signs: [
      "Revenu dépendant d'1 ou 2 gros clients",
      "Pas de processus d'acquisition répétable",
      "Débordement opérationnel / burnout",
      "Prix inférieurs aux concurrents directs",
    ],
    next_level_requirements: [
      "Canal d'acquisition principal identifié et répétable",
      "5+ clients actifs simultanément",
      "Offre principale à 1K€+ par client",
      "Délégation partielle du delivery",
    ],
  },
  {
    id: "10-30k",
    label: "Croissance",
    range: { min: 10000, max: 30000 },
    focus_areas: ["scale_acquisition", "équipe", "systèmes"],
    key_metrics: [
      "ROAS publicitaire",
      "Coût par lead qualifié",
      "Taux de conversion appel → client",
    ],
    typical_team: "Équipe 2-3 personnes",
    typical_channels: [
      "Publicité payante (Meta Ads / Google)",
      "Funnel automatisé",
      "Email marketing",
    ],
    danger_signs: [
      "Fondateur encore opérationnel sur tout",
      "Pas de funnel marketing automatisé",
      "Acquisition uniquement via réseau / organique",
      "Aucun suivi des KPIs marketing",
    ],
    next_level_requirements: [
      "Funnel publicitaire rentable (ROAS > 2x)",
      "Équipe minimale avec rôles définis",
      "Process de vente documenté avec scripts",
      "Dashboard de suivi des métriques clés",
    ],
  },
  {
    id: "30-50k",
    label: "Scale",
    range: { min: 30000, max: 50000 },
    focus_areas: ["optimisation_funnel", "montée_en_gamme", "récurrence"],
    key_metrics: [
      "LTV (valeur vie client)",
      "Taux de churn",
      "Revenu récurrent mensuel (MRR)",
    ],
    typical_team: "Équipe 4-6 personnes",
    typical_channels: [
      "Meta Ads + Google Ads",
      "Partenariats & affiliés",
      "Programme de référencement",
    ],
    danger_signs: [
      "Croissance stagnante malgré l'investissement pub",
      "Churn élevé (perte de clients rapide)",
      "Pas d'offre récurrente ou d'upsell",
      "Équipe mal gérée / turnover important",
    ],
    next_level_requirements: [
      "MRR stable avec offre en abonnement ou suivi",
      "LTV > 3x CAC",
      "Directeur ops ou manager intermédiaire",
      "Processus marketing documenté et délégué",
    ],
  },
  {
    id: "50k+",
    label: "Expansion",
    range: { min: 50000, max: Infinity },
    focus_areas: ["nouveaux_marchés", "produits", "leviers_de_scale"],
    key_metrics: [
      "Croissance MoM (%)",
      "Part de marché",
      "Marge EBITDA",
    ],
    typical_team: "Équipe 6+ personnes",
    typical_channels: [
      "Multi-canal paid + organique",
      "Whitelabel / licences",
      "Événements & conférences",
    ],
    danger_signs: [
      "Dépendance à un seul canal de revenus",
      "Pas de vision stratégique à 12 mois",
      "Fondateur encore dans l'opérationnel",
      "Absence de données financières précises",
    ],
    next_level_requirements: [
      "Modèle scalable sans dépendance au fondateur",
      "Diversification des revenus (2+ sources)",
      "Tableau de bord financier complet",
      "Stratégie de sortie ou de levée de fonds possible",
    ],
  },
];

/** Retourne le palier correspondant au CA mensuel */
export function getCurrentTier(monthlyRevenue: number): GrowthTier {
  for (let i = GROWTH_TIERS.length - 1; i >= 0; i--) {
    if (monthlyRevenue >= GROWTH_TIERS[i].range.min) {
      return GROWTH_TIERS[i];
    }
  }
  return GROWTH_TIERS[0];
}

interface TierProgress {
  percent: number;
  missingRevenue: number;
  nextTier: GrowthTier | null;
  currentTier: GrowthTier;
}

/** Retourne le pourcentage de progression vers le palier suivant */
export function getProgressToNextTier(monthlyRevenue: number): TierProgress {
  const currentTier = getCurrentTier(monthlyRevenue);
  const currentIndex = GROWTH_TIERS.findIndex((t) => t.id === currentTier.id);
  const nextTier =
    currentIndex < GROWTH_TIERS.length - 1
      ? GROWTH_TIERS[currentIndex + 1]
      : null;

  if (!nextTier) {
    return { percent: 100, missingRevenue: 0, nextTier: null, currentTier };
  }

  const rangeSize = nextTier.range.min - currentTier.range.min;
  const progress = monthlyRevenue - currentTier.range.min;
  const percent = Math.min(100, Math.round((progress / rangeSize) * 100));
  const missingRevenue = Math.max(0, nextTier.range.min - monthlyRevenue);

  return { percent, missingRevenue, nextTier, currentTier };
}

/** Couleur associée à un palier */
export function getTierColor(tierId: GrowthTier["id"]): string {
  const colors: Record<GrowthTier["id"], string> = {
    "0-5k": "text-text-muted",
    "5-10k": "text-info",
    "10-30k": "text-accent",
    "30-50k": "text-[#A78BFA]",
    "50k+": "text-warning",
  };
  return colors[tierId];
}

export function getTierBgColor(tierId: GrowthTier["id"]): string {
  const colors: Record<GrowthTier["id"], string> = {
    "0-5k": "bg-bg-tertiary",
    "5-10k": "bg-info/10",
    "10-30k": "bg-accent/10",
    "30-50k": "bg-[#A78BFA]/10",
    "50k+": "bg-warning/10",
  };
  return colors[tierId];
}
