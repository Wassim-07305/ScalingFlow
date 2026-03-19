import {
  Sparkles,
  Rocket,
  Zap,
  Crown,
  Flame,
  Target,
  Trophy,
  Star,
  Award,
  TrendingUp,
  MessageCircle,
  Calendar,
  DollarSign,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Définitions des badges avec métadonnées complètes.
 * Les IDs correspondent à ceux utilisés dans xp-engine.ts
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_gen",
    name: "Premier pas",
    description: "Génère ton premier contenu avec l'IA",
    icon: Sparkles,
    color: "text-accent",
  },
  {
    id: "gen_5",
    name: "Créateur",
    description: "Génère 5 contenus avec l'IA",
    icon: Zap,
    color: "text-info",
  },
  {
    id: "gen_20",
    name: "Producteur",
    description: "Génère 20 contenus avec l'IA",
    icon: Rocket,
    color: "text-[#A78BFA]",
  },
  {
    id: "gen_50",
    name: "Machine",
    description: "Génère 50 contenus avec l'IA",
    icon: Crown,
    color: "text-warning",
  },
  {
    id: "level_3",
    name: "Apprenti",
    description: "Atteins le niveau 3",
    icon: Target,
    color: "text-accent",
  },
  {
    id: "level_5",
    name: "Confirmé",
    description: "Atteins le niveau 5",
    icon: Award,
    color: "text-info",
  },
  {
    id: "level_10",
    name: "Expert",
    description: "Atteins le niveau 10",
    icon: Trophy,
    color: "text-warning",
  },
  {
    id: "xp_1000",
    name: "Millénaire",
    description: "Accumule 1 000 points XP",
    icon: Star,
    color: "text-accent",
  },
  {
    id: "xp_5000",
    name: "Légende",
    description: "Accumule 5 000 points XP",
    icon: Flame,
    color: "text-danger",
  },
  // Badges Streak
  {
    id: "streak_7",
    name: "Régularité",
    description: "Maintiens un streak de 7 jours",
    icon: Calendar,
    color: "text-danger",
  },
  {
    id: "streak_30",
    name: "Discipline",
    description: "Maintiens un streak de 30 jours",
    icon: Flame,
    color: "text-warning",
  },
  // Badges Communauté
  {
    id: "community_first",
    name: "Social",
    description: "Publie ton premier post dans la communauté",
    icon: MessageCircle,
    color: "text-info",
  },
  {
    id: "community_10",
    name: "Influenceur",
    description: "Publie 10 posts dans la communauté",
    icon: MessageCircle,
    color: "text-[#A78BFA]",
  },
  // Badges Performance Ads
  {
    id: "roas_2x",
    name: "Rentable",
    description: "Atteins un ROAS de 2x sur une campagne",
    icon: TrendingUp,
    color: "text-accent",
  },
  {
    id: "roas_5x",
    name: "Profitable",
    description: "Atteins un ROAS de 5x sur une campagne",
    icon: TrendingUp,
    color: "text-warning",
  },
  // Badges Affiliation
  {
    id: "affiliate_first",
    name: "Premier Referral",
    description: "Ton premier filleul a souscrit un abonnement via ton lien",
    icon: UserPlus,
    color: "text-accent",
  },
  {
    id: "affiliate_ambassador",
    name: "Ambassadeur",
    description: "10 filleuls convertis grâce à ton lien de referral",
    icon: Users,
    color: "text-blue-400",
  },
  {
    id: "affiliate_top",
    name: "Top Affilié",
    description: "50 filleuls convertis — tu es dans le top du programme partenaire",
    icon: Trophy,
    color: "text-yellow-400",
  },
  // Badges Paliers de Croissance
  {
    id: "tier_5k",
    name: "Premier 5K",
    description: "Atteins 5 000€ de CA mensuel — palier Traction débloqué",
    icon: DollarSign,
    color: "text-info",
  },
  {
    id: "tier_10k",
    name: "Club 10K",
    description: "Atteins 10 000€ de CA mensuel — palier Croissance débloqué",
    icon: DollarSign,
    color: "text-accent",
  },
  {
    id: "tier_30k",
    name: "Scale 30K",
    description: "Atteins 30 000€ de CA mensuel — palier Scale débloqué",
    icon: DollarSign,
    color: "text-[#A78BFA]",
  },
  {
    id: "tier_50k",
    name: "Scale Master 50K",
    description: "Atteins 50 000€ de CA mensuel — palier Expansion débloqué",
    icon: DollarSign,
    color: "text-warning",
  },
];

/** Map pour lookup rapide par ID */
export const BADGE_MAP = new Map<string, BadgeDefinition>(
  BADGE_DEFINITIONS.map((b) => [b.id, b]),
);

/** Retourne la définition d'un badge par son ID */
export function getBadgeDefinition(id: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(id);
}
