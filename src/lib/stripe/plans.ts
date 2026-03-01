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
    description: "Pour decouvrir ScalingFlow et tester les fonctionnalites de base.",
    price: 0,
    features: [
      "5 generations IA / mois",
      "1 agent IA",
      "Acces communaute",
      "Academy (modules gratuits)",
      "Dashboard de base",
    ],
    stripePriceId: "price_xxx_free_monthly",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les entrepreneurs serieux qui veulent scaler rapidement.",
    price: 49,
    features: [
      "Generations IA illimitees",
      "Tous les agents IA",
      "Support prioritaire",
      "Academy complete",
      "Analyses de marche avancees",
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
      "Acces API",
      "White-label",
      "Coaching calls (2x/mois)",
      "Integrations avancees (Meta Ads, CRM)",
      "Templates personnalises",
      "Onboarding dedie",
      "Support Slack prive",
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
