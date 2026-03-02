export type QuestionType =
  | "welcome"
  | "text"
  | "text-euro"
  | "textarea"
  | "chips"
  | "chips-multi"
  | "multi-field"
  | "skill-matrix"
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
  // 0 — Welcome
  {
    id: "welcome",
    type: "welcome",
    title: "Bienvenue sur ScalingFlow",
    subtitle:
      "On va personnaliser ton experience en quelques minutes. Reponds aux questions pour que l'IA s'adapte a toi.",
  },

  // 1 — Prenom
  {
    id: "firstName",
    type: "text",
    title: "Comment tu t'appelles ?",
    subtitle: "Ton prenom",
    field: "firstName",
    placeholder: "Prenom",
  },

  // 2 — Nom
  {
    id: "lastName",
    type: "text",
    title: "Et ton nom de famille ?",
    field: "lastName",
    placeholder: "Nom",
  },

  // 3 — Pays
  {
    id: "country",
    type: "chips",
    title: "Tu es base ou ?",
    field: "country",
    chipColumns: 2,
    chips: [
      { value: "France", label: "France" },
      { value: "Belgique", label: "Belgique" },
      { value: "Suisse", label: "Suisse" },
      { value: "Canada", label: "Canada" },
      { value: "Maroc", label: "Maroc" },
      { value: "Tunisie", label: "Tunisie" },
      { value: "Algerie", label: "Algerie" },
    ],
    hasOther: true,
  },

  // 4 — Langue
  {
    id: "language",
    type: "chips",
    title: "Quelle est ta langue principale ?",
    field: "language",
    chips: [
      { value: "fr", label: "Francais" },
      { value: "en", label: "Anglais" },
      { value: "ar", label: "Arabe" },
    ],
  },

  // 5 — Situation
  {
    id: "situation",
    type: "chips",
    title: "Quelle est ta situation actuelle ?",
    subtitle: "Selectionne la situation qui te correspond le mieux.",
    field: "situation",
    chips: [
      {
        value: "zero",
        label: "Partir de zero",
        desc: "Je n'ai pas encore de business en ligne.",
      },
      {
        value: "salarie",
        label: "Salarie(e)",
        desc: "Je suis employe(e) et je veux me lancer.",
      },
      {
        value: "freelance",
        label: "Freelance",
        desc: "Je suis independant(e) et je veux scaler.",
      },
      {
        value: "entrepreneur",
        label: "Entrepreneur",
        desc: "J'ai deja un business en place.",
      },
    ],
  },

  // 6 — Situation Details (conditionnel)
  {
    id: "situationDetails",
    type: "multi-field",
    title: "Dis-nous en plus sur ta situation",
    subtitle: "Ces infos aident l'IA a personnaliser ton parcours.",
    field: "situationDetails",
    showWhen: (data) =>
      data.situation !== "" && data.situation !== undefined,
  },

  // 7 — Vault Skills
  {
    id: "vaultSkills",
    type: "skill-matrix",
    title: "Evalue tes competences",
    subtitle: "Pour chaque categorie, selectionne ton niveau actuel.",
    field: "vaultSkills",
  },

  // 8-13 — Expertise (6 questions)
  {
    id: "expertise_1",
    type: "textarea",
    title: "Quel est ton plus grand accomplissement professionnel ?",
    subtitle:
      "Ces reponses permettront a l'IA de creer du contenu ultra-personnalise.",
    field: "expertise_q1",
    placeholder: "Decris ton accomplissement...",
  },
  {
    id: "expertise_2",
    type: "textarea",
    title: "Quelle est ta methode ou process unique ?",
    field: "expertise_q2",
    placeholder: "Decris ta methode...",
  },
  {
    id: "expertise_3",
    type: "textarea",
    title: "Quel resultat concret as-tu obtenu pour un client ?",
    field: "expertise_q3",
    placeholder: "Decris le resultat...",
  },
  {
    id: "expertise_4",
    type: "textarea",
    title: "Quel probleme resous-tu mieux que quiconque ?",
    field: "expertise_q4",
    placeholder: "Decris le probleme...",
  },
  {
    id: "expertise_5",
    type: "textarea",
    title: "Qu'est-ce que tes clients disent de toi ?",
    field: "expertise_q5",
    placeholder: "Temoignages, retours...",
  },
  {
    id: "expertise_6",
    type: "textarea",
    title: "Quel est ton 'unfair advantage' ?",
    subtitle: "Ce qui te differencie de la concurrence.",
    field: "expertise_q6",
    placeholder: "Ton avantage unique...",
  },

  // 14 — Parcours
  {
    id: "parcours",
    type: "chips",
    title: "Quel parcours te correspond ?",
    subtitle: "L'IA adaptera son accompagnement en consequence.",
    field: "parcours",
    chips: [
      {
        value: "A1",
        label: "Partir de Zero",
        desc: "Tu n'as jamais lance de business en ligne.",
      },
      {
        value: "A2",
        label: "Salarie → Freelance",
        desc: "Tu veux quitter ton job pour te lancer.",
      },
      {
        value: "A3",
        label: "Freelance → Entrepreneur",
        desc: "Tu es freelance et veux scaler.",
      },
      {
        value: "B",
        label: "Scaler",
        desc: "Tu as deja un business et veux passer au niveau superieur.",
      },
      {
        value: "C",
        label: "Pivoter",
        desc: "Tu veux changer de niche ou repositionner ton offre.",
      },
    ],
  },

  // 15 — Experience
  {
    id: "experienceLevel",
    type: "chips",
    title: "Ton niveau d'experience ?",
    field: "experienceLevel",
    chips: [
      { value: "beginner", label: "Debutant", desc: "< 1 an de freelance" },
      { value: "intermediate", label: "Intermediaire", desc: "1-3 ans" },
      { value: "advanced", label: "Avance", desc: "3+ ans" },
    ],
  },

  // 16 — Revenu actuel
  {
    id: "currentRevenue",
    type: "text-euro",
    title: "Ton revenu mensuel actuel ?",
    field: "currentRevenue",
    placeholder: "Ex: 5000",
  },

  // 17 — Objectif revenu
  {
    id: "targetRevenue",
    type: "text-euro",
    title: "Ton objectif de revenu mensuel ?",
    field: "targetRevenue",
    placeholder: "Ex: 30000",
  },

  // 18 — Industries
  {
    id: "industries",
    type: "chips-multi",
    title: "Dans quelles industries as-tu travaille ?",
    subtitle: "Selectionne une ou plusieurs industries.",
    field: "industries",
    chips: [
      { value: "E-commerce", label: "E-commerce" },
      { value: "SaaS", label: "SaaS" },
      { value: "Immobilier", label: "Immobilier" },
      { value: "Sante", label: "Sante" },
      { value: "Finance", label: "Finance" },
      { value: "Education", label: "Education" },
      { value: "Restaurant / Food", label: "Restaurant / Food" },
      { value: "Agences marketing", label: "Agences marketing" },
      { value: "Coaching / Consulting", label: "Coaching / Consulting" },
      { value: "Juridique", label: "Juridique" },
      { value: "BTP / Construction", label: "BTP / Construction" },
      { value: "Logistique", label: "Logistique" },
    ],
  },

  // 19 — Objectifs
  {
    id: "objectives",
    type: "chips-multi",
    title: "Tes objectifs principaux ?",
    subtitle: "Selectionne tout ce qui te correspond.",
    field: "objectives",
    chips: [
      { value: "Trouver ma niche", label: "Trouver ma niche" },
      {
        value: "Creer une offre irresistible",
        label: "Creer une offre irresistible",
      },
      { value: "Generer des leads", label: "Generer des leads" },
      { value: "Lancer des pubs Meta", label: "Lancer des pubs Meta" },
      {
        value: "Creer un funnel de vente",
        label: "Creer un funnel de vente",
      },
      { value: "Scaler mon activite", label: "Scaler mon activite" },
      { value: "Structurer mon delivery", label: "Structurer mon delivery" },
      {
        value: "Automatiser mon business",
        label: "Automatiser mon business",
      },
    ],
  },

  // 20 — Budget
  {
    id: "budgetMonthly",
    type: "chips",
    title: "Ton budget pub mensuel ?",
    field: "budgetMonthly",
    chips: [
      { value: "0", label: "0 EUR - Pas de budget" },
      { value: "500", label: "500 EUR/mois" },
      { value: "1000", label: "1 000 EUR/mois" },
      { value: "2000", label: "2 000 EUR/mois" },
      { value: "5000", label: "5 000+ EUR/mois" },
    ],
  },

  // 21 — Summary
  {
    id: "summary",
    type: "summary",
    title: "Resume de ton profil",
    subtitle: "Verifie tes reponses avant de lancer l'analyse de marche.",
  },
];
