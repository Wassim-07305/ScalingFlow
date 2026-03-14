export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  stripePriceId: string;
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    description: "Pour découvrir ScalingFlow et tester les fonctionnalités de base.",
    price: 0,
    features: [
      "5 générations IA / mois",
      "1 agent IA",
      "Accès communauté",
      "Academy (modules gratuits)",
      "Dashboard de base",
    ],
    stripePriceId: "price_xxx_free_monthly",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les entrepreneurs sérieux qui veulent scaler rapidement.",
    price: 49,
    features: [
      "Générations IA illimitées",
      "Tous les agents IA",
      "Support prioritaire",
      "Academy complète",
      "Analyses de marché avancées",
      "Funnel builder complet",
      "Export des assets",
      "Gamification & leaderboard",
    ],
    stripePriceId: "price_xxx_pro_monthly",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Pour les agences et entrepreneurs qui veulent tout automatiser.",
    price: 149,
    features: [
      "Tout le plan Pro",
      "Accès API",
      "White-label",
      "Coaching calls (2x/mois)",
      "Intégrations avancées (Meta Ads, CRM)",
      "Templates personnalisés",
      "Onboarding dédié",
      "Support Slack privé",
    ],
    stripePriceId: "price_xxx_premium_monthly",
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find((plan) => plan.stripePriceId === priceId);
}
