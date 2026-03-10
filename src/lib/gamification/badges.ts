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
 * Definitions des badges avec metadonnees completes.
 * Les IDs correspondent a ceux utilises dans xp-engine.ts
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_gen",
    name: "Premier pas",
    description: "Genere ton premier contenu avec l'IA",
    icon: Sparkles,
    color: "text-accent",
  },
  {
    id: "gen_5",
    name: "Createur",
    description: "Genere 5 contenus avec l'IA",
    icon: Zap,
    color: "text-info",
  },
  {
    id: "gen_20",
    name: "Producteur",
    description: "Genere 20 contenus avec l'IA",
    icon: Rocket,
    color: "text-[#A78BFA]",
  },
  {
    id: "gen_50",
    name: "Machine",
    description: "Genere 50 contenus avec l'IA",
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
    name: "Regularite",
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
  // Badges Communaute
  {
    id: "community_first",
    name: "Social",
    description: "Publie ton premier post dans la communaute",
    icon: MessageCircle,
    color: "text-info",
  },
  {
    id: "community_10",
    name: "Influenceur",
    description: "Publie 10 posts dans la communaute",
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
];

/** Map pour lookup rapide par ID */
export const BADGE_MAP = new Map<string, BadgeDefinition>(
  BADGE_DEFINITIONS.map((b) => [b.id, b])
);

/** Retourne la definition d'un badge par son ID */
export function getBadgeDefinition(id: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(id);
}
