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
  popular?: boolean;
}

// ─── 5 Plans ────────────────────────────────────────────────────────────────

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
    id: "starter",
    name: "Starter",
    description: "Pour structurer ton business et créer tes premiers assets.",
    price: 29,
    annualPrice: 24, // 29 × 10 / 12 ≈ 24.17
    features: [
      "50 générations IA / mois",
      "8 agents IA spécialisés",
      "Offre complète + Brand",
      "Funnel builder",
      "Tous les assets de vente",
      "Contenu (reels, youtube, stories, carousels)",
      "Calendrier éditorial",
      "Scoring offre & funnel",
      "Academy complète",
    ],
    limits: {
      aiGenerationsPerMonth: 50,
      agents: "all",
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
      supportLevel: "email",
    },
    stripePriceId: "price_1TD6WRPIprzhdbzlVC1LLdog",
    stripeAnnualPriceId: "price_xxx_starter_annual",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les entrepreneurs sérieux qui veulent scaler avec la pub et le CRM.",
    price: 59,
    annualPrice: 49, // 59 × 10 / 12 ≈ 49.17
    features: [
      "200 générations IA / mois",
      "Tout le Starter +",
      "Meta Ads complet (lancement, monitoring, auto-décisions, scaling)",
      "CRM pipeline + prospection + gestion clients",
      "CRONs : monitoring ads, alertes, contenu continu",
      "Scoring business & ads",
      "Attribution multi-touch + tracking calls",
      "Gamification complète + leaderboard",
      "Connect GHL + Socials (publication auto)",
    ],
    limits: {
      aiGenerationsPerMonth: 200,
      agents: "all",
      metaAds: true,
      crm: true,
      crons: true,
      whitelabel: false,
      whitelabelSubAccounts: 0,
      affiliateProgram: "none",
      customDomain: false,
      apiAccess: false,
      priorityQueue: false,
      scoringBusiness: true,
      scoringAds: true,
      multiTouchAttribution: true,
      growthTiers: false,
      claudeExtraction: false,
      coachingCalls: 0,
      supportLevel: "priority",
    },
    stripePriceId: "price_1TD6WcPIprzhdbzlG7SCovii",
    stripeAnnualPriceId: "price_xxx_pro_annual",
    popular: true,
  },
  {
    id: "scale",
    name: "Scale",
    description: "Pour automatiser et déployer à grande échelle avec whitelabel.",
    price: 149,
    annualPrice: 124, // 149 × 10 / 12 ≈ 124.17
    features: [
      "500 générations IA / mois",
      "Tout le Pro +",
      "Whitelabel complet (custom domain, branding, portails clients)",
      "Paliers de croissance + recommandations",
      "Extraction mémoire Claude",
      "Deploy funnel custom domain",
      "Programme d'affiliation (en tant qu'affilié)",
      "Export API",
      "Connect Stripe avancé (attribution créative)",
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
    stripePriceId: "price_1TD6WmPIprzhdbzlwgJytiqG",
    stripeAnnualPriceId: "price_xxx_scale_annual",
  },
  {
    id: "agency",
    name: "Agency",
    description: "Pour les agences et top performers qui veulent tout contrôler.",
    price: 299,
    annualPrice: 249, // 299 × 10 / 12 ≈ 249.17
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
    stripePriceId: "price_1TD6WxPIprzhdbzlo1R16SKM",
    stripeAnnualPriceId: "price_xxx_agency_annual",
  },
];

// ─── Lookup helpers ─────────────────────────────────────────────────────────

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find(
    (plan) => plan.stripePriceId === priceId || plan.stripeAnnualPriceId === priceId,
  );
}

/** Map ancien plan → nouveau plan (backward compat) */
const LEGACY_PLAN_MAP: Record<string, string> = {
  premium: "scale", // l'ancien "premium" à 149€ → nouveau "scale" à 149€
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
export const PLAN_ORDER = ["free", "starter", "pro", "scale", "agency"] as const;
export type PlanId = (typeof PLAN_ORDER)[number];

export function isPlanHigherOrEqual(currentPlan: string, requiredPlan: string): boolean {
  const current = PLAN_ORDER.indexOf(resolvePlanId(currentPlan) as PlanId);
  const required = PLAN_ORDER.indexOf(requiredPlan as PlanId);
  if (current === -1 || required === -1) return false;
  return current >= required;
}
