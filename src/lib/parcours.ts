/**
 * Parcours constants — Single source of truth for all parcours definitions.
 * Aligned with CDC ScalingFlow (March 2026).
 *
 * A1 = Je pars de zéro (no business, no expertise)
 * A2 = Salarié en reconversion
 * A3 = Freelance who wants to scale/package
 * B  = Entrepreneur with existing business to scale
 * C  = Entrepreneur pivoting to a new market
 */

export type ParcoursId = "A1" | "A2" | "A3" | "B" | "C";

export interface ParcoursDefinition {
  id: ParcoursId;
  label: string;
  shortLabel: string;
  description: string;
  icon: string; // lucide icon name
  timeline: string;
  /** Context injected into AI prompts */
  aiContext: string;
}

export const PARCOURS: Record<ParcoursId, ParcoursDefinition> = {
  A1: {
    id: "A1",
    label: "Partir de Zéro",
    shortLabel: "Zéro",
    description:
      "Tu n'as pas encore de business ni d'expertise claire. L'IA te guide de zéro jusqu'à ta première vente.",
    icon: "Rocket",
    timeline: "0 à 90 jours",
    aiContext:
      "Parcours A1 — Zéro : L'utilisateur part de zéro sans business ni expertise claire. Il doit identifier un marché viable basé sur ses compétences latentes, créer une offre simple et obtenir ses premiers clients. Privilégier des marchés accessibles avec des cycles de vente courts et un ticket d'entrée bas.",
  },
  A2: {
    id: "A2",
    label: "Salarié en Reconversion",
    shortLabel: "Reconversion",
    description:
      "Tu es en poste et tu veux te lancer. L'IA identifie ton expertise métier et la transforme en offre.",
    icon: "Briefcase",
    timeline: "30 à 120 jours",
    aiContext:
      "Parcours A2 — Reconversion : L'utilisateur est salarié et veut se lancer comme prestataire. Il a une expertise sectorielle forte mais peu d'expérience entrepreneuriale. Privilégier la productisation de son savoir-faire métier, les marchés B2B liés à son secteur, et une transition progressive.",
  },
  A3: {
    id: "A3",
    label: "Freelance",
    shortLabel: "Freelance",
    description:
      "Tu es indépendant et tu veux packager, scaler ou pivoter tes services.",
    icon: "User",
    timeline: "15 à 60 jours",
    aiContext:
      "Parcours A3 — Freelance : L'utilisateur est freelance/prestataire avec des clients mission par mission. Il veut packager ses services en offre scalable, systematiser son acquisition et scaler. Privilégier l'extension de son marché actuel, la productisation et un funnel de vente systématisé.",
  },
  B: {
    id: "B",
    label: "Scaler mon Business",
    shortLabel: "Scaling",
    description:
      "Tu as déjà une offre, des clients et du CA. Tu veux optimiser et passer au niveau supérieur (5K-50K+/mois).",
    icon: "TrendingUp",
    timeline: "30 à 90 jours",
    aiContext:
      "Parcours B — Scaling : L'utilisateur a déjà un business avec une offre, des clients et du CA. Il veut optimiser son funnel, améliorer son ROAS, augmenter son panier moyen et scaler. Privilégier l'analyse de ses performances existantes, l'optimisation des conversions, et le scaling publicitaire progressif.",
  },
  C: {
    id: "C",
    label: "Pivoter",
    shortLabel: "Pivot",
    description:
      "Tu veux changer de marché ou repositionner ton offre tout en gardant ton expérience business.",
    icon: "RefreshCw",
    timeline: "30 à 90 jours",
    aiContext:
      "Parcours C — Pivot : L'utilisateur a de l'expérience business mais veut changer de marché ou repositionner son offre. Mix entre nouveau marché (exploration) et expertise existante (leverage). Privilégier l'exploration de nouveaux marchés, la réutilisation d'assets et d'audience existants, et une transition progressive sans perte de revenus.",
  },
};

export const PARCOURS_LIST: ParcoursDefinition[] = Object.values(PARCOURS);

/**
 * Deterministic parcours recommendation based on collected onboarding data.
 * Returns a sorted list of parcours with fit scores (0-100).
 */
export function recommendParcours(data: {
  situation?: string;
  currentRevenue?: number;
  experienceLevel?: string;
  objectives?: string[];
  situationDetails?: Record<string, unknown>;
}): { id: ParcoursId; score: number; reason: string }[] {
  const scores: { id: ParcoursId; score: number; reason: string }[] = [];

  const situation = data.situation || "etudiant";
  const revenue = data.currentRevenue || 0;
  const level = data.experienceLevel || "beginner";
  const objectives = data.objectives || [];
  const hasClients = (data.situationDetails?.clients_count as number) > 0;

  // A1 — Zéro (étudiant, sans_emploi, or explicit zero)
  {
    let score = 0;
    let reason = "";
    if (situation === "zero" || situation === "etudiant" || situation === "sans_emploi") {
      score += 60;
      reason = "Tu pars de zéro — ce parcours est fait pour toi.";
    }
    if (level === "beginner") score += 20;
    if (revenue === 0) score += 20;
    scores.push({ id: "A1", score, reason: reason || "Tu débutes, ce parcours peut t'aider." });
  }

  // A2 — Reconversion (salarie or reconversion)
  {
    let score = 0;
    let reason = "";
    if (situation === "salarie" || situation === "reconversion") {
      score += 60;
      reason = "Ce parcours transforme ton expertise métier en offre.";
    }
    if (level === "beginner" || level === "intermediate") score += 15;
    if (revenue === 0) score += 15;
    if (objectives.some((o) => o.toLowerCase().includes("niche"))) score += 10;
    scores.push({ id: "A2", score, reason: reason || "Parcours reconversion." });
  }

  // A3 — Freelance
  {
    let score = 0;
    let reason = "";
    if (situation === "freelance") {
      score += 60;
      reason = "Tu es freelance — ce parcours t'aide à packager et scaler.";
    }
    if (hasClients) score += 15;
    if (revenue > 0 && revenue <= 5000) score += 15;
    if (objectives.some((o) => o.toLowerCase().includes("scaler"))) score += 10;
    scores.push({ id: "A3", score, reason: reason || "Parcours freelance." });
  }

  // B — Scaling
  {
    let score = 0;
    let reason = "";
    if (situation === "entrepreneur") {
      score += 40;
      reason = "Tu as déjà un business — ce parcours t'aide à scaler.";
    }
    if (revenue >= 3000) score += 30;
    else if (revenue > 0) score += 15;
    if (hasClients) score += 15;
    if (level === "advanced") score += 15;
    if (objectives.some((o) => o.toLowerCase().includes("scaler"))) score += 10;
    scores.push({ id: "B", score, reason: reason || "Parcours scaling." });
  }

  // C — Pivot
  {
    let score = 0;
    let reason = "";
    if (situation === "entrepreneur" && revenue > 0) {
      score += 30;
    }
    if (objectives.some((o) => o.toLowerCase().includes("niche") || o.toLowerCase().includes("pivot"))) {
      score += 40;
      reason = "Tes objectifs suggèrent un repositionnement — ce parcours est adapté.";
    }
    if (level === "intermediate" || level === "advanced") score += 15;
    if (hasClients) score += 10;
    scores.push({ id: "C", score, reason: reason || "Parcours pivot." });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  return scores;
}
