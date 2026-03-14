export type QuestionType =
  | "welcome"
  | "text"
  | "text-euro"
  | "textarea"
  | "chips"
  | "chips-multi"
  | "multi-field"
  | "skill-matrix"
  | "parcours-selector"
  | "summary"
  | "market-analysis";

export interface ChipOption {
  value: string;
  label: string;
  desc?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  field?: string;
  placeholder?: string;
  chips?: ChipOption[];
  hasOther?: boolean;
  chipColumns?: 1 | 2 | 3;
  showWhen?: (data: Record<string, unknown>) => boolean;
}

export const QUESTIONS: Question[] = [
  // ═══════════════════════════════════════
  // Phase 1 — Qui es-tu ?
  // ═══════════════════════════════════════

  // 0 — Welcome
  {
    id: "welcome",
    type: "welcome",
    title: "Bienvenue sur ScalingFlow",
    subtitle:
      "Réponds à quelques questions rapides pour que l'IA personnalise tout pour toi.",
  },

  // 1 — Prénom
  {
    id: "firstName",
    type: "text",
    title: "Comment tu t'appelles ?",
    subtitle: "Ton prénom",
    field: "firstName",
    placeholder: "Prénom",
  },

  // 2 — Situation (auto-advance)
  {
    id: "situation",
    type: "chips",
    title: "Quelle est ta situation actuelle ?",
    field: "situation",
    chips: [
      {
        value: "salarie",
        label: "Salarié(e)",
        desc: "J'ai un job et je veux me lancer en parallèle.",
      },
      {
        value: "freelance",
        label: "Freelance / Indépendant",
        desc: "Je fais des missions, je veux structurer et scaler.",
      },
      {
        value: "entrepreneur",
        label: "Entrepreneur",
        desc: "J'ai déjà un business en place.",
      },
      {
        value: "etudiant",
        label: "Étudiant(e)",
        desc: "Je suis en études et je veux me lancer.",
      },
      {
        value: "reconversion",
        label: "En reconversion",
        desc: "Je change de voie et je veux lancer un business.",
      },
      {
        value: "sans_emploi",
        label: "Sans emploi",
        desc: "Je suis disponible à 100% pour mon projet.",
      },
    ],
  },

  // ═══════════════════════════════════════
  // Phase 2 — Ton expertise
  // ═══════════════════════════════════════

  // 3 — Détails situation (conditionnel)
  {
    id: "situationDetails",
    type: "multi-field",
    title: "Dis-nous en plus sur ta situation",
    subtitle: "Ces infos aident l'IA à personnaliser ton parcours.",
    field: "situationDetails",
    showWhen: (data) =>
      data.situation !== "" && data.situation !== undefined,
  },

  // 4 — Expertise (1 seul textarea qui remplace les 4 questions)
  {
    id: "expertise",
    type: "textarea",
    title: "Décris ton expertise en quelques phrases",
    subtitle:
      "Qu'est-ce que tu sais faire mieux que les autres ? Dans quel domaine les gens te demandent conseil ? Quel résultat tu as déjà obtenu ?",
    field: "expertise_q1",
    placeholder:
      "Ex : Je suis expert en marketing digital, j'ai aidé 12 clients à doubler leur CA en 6 mois...",
  },

  // 5 — Industries
  {
    id: "industries",
    type: "chips-multi",
    title: "Quels secteurs connais-tu ?",
    subtitle: "Sélectionne ceux où tu as de l'expérience ou de l'appétence.",
    field: "industries",
    chips: [
      { value: "Fitness / Sport", label: "Fitness / Sport" },
      { value: "Sante / Bien-etre", label: "Santé / Bien-être" },
      { value: "Immobilier", label: "Immobilier" },
      { value: "E-commerce", label: "E-commerce" },
      { value: "SaaS / Tech", label: "SaaS / Tech" },
      { value: "Finance / Investissement", label: "Finance / Investissement" },
      { value: "Education / Formation", label: "Éducation / Formation" },
      { value: "Beaute / Esthetique", label: "Beauté / Esthétique" },
      { value: "Restauration / Food", label: "Restauration / Food" },
      { value: "BTP / Artisanat", label: "BTP / Artisanat" },
      { value: "Medical / Paramedical", label: "Médical / Paramédical" },
      { value: "Marketing / Communication", label: "Marketing / Communication" },
      { value: "Coaching business", label: "Coaching business" },
    ],
    hasOther: true,
  },

  // ═══════════════════════════════════════
  // Phase 3 — Ton projet
  // ═══════════════════════════════════════

  // 6 — Parcours
  {
    id: "parcours",
    type: "parcours-selector",
    title: "Quel parcours te correspond ?",
    subtitle:
      "L'IA te recommande un parcours d'après ton profil. Tu peux changer si ça ne correspond pas.",
    field: "parcours",
  },

  // 7 — Objectif revenus (auto-advance)
  {
    id: "targetRevenue",
    type: "chips",
    title: "Ton objectif de revenus mensuels ?",
    field: "targetRevenue",
    chips: [
      { value: "3000", label: "3K €" },
      { value: "5000", label: "5K €" },
      { value: "10000", label: "10K €" },
      { value: "20000", label: "20K €" },
      { value: "50000", label: "50K €" },
      { value: "100000", label: "100K €+" },
    ],
  },

  // 8 — Budget (auto-advance)
  {
    id: "budgetMonthly",
    type: "chips",
    title: "Ton budget disponible pour lancer ?",
    field: "budgetMonthly",
    chips: [
      { value: "0", label: "0 €" },
      { value: "500", label: "500 €" },
      { value: "1000", label: "1 000 €" },
      { value: "2000", label: "2 000 €" },
      { value: "5000", label: "5 000 €+" },
    ],
  },

  // 9 — Objectifs business
  {
    id: "objectives",
    type: "chips-multi",
    title: "Tes objectifs principaux ?",
    subtitle: "Sélectionne tout ce qui te correspond.",
    field: "objectives",
    chips: [
      { value: "Trouver ma niche", label: "Trouver ma niche" },
      {
        value: "Creer une offre irresistible",
        label: "Créer une offre irrésistible",
      },
      { value: "Générer des leads", label: "Générer des leads" },
      { value: "Lancer des pubs Meta", label: "Lancer des pubs Meta" },
      {
        value: "Creer un funnel de vente",
        label: "Créer un funnel de vente",
      },
      { value: "Scaler mon activite", label: "Scaler mon activité" },
      { value: "Structurer mon delivery", label: "Structurer mon delivery" },
      {
        value: "Automatiser mon business",
        label: "Automatiser mon business",
      },
    ],
  },

  // ═══════════════════════════════════════
  // Résumé
  // ═══════════════════════════════════════

  // 10 — Summary
  {
    id: "summary",
    type: "summary",
    title: "Résumé de ton profil",
    subtitle: "Vérifie tes réponses avant de lancer l'analyse de marché.",
  },
];
