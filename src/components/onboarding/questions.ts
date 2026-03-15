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
  | "parcours-questions"
  | "slider"
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

  // 1 — Prénom (CDC Q-0.1.1)
  {
    id: "firstName",
    type: "text",
    title: "Comment tu t'appelles ?",
    subtitle: "Ton prénom",
    field: "firstName",
    placeholder: "Prénom",
  },

  // 1b — Pays (CDC Q-0.1.3)
  {
    id: "country",
    type: "chips",
    title: "Dans quel pays tu opères / veux opérer ?",
    field: "country",
    chips: [
      { value: "France", label: "France" },
      { value: "USA / Canada", label: "USA / Canada" },
      { value: "UK", label: "UK" },
      { value: "Europe autre", label: "Europe autre" },
      { value: "Afrique francophone", label: "Afrique francophone" },
      { value: "Multiple", label: "Multiple" },
    ],
  },

  // 1c — Langue (CDC Q-0.1.4)
  {
    id: "language",
    type: "chips",
    title: "Quelle langue pour tes clients ?",
    field: "language",
    chips: [
      { value: "fr", label: "Français" },
      { value: "en", label: "Anglais" },
      { value: "both", label: "Les deux" },
    ],
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
    showWhen: (data) => data.situation !== "" && data.situation !== undefined,
  },

  // 4 — Compétences par catégories (skill-matrix CDC Étape 0.2b — 7 catégories)
  {
    id: "skillMatrix",
    type: "skill-matrix",
    title: "Tes compétences",
    subtitle:
      "Sélectionne les compétences que tu maîtrises et indique ton niveau.",
    field: "vaultSkills",
  },

  // 5 — Expertise profonde (CDC Étape 0.3)
  {
    id: "expertiseProfonde",
    type: "multi-field",
    title: "Ton expertise profonde",
    subtitle:
      "Ces questions font émerger ce que tu ne sais pas forcément formuler. C'est là où on identifie ton unfair advantage.",
    field: "expertiseProfonde",
  },

  // 6 — Industries
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
      { value: "Juridique / Comptable", label: "Juridique / Comptable" },
      { value: "RH / Recrutement", label: "RH / Recrutement" },
      {
        value: "Marketing / Communication",
        label: "Marketing / Communication",
      },
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

  // 8 — Questions parcours-spécifiques (CDC Phase 1 — TRUTH adapté)
  {
    id: "parcoursQuestions",
    type: "parcours-questions",
    title: "Approfondissons ton profil",
    subtitle: "Questions adaptées à ton parcours pour personnaliser l'IA.",
    field: "parcoursAnswers",
    showWhen: (data) => !!data.parcours && data.parcours !== "",
  },

  // 9 — Objectif revenus (auto-advance)
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

  // 13 — Heures par semaine (CDC Q-0.5.3)
  {
    id: "hoursPerWeek",
    type: "chips",
    title: "Combien d'heures par semaine peux-tu consacrer à ce projet ?",
    field: "hoursPerWeek",
    chips: [
      { value: "5", label: "5h" },
      { value: "10", label: "10h" },
      { value: "20", label: "20h" },
      { value: "40", label: "40h+" },
    ],
  },

  // 14 — Deadline (CDC Q-0.5.4)
  {
    id: "deadline",
    type: "chips",
    title: "Deadline idéale pour ton premier client ?",
    field: "deadline",
    chips: [
      { value: "1_semaine", label: "1 semaine" },
      { value: "1_mois", label: "1 mois" },
      { value: "3_mois", label: "3 mois" },
      { value: "pas_de_rush", label: "Pas de rush" },
    ],
  },

  // 15 — Préférence équipe (CDC Q-0.5.5)
  {
    id: "teamPreference",
    type: "chips",
    title: "Tu préfères travailler seul ou avec une équipe ?",
    field: "teamPreference",
    chips: [
      { value: "seul", label: "Seul" },
      { value: "equipe", label: "J'ai déjà une équipe" },
      { value: "recruter", label: "Je veux recruter" },
    ],
  },

  // 16 — Clients payants (CDC Q-0.3.6)
  {
    id: "hasPayingClients",
    type: "chips",
    title: "As-tu déjà eu des clients payants ?",
    field: "hasPayingClients",
    chips: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
    ],
  },

  // ═══════════════════════════════════════
  // Résumé
  // ═══════════════════════════════════════

  // 17 — Summary
  {
    id: "summary",
    type: "summary",
    title: "Résumé de ton profil",
    subtitle: "Vérifie tes réponses avant de lancer l'analyse de marché.",
  },
];
