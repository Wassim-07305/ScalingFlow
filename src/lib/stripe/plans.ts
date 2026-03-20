// ─── Plan Limits (feature gating + quotas) ─────────────────────────────────

export interface PlanLimits {
  aiGenerationsPerMonth: number;
  agents: "general_only" | "all";
  metaAds: boolean;
  crm: boolean;
  crons: boolean;
  whitelabel: boolean;
  whitelabelSubAccounts: number;
  affiliateProgram: "none" | "affiliate" | "admin";
  customDomain: boolean;
  apiAccess: boolean;
  priorityQueue: boolean;
  scoringBusiness: boolean;
  scoringAds: boolean;
  multiTouchAttribution: boolean;
  growthTiers: boolean;
  claudeExtraction: boolean;
  coachingCalls: number;
  supportLevel: "community" | "email" | "priority" | "slack";
}

// ─── Plan Definition ────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  annualPrice: number; // prix mensuel si paiement annuel (2 mois offerts)
  features: string[];
  limits: PlanLimits;
  stripePriceId: string;
  stripeAnnualPriceId: string;
  legacyPriceIds?: string[]; // anciens Stripe price IDs (pour webhook backward compat)
  popular?: boolean;
}

// ─── 3 Plans (Free caché + 2 payants) ───────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    description: "Pour découvrir ScalingFlow et tester les fonctionnalités de base.",
    price: 0,
    annualPrice: 0,
    features: [
      "10 générations IA / mois",
      "1 agent IA (généraliste)",
      "Onboarding + Vault",
      "1 analyse de marché",
      "1 offre",
      "Dashboard de base",
      "Academy (modules gratuits)",
      "Communauté",
    ],
    limits: {
      aiGenerationsPerMonth: 10,
      agents: "general_only",
      metaAds: false,
      crm: false,
      crons: false,
      whitelabel: false,
      whitelabelSubAccounts: 0,
      affiliateProgram: "none",
      customDomain: false,
      apiAccess: false,
      priorityQueue: false,
      scoringBusiness: false,
      scoringAds: false,
      multiTouchAttribution: false,
      growthTiers: false,
      claudeExtraction: false,
      coachingCalls: 0,
      supportLevel: "community",
    },
    stripePriceId: "price_xxx_free_monthly",
    stripeAnnualPriceId: "price_xxx_free_annual",
  },
  {
    id: "scale",
    name: "Scale",
    description:
      "Tout ce dont tu as besoin pour structurer, lancer et scaler ton business avec l'IA.",
    price: 149,
    annualPrice: 124, // 149 × 10 / 12 ≈ 124
    features: [
      "500 générations IA / mois",
      "8 agents IA spécialisés",
      "Offre complète + Brand + Funnel builder",
      "Tous les assets de vente + contenu",
      "Meta Ads complet (lancement, monitoring, scaling)",
      "CRM pipeline + prospection + gestion clients",
      "CRONs : monitoring ads, alertes, contenu continu",
      "Scoring business, ads, offre & funnel",
      "Attribution multi-touch + tracking calls",
      "Whitelabel (custom domain, branding, portails)",
      "Paliers de croissance + recommandations",
      "Extraction mémoire Claude",
      "Programme d'affiliation (en tant qu'affilié)",
      "Export API",
      "Calendrier éditorial + publication auto",
      "Academy complète + Gamification + Leaderboard",
      "Support prioritaire",
    ],
    limits: {
      aiGenerationsPerMonth: 500,
      agents: "all",
      metaAds: true,
      crm: true,
      crons: true,
      whitelabel: true,
      whitelabelSubAccounts: 0,
      affiliateProgram: "affiliate",
      customDomain: true,
      apiAccess: true,
      priorityQueue: false,
      scoringBusiness: true,
      scoringAds: true,
      multiTouchAttribution: true,
      growthTiers: true,
      claudeExtraction: true,
      coachingCalls: 0,
      supportLevel: "priority",
    },
    stripePriceId: "price_1TBYRxLzBHnogydhV4I41sES",
    stripeAnnualPriceId: "price_xxx_scale_annual",
    legacyPriceIds: [
      "price_1TD6WmPIprzhdbzlwgJytiqG", // ancien scale 149€
      "price_xxx_scale_annual",
    ],
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    description:
      "Pour les agences et top performers qui veulent tout contrôler et gérer plusieurs clients.",
    price: 297,
    annualPrice: 247, // 297 × 10 / 12 ≈ 247
    features: [
      "1 500 générations IA / mois",
      "Tout le Scale +",
      "5 sous-comptes whitelabel inclus",
      "Dashboard admin affiliés (gérer ton programme)",
      "Coaching calls (2x/mois)",
      "Support Slack privé",
      "Onboarding dédié",
      "Priorité file d'attente IA (pas de rate limit)",
    ],
    limits: {
      aiGenerationsPerMonth: 1500,
      agents: "all",
      metaAds: true,
      crm: true,
      crons: true,
      whitelabel: true,
      whitelabelSubAccounts: 5,
      affiliateProgram: "admin",
      customDomain: true,
      apiAccess: true,
      priorityQueue: true,
      scoringBusiness: true,
      scoringAds: true,
      multiTouchAttribution: true,
      growthTiers: true,
      claudeExtraction: true,
      coachingCalls: 2,
      supportLevel: "slack",
    },
    stripePriceId: "price_1TBYSOLzBHnogydhaimZzZP7",
    stripeAnnualPriceId: "price_xxx_agency_annual",
    legacyPriceIds: [
      "price_1TD6WxPIprzhdbzlo1R16SKM", // ancien agency 299€
      "price_xxx_agency_annual",
    ],
  },
];

// ─── Lookup helpers ─────────────────────────────────────────────────────────

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find(
    (plan) =>
      plan.stripePriceId === priceId ||
      plan.stripeAnnualPriceId === priceId ||
      plan.legacyPriceIds?.includes(priceId),
  );
}

/** Map ancien plan → nouveau plan (backward compat) */
const LEGACY_PLAN_MAP: Record<string, string> = {
  premium: "scale",
  starter: "free",
  pro: "free",
};

export function resolvePlanId(id: string): string {
  return LEGACY_PLAN_MAP[id] || id;
}

/** Retourne les limites d'un plan par son ID (avec fallback free) */
export function getPlanLimits(planId: string): PlanLimits {
  const resolved = resolvePlanId(planId);
  const plan = getPlanById(resolved);
  return plan?.limits ?? PLANS[0].limits; // fallback = free
}

/** Ordre des plans pour comparaison (upgrade/downgrade) */
export const PLAN_ORDER = ["free", "scale", "agency"] as const;
export type PlanId = (typeof PLAN_ORDER)[number];

export function isPlanHigherOrEqual(currentPlan: string, requiredPlan: string): boolean {
  const current = PLAN_ORDER.indexOf(resolvePlanId(currentPlan) as PlanId);
  const required = PLAN_ORDER.indexOf(requiredPlan as PlanId);
  if (current === -1 || required === -1) return false;
  return current >= required;
}
