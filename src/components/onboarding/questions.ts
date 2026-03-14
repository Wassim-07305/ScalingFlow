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
      "On va personnaliser ton expérience en quelques minutes. Réponds aux questions pour que l'IA s'adapte à toi.",
  },

  // 1 — Prenom [Q-0.1.1]
  {
    id: "firstName",
    type: "text",
    title: "Comment tu t'appelles ?",
    subtitle: "Ton prénom",
    field: "firstName",
    placeholder: "Prénom",
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
    title: "Dans quel pays tu opères / veux opérer ?",
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
      { value: "fr", label: "Français" },
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
    subtitle: "Sélectionne la situation qui te correspond le mieux.",
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

  // 6 — Situation Details (conditionnel)
  {
    id: "situationDetails",
    type: "multi-field",
    title: "Dis-nous en plus sur ta situation",
    subtitle: "Ces infos aident l'IA à personnaliser ton parcours.",
    field: "situationDetails",
    showWhen: (data) =>
      data.situation !== "" && data.situation !== undefined,
  },

  // 7 — Formations suivies [Q-0.2.2]
  {
    id: "formations",
    type: "textarea",
    title: "Quelles formations as-tu suivies ?",
    subtitle: "Diplômes, certifications, formations en ligne, livres clés...",
    field: "formations_text",
    placeholder: "Ex: MBA Marketing, formation Iman Gadzhi, certif Google Ads...",
  },

  // ─── Étape 0.2b — Tes compétences ───

  // 8 — Vault Skills (6 categories)
  {
    id: "vaultSkills",
    type: "skill-matrix",
    title: "Évalue tes compétences",
    subtitle: "Pour chaque catégorie, sélectionne ton niveau actuel. Débutant = je connais les bases. Intermédiaire = je l'ai fait pour moi. Avancé = je l'ai fait pour des clients avec des résultats.",
    field: "vaultSkills",
  },

  // ─── Etape 0.3 — Ton expertise profonde ───

  // 9 — [Q-0.3.1]
  {
    id: "expertise_1",
    type: "textarea",
    title: "Dans quel domaine les gens te demandent le plus souvent conseil ?",
    subtitle: "Ces réponses font émerger ton unfair advantage. L'IA les utilise pour personnaliser toutes les générations.",
    field: "expertise_q1",
    placeholder: "Ex: Le marketing digital, la gestion d'equipe, la nutrition...",
  },
  // 10 — [Q-0.3.2]
  {
    id: "expertise_2",
    type: "textarea",
    title: "Quel problème tu résous naturellement pour les autres ?",
    field: "expertise_q2",
    placeholder: "Ex: J'aide les gens à structurer leurs idées en plans d'action...",
  },
  // 11 — [Q-0.3.3]
  {
    id: "expertise_3",
    type: "textarea",
    title: "Quel est le meilleur résultat que tu as obtenu pour toi ou pour quelqu'un ?",
    subtitle: "Tu peux ajouter des preuves (screenshots, témoignages) dans le Vault après l'onboarding.",
    field: "expertise_q3",
    placeholder: "Ex: J'ai aidé un client à passer de 2K à 15K/mois en 3 mois...",
  },
  // 12 — [Q-0.3.4]
  {
    id: "expertise_4",
    type: "textarea",
    title: "Si tu devais enseigner une chose en 1h, ce serait quoi ?",
    field: "expertise_q4",
    placeholder: "Ex: Comment créer une offre irrésistible en partant de zéro...",
  },

  // ─── [Q-0.3.5] Industries / Secteurs ───

  // 13 — Industries (moved here per CDC order)
  {
    id: "industries",
    type: "chips-multi",
    title: "Quels secteurs / industries connais-tu de l'intérieur ?",
    subtitle: "Sélectionne tous ceux où tu as de l'expérience ou de l'appétence.",
    field: "industries",
    chips: [
      { value: "Fitness / Sport", label: "Fitness / Sport" },
      { value: "Sante / Bien-etre", label: "Santé / Bien-être" },
      { value: "Immobilier", label: "Immobilier" },
      { value: "E-commerce", label: "E-commerce" },
      { value: "SaaS / Tech", label: "SaaS / Tech" },
      { value: "Finance / Investissement", label: "Finance / Investissement" },
      { value: "Education / Formation", label: "Education / Formation" },
      { value: "Beaute / Esthetique", label: "Beauté / Esthétique" },
      { value: "Restauration / Food", label: "Restauration / Food" },
      { value: "BTP / Artisanat", label: "BTP / Artisanat" },
      { value: "Medical / Paramedical", label: "Médical / Paramédical" },
      { value: "Juridique / Comptable", label: "Juridique / Comptable" },
      { value: "RH / Recrutement", label: "RH / Recrutement" },
      { value: "Marketing / Communication", label: "Marketing / Communication" },
      { value: "Coaching business", label: "Coaching business" },
    ],
    hasOther: true,
  },

  // ─── [Q-0.3.6] Clients payants ───

  // 14 — As-tu déjà eu des clients payants ?
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

  // 15 — Details clients payants (conditionnel)
  {
    id: "payingClientsDetails",
    type: "multi-field",
    title: "Parle-nous de tes clients",
    subtitle: "Ces infos enrichissent le profil IA et alimentent les études de cas.",
    field: "payingClientsDetails",
    showWhen: (data) => data.hasPayingClients === "oui",
  },

  // ─── Selection de parcours ───

  // 16 — Parcours (visual cards with AI recommendation)
  {
    id: "parcours",
    type: "parcours-selector",
    title: "Quel parcours te correspond ?",
    subtitle: "D'après ton profil, l'IA te recommande un parcours. Tu peux changer si ça ne correspond pas.",
    field: "parcours",
  },

  // ─── Phase 1 — Questions specifiques par parcours ───

  // A1 — Partir de Zero
  {
    id: "phase1_a1_motivation",
    type: "textarea",
    title: "Qu'est-ce qui te motive à te lancer maintenant ?",
    subtitle: "Comprendre ta motivation aide l'IA à trouver un marché qui te correspond vraiment.",
    field: "phase1_a1_motivation",
    placeholder: "Ex: Je veux quitter le salariat, avoir plus de liberté, générer des revenus en ligne...",
    showWhen: (data) => data.parcours === "A1",
  },
  {
    id: "phase1_a1_quickwin",
    type: "textarea",
    title: "Si tu pouvais obtenir un premier résultat rapide, ce serait quoi ?",
    subtitle: "Ton premier quick-win idéal — l'IA va orienter l'analyse vers des marchés à cycle court.",
    field: "phase1_a1_quickwin",
    placeholder: "Ex: Signer mon premier client à 500 EUR, faire ma première vente en ligne...",
    showWhen: (data) => data.parcours === "A1",
  },
  {
    id: "phase1_a1_learning",
    type: "textarea",
    title: "Comment tu apprends le mieux ?",
    subtitle: "Cela influence le type de marché et de modèle recommandé.",
    field: "phase1_a1_learning",
    placeholder: "Ex: En faisant (learning by doing), en regardant des vidéos, avec un mentor...",
    showWhen: (data) => data.parcours === "A1",
  },

  // A2 — Salarie en Reconversion
  {
    id: "phase1_a2_transferable",
    type: "textarea",
    title: "Quelle expertise de ton job actuel pourrait se monétiser ?",
    subtitle: "Ton savoir-faire métier est ton avantage — l'IA va identifier les marchés qui le valorisent.",
    field: "phase1_a2_transferable",
    placeholder: "Ex: Gestion de projet, expertise comptable, connaissance du secteur pharma...",
    showWhen: (data) => data.parcours === "A2",
  },
  {
    id: "phase1_a2_transition",
    type: "textarea",
    title: "Quel est ton plan de transition ?",
    subtitle: "L'IA adapte les recommandations à ton rythme de transition.",
    field: "phase1_a2_transition",
    placeholder: "Ex: En parallèle de mon job, démission dans 6 mois, rupture conventionnelle...",
    showWhen: (data) => data.parcours === "A2",
  },
  {
    id: "phase1_a2_trigger",
    type: "textarea",
    title: "Qu'est-ce qui te ferait franchir le pas ?",
    subtitle: "Ton déclencheur — l'IA oriente vers des marchés où ce seuil est atteignable.",
    field: "phase1_a2_trigger",
    placeholder: "Ex: Atteindre 3K/mois en side, avoir 5 clients réguliers, remplacer mon salaire...",
    showWhen: (data) => data.parcours === "A2",
  },

  // A3 — Freelance
  {
    id: "phase1_a3_ideal_offer",
    type: "textarea",
    title: "À quoi ressemblerait ton offre idéale scalable ?",
    subtitle: "Passe de la mission ponctuelle au package scalable — l'IA t'aide à trouver le bon angle.",
    field: "phase1_a3_ideal_offer",
    placeholder: "Ex: Un forfait mensuel de gestion Meta Ads, un programme de formation en ligne...",
    showWhen: (data) => data.parcours === "A3",
  },
  {
    id: "phase1_a3_pricing_blocker",
    type: "textarea",
    title: "Qu'est-ce qui t'empêche de facturer plus cher ?",
    subtitle: "L'IA identifie les marchés où tu peux augmenter tes tarifs naturellement.",
    field: "phase1_a3_pricing_blocker",
    placeholder: "Ex: Trop de concurrence, clients PME avec petit budget, pas de spécialisation...",
    showWhen: (data) => data.parcours === "A3",
  },
  {
    id: "phase1_a3_acquisition",
    type: "textarea",
    title: "Quel serait ton système d'acquisition idéal ?",
    subtitle: "L'IA va recommander des marchés compatibles avec ton canal préféré.",
    field: "phase1_a3_acquisition",
    placeholder: "Ex: Publicité Meta, LinkedIn outbound, referral, contenu organique...",
    showWhen: (data) => data.parcours === "A3",
  },

  // B — Scaler mon Business
  {
    id: "phase1_b_channel",
    type: "textarea",
    title: "Quel est ton canal d'acquisition principal aujourd'hui ?",
    subtitle: "L'IA analyse ton canal actuel pour recommander des leviers de croissance.",
    field: "phase1_b_channel",
    placeholder: "Ex: Meta Ads, bouche-à-oreille, SEO, LinkedIn, partenariats...",
    showWhen: (data) => data.parcours === "B",
  },
  {
    id: "phase1_b_bottleneck",
    type: "textarea",
    title: "Quel est ton plus gros bottleneck pour croître ?",
    subtitle: "L'IA priorise les marchés et stratégies qui résolvent ce blocage spécifique.",
    field: "phase1_b_bottleneck",
    placeholder: "Ex: Pas assez de leads qualifiés, taux de closing trop bas, delivery qui ne scale pas...",
    showWhen: (data) => data.parcours === "B",
  },
  {
    id: "phase1_b_metrics",
    type: "textarea",
    title: "Quelles métriques tu suis déjà ?",
    subtitle: "L'IA utilise tes KPIs pour affiner ses recommandations de scaling.",
    field: "phase1_b_metrics",
    placeholder: "Ex: CAC 50EUR, LTV 2000EUR, taux de closing 20%, ROAS 3x...",
    showWhen: (data) => data.parcours === "B",
  },

  // C — Pivoter
  {
    id: "phase1_c_reason",
    type: "textarea",
    title: "Pourquoi tu veux pivoter ?",
    subtitle: "Comprendre ce qui ne marche plus aide l'IA à éviter les mêmes erreurs sur le nouveau marché.",
    field: "phase1_c_reason",
    placeholder: "Ex: Marché saturé, marges trop faibles, pas de passion, clients toxiques...",
    showWhen: (data) => data.parcours === "C",
  },
  {
    id: "phase1_c_assets",
    type: "textarea",
    title: "Quels assets peux-tu réutiliser ?",
    subtitle: "L'IA cherche des marchés où tes assets existants te donnent un avantage.",
    field: "phase1_c_assets",
    placeholder: "Ex: Liste email de 5000 contacts, audience YouTube, expertise en Meta Ads, réseau pro...",
    showWhen: (data) => data.parcours === "C",
  },
  {
    id: "phase1_c_positioning",
    type: "textarea",
    title: "Quel serait ton positionnement idéal sur le nouveau marché ?",
    subtitle: "L'IA va valider cette vision et proposer des angles différenciants.",
    field: "phase1_c_positioning",
    placeholder: "Ex: Expert automatisation IA pour agences, consultant growth pour SaaS B2B...",
    showWhen: (data) => data.parcours === "C",
  },

  // ─── Etape 0.5 — Objectifs et contraintes ───

  // 17 — Objectif revenus mensuels [Q-0.5.1]
  {
    id: "targetRevenue",
    type: "chips",
    title: "Ton objectif de revenus mensuels ?",
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
    title: "Combien d'heures par semaine peux-tu consacrer à ce projet ?",
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
    title: "Deadline idéale pour ton premier client ?",
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
    title: "Tu préfères travailler seul ou avec une équipe ?",
    field: "teamPreference",
    chips: [
      { value: "seul", label: "Seul" },
      { value: "equipe", label: "J'ai déjà une équipe" },
      { value: "recruter", label: "Je veux recruter" },
    ],
  },

  // ─── Objectifs business ───

  // 22 — Objectifs
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

  // ─── Summary ───

  // 23 — Summary
  {
    id: "summary",
    type: "summary",
    title: "Résumé de ton profil",
    subtitle: "Vérifie tes réponses avant de lancer l'analyse de marché.",
  },
];
