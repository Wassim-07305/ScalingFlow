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
  // ─── Etape 0.1 — Informations de base ───

  // 0 — Welcome
  {
    id: "welcome",
    type: "welcome",
    title: "Bienvenue sur ScalingFlow",
    subtitle:
      "On va personnaliser ton experience en quelques minutes. Reponds aux questions pour que l'IA s'adapte a toi.",
  },

  // 1 — Prenom [Q-0.1.1]
  {
    id: "firstName",
    type: "text",
    title: "Comment tu t'appelles ?",
    subtitle: "Ton prenom",
    field: "firstName",
    placeholder: "Prenom",
  },

  // 2 — Nom [Q-0.1.2]
  {
    id: "lastName",
    type: "text",
    title: "Et ton nom de famille ?",
    field: "lastName",
    placeholder: "Nom",
  },

  // 3 — Pays / Ville [Q-0.1.3] — aligned with CDC Phase 1.0.1
  {
    id: "country",
    type: "chips",
    title: "Dans quel pays tu operes / veux operer ?",
    field: "country",
    chipColumns: 2,
    chips: [
      { value: "France", label: "France" },
      { value: "USA / Canada", label: "USA / Canada" },
      { value: "UK", label: "UK" },
      { value: "Europe autre", label: "Europe autre" },
      { value: "Afrique francophone", label: "Afrique francophone" },
      { value: "Multiple", label: "Multiple (plusieurs pays)" },
    ],
    hasOther: true,
  },

  // 4 — Langue [Q-0.1.4]
  {
    id: "language",
    type: "chips",
    title: "Quelle langue pour tes clients ?",
    field: "language",
    chips: [
      { value: "fr", label: "Francais" },
      { value: "en", label: "Anglais" },
      { value: "both", label: "Les deux" },
    ],
  },

  // ─── Etape 0.2 — Ton parcours ───

  // 5 — Situation [Q-0.2.1] — 6 options CDC
  {
    id: "situation",
    type: "chips",
    title: "Quelle est ta situation actuelle ?",
    subtitle: "Selectionne la situation qui te correspond le mieux.",
    field: "situation",
    chips: [
      {
        value: "salarie",
        label: "Salarie(e)",
        desc: "J'ai un job et je veux me lancer en parallele.",
      },
      {
        value: "freelance",
        label: "Freelance / Independant",
        desc: "Je fais des missions, je veux structurer et scaler.",
      },
      {
        value: "entrepreneur",
        label: "Entrepreneur",
        desc: "J'ai deja un business en place.",
      },
      {
        value: "etudiant",
        label: "Etudiant(e)",
        desc: "Je suis en etudes et je veux me lancer.",
      },
      {
        value: "reconversion",
        label: "En reconversion",
        desc: "Je change de voie et je veux lancer un business.",
      },
      {
        value: "sans_emploi",
        label: "Sans emploi",
        desc: "Je suis disponible a 100% pour mon projet.",
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

  // 7 — Formations suivies [Q-0.2.2]
  {
    id: "formations",
    type: "textarea",
    title: "Quelles formations as-tu suivies ?",
    subtitle: "Diplomes, certifications, formations en ligne, livres cles...",
    field: "formations_text",
    placeholder: "Ex: MBA Marketing, formation Iman Gadzhi, certif Google Ads...",
  },

  // ─── Etape 0.2b — Tes competences ───

  // 8 — Vault Skills (6 categories)
  {
    id: "vaultSkills",
    type: "skill-matrix",
    title: "Evalue tes competences",
    subtitle: "Pour chaque categorie, selectionne ton niveau actuel. Debutant (je connais les bases) / Intermediaire (je l'ai fait pour moi) / Avance (je l'ai fait pour des clients avec des resultats).",
    field: "vaultSkills",
  },

  // ─── Etape 0.3 — Ton expertise profonde ───

  // 9 — [Q-0.3.1]
  {
    id: "expertise_1",
    type: "textarea",
    title: "Dans quel domaine les gens te demandent le plus souvent conseil ?",
    subtitle: "Ces reponses font emerger ton unfair advantage. L'IA les utilise pour personnaliser toutes les generations.",
    field: "expertise_q1",
    placeholder: "Ex: Le marketing digital, la gestion d'equipe, la nutrition...",
  },
  // 10 — [Q-0.3.2]
  {
    id: "expertise_2",
    type: "textarea",
    title: "Quel probleme tu resous naturellement pour les autres ?",
    field: "expertise_q2",
    placeholder: "Ex: J'aide les gens a structurer leurs idees en plans d'action...",
  },
  // 11 — [Q-0.3.3]
  {
    id: "expertise_3",
    type: "textarea",
    title: "Quel est le meilleur resultat que tu as obtenu pour toi ou pour quelqu'un ?",
    subtitle: "Tu peux ajouter des preuves (screenshots, temoignages) dans le Vault apres l'onboarding.",
    field: "expertise_q3",
    placeholder: "Ex: J'ai aide un client a passer de 2K a 15K/mois en 3 mois...",
  },
  // 12 — [Q-0.3.4]
  {
    id: "expertise_4",
    type: "textarea",
    title: "Si tu devais enseigner une chose en 1h, ce serait quoi ?",
    field: "expertise_q4",
    placeholder: "Ex: Comment creer une offre irresistible en partant de zero...",
  },

  // ─── [Q-0.3.5] Industries / Secteurs ───

  // 13 — Industries (moved here per CDC order)
  {
    id: "industries",
    type: "chips-multi",
    title: "Quels secteurs / industries connais-tu de l'interieur ?",
    subtitle: "Selectionne tous ceux ou tu as de l'experience ou de l'appetence.",
    field: "industries",
    chips: [
      { value: "Fitness / Sport", label: "Fitness / Sport" },
      { value: "Sante / Bien-etre", label: "Sante / Bien-etre" },
      { value: "Immobilier", label: "Immobilier" },
      { value: "E-commerce", label: "E-commerce" },
      { value: "SaaS / Tech", label: "SaaS / Tech" },
      { value: "Finance / Investissement", label: "Finance / Investissement" },
      { value: "Education / Formation", label: "Education / Formation" },
      { value: "Beaute / Esthetique", label: "Beaute / Esthetique" },
      { value: "Restauration / Food", label: "Restauration / Food" },
      { value: "BTP / Artisanat", label: "BTP / Artisanat" },
      { value: "Medical / Paramedical", label: "Medical / Paramedical" },
      { value: "Juridique / Comptable", label: "Juridique / Comptable" },
      { value: "RH / Recrutement", label: "RH / Recrutement" },
      { value: "Marketing / Communication", label: "Marketing / Communication" },
      { value: "Coaching business", label: "Coaching business" },
    ],
    hasOther: true,
  },

  // ─── [Q-0.3.6] Clients payants ───

  // 14 — As-tu deja eu des clients payants ?
  {
    id: "hasPayingClients",
    type: "chips",
    title: "As-tu deja eu des clients payants ?",
    field: "hasPayingClients",
    chips: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
    ],
  },

  // 15 — Details clients payants (conditionnel)
  {
    id: "payingClientsDetails",
    type: "multi-field",
    title: "Parle-nous de tes clients",
    subtitle: "Ces infos enrichissent le profil IA et alimentent les etudes de cas.",
    field: "payingClientsDetails",
    showWhen: (data) => data.hasPayingClients === "oui",
  },

  // ─── Selection de parcours ───

  // 16 — Parcours (visual cards with AI recommendation)
  {
    id: "parcours",
    type: "parcours-selector",
    title: "Quel parcours te correspond ?",
    subtitle: "D'apres ton profil, l'IA te recommande un parcours. Tu peux changer si ca ne correspond pas.",
    field: "parcours",
  },

  // ─── Etape 0.5 — Objectifs et contraintes ───

  // 17 — Objectif revenus mensuels [Q-0.5.1]
  {
    id: "targetRevenue",
    type: "chips",
    title: "Quel est ton objectif de revenus mensuels ?",
    field: "targetRevenue",
    chips: [
      { value: "3000", label: "3K EUR" },
      { value: "5000", label: "5K EUR" },
      { value: "10000", label: "10K EUR" },
      { value: "20000", label: "20K EUR" },
      { value: "50000", label: "50K EUR" },
      { value: "100000", label: "100K EUR+" },
    ],
  },

  // 18 — Budget disponible [Q-0.5.2]
  {
    id: "budgetMonthly",
    type: "chips",
    title: "Quel est ton budget disponible pour lancer ?",
    field: "budgetMonthly",
    chips: [
      { value: "0", label: "0 EUR" },
      { value: "500", label: "500 EUR" },
      { value: "1000", label: "1 000 EUR" },
      { value: "2000", label: "2 000 EUR" },
      { value: "5000", label: "5 000 EUR+" },
    ],
  },

  // 19 — Heures par semaine [Q-0.5.3]
  {
    id: "hoursPerWeek",
    type: "chips",
    title: "Combien d'heures par semaine peux-tu consacrer a ce projet ?",
    field: "hoursPerWeek",
    chips: [
      { value: "5", label: "5h" },
      { value: "10", label: "10h" },
      { value: "20", label: "20h" },
      { value: "40", label: "40h+" },
    ],
  },

  // 20 — Deadline [Q-0.5.4]
  {
    id: "deadline",
    type: "chips",
    title: "Deadline ideale pour ton premier client ?",
    field: "deadline",
    chips: [
      { value: "1_semaine", label: "1 semaine" },
      { value: "1_mois", label: "1 mois" },
      { value: "3_mois", label: "3 mois" },
      { value: "pas_de_rush", label: "Pas de rush" },
    ],
  },

  // 21 — Seul ou equipe [Q-0.5.5]
  {
    id: "teamPreference",
    type: "chips",
    title: "Tu preferes travailler seul ou avec une equipe ?",
    field: "teamPreference",
    chips: [
      { value: "seul", label: "Seul" },
      { value: "equipe", label: "J'ai deja une equipe" },
      { value: "recruter", label: "Je veux recruter" },
    ],
  },

  // ─── Objectifs business ───

  // 22 — Objectifs
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

  // ─── Summary ───

  // 23 — Summary
  {
    id: "summary",
    type: "summary",
    title: "Resume de ton profil",
    subtitle: "Verifie tes reponses avant de lancer l'analyse de marche.",
  },
];
