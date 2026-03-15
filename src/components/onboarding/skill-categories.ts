// ─── CDC Étape 0.2b : 7 catégories de compétences avec sous-compétences ───

export interface SkillItem {
  id: string;
  label: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: SkillItem[];
}

export type SkillLevel = "debutant" | "intermediaire" | "avance";

export interface SelectedSkill {
  skillId: string;
  categoryId: string;
  level: SkillLevel;
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "acquisition",
    name: "Acquisition & Prospection",
    skills: [
      { id: "prospection_linkedin", label: "Prospection LinkedIn" },
      { id: "prospection_instagram", label: "Prospection Instagram (DM)" },
      { id: "cold_email", label: "Cold email" },
      { id: "cold_call", label: "Cold call" },
      { id: "setting", label: "Setting (qualification de leads)" },
      { id: "networking", label: "Networking / bouche à oreille" },
    ],
  },
  {
    id: "vente",
    name: "Vente & Closing",
    skills: [
      { id: "closing_call", label: "Closing en call" },
      { id: "closing_dm", label: "Closing en DM" },
      {
        id: "propositions_commerciales",
        label: "Rédaction de propositions commerciales",
      },
      { id: "negociation", label: "Négociation" },
      { id: "upsell_crosssell", label: "Upsell / Cross-sell" },
    ],
  },
  {
    id: "contenu",
    name: "Création de contenu",
    skills: [
      { id: "reels", label: "Reels / vidéos courtes" },
      { id: "youtube", label: "YouTube (vidéos longues)" },
      { id: "copywriting", label: "Copywriting (textes de vente, emails)" },
      { id: "carousels", label: "Carousels / posts écrits" },
      { id: "stories", label: "Stories Instagram" },
      { id: "podcasts", label: "Podcasts" },
      { id: "newsletters", label: "Newsletters" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Ads",
    skills: [
      { id: "meta_ads", label: "Meta Ads (Facebook/Instagram)" },
      { id: "google_ads", label: "Google Ads" },
      { id: "tiktok_ads", label: "TikTok Ads" },
      { id: "seo", label: "SEO" },
      { id: "influence", label: "Influence / partenariats" },
    ],
  },
  {
    id: "delivery",
    name: "Delivery & Gestion client",
    skills: [
      { id: "coaching_1on1", label: "Coaching 1-on-1" },
      { id: "coaching_groupe", label: "Coaching de groupe" },
      { id: "creation_formations", label: "Création de formations" },
      { id: "gestion_projet", label: "Gestion de projet client" },
      { id: "consulting", label: "Consulting / audit" },
      { id: "done_for_you", label: "Done-for-you (prestation)" },
    ],
  },
  {
    id: "automatisation",
    name: "Automatisation & Outils",
    skills: [
      { id: "nocode", label: "No-code (Make, N8N, Zapier)" },
      { id: "crm", label: "CRM (GHL, HubSpot, etc.)" },
      { id: "ia", label: "IA (ChatGPT, Claude, agents IA)" },
      { id: "montage_video", label: "Montage vidéo" },
      { id: "design", label: "Design (Canva, Figma)" },
      { id: "dev_web", label: "Développement web / code" },
    ],
  },
  {
    id: "strategie",
    name: "Stratégie & Business",
    skills: [
      { id: "business_plan", label: "Business plan / modèle économique" },
      { id: "pricing", label: "Stratégie de pricing" },
      { id: "branding", label: "Personal branding" },
      { id: "management", label: "Management d'équipe" },
      { id: "finance", label: "Finance / comptabilité" },
    ],
  },
];

// ─── Expertise profonde fields (CDC Étape 0.3) ───

export const EXPERTISE_PROFONDE_FIELDS = [
  {
    key: "conseil_domaine",
    label: "Dans quel domaine les gens te demandent le plus souvent conseil ?",
    placeholder:
      "Ex : Le marketing digital, la vente, la création de contenu...",
  },
  {
    key: "probleme_resolu",
    label: "Quel problème tu résous naturellement pour les autres ?",
    placeholder: "Ex : J'aide les gens à structurer leurs process...",
  },
  {
    key: "meilleur_resultat",
    label:
      "Quel est le meilleur résultat que tu as obtenu pour toi ou pour quelqu'un ?",
    placeholder: "Ex : J'ai aidé un client à passer de 2K à 15K/mois...",
  },
  {
    key: "enseigner_1h",
    label: "Si tu devais enseigner une chose en 1h, ce serait quoi ?",
    placeholder: "Ex : Comment créer une offre irrésistible...",
  },
];

// ─── Parcours-specific questions (CDC Phase 1) ───

export const PARCOURS_QUESTIONS: Record<
  string,
  {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    options?: { value: string; label: string }[];
  }[]
> = {
  A1: [
    {
      key: "market_approach",
      label: "Comment tu veux procéder ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "idee", label: "J'ai une idée de marché" },
        { value: "pas_encore", label: "Je ne sais pas encore" },
      ],
    },
    {
      key: "market_interest",
      label: "Quel marché t'intéresse ?",
      placeholder: "Ex : Le coaching fitness, la formation en ligne...",
    },
    {
      key: "market_reason",
      label: "Pourquoi ce marché ?",
      placeholder:
        "Ex : J'ai une passion pour le fitness et je connais bien les problèmes...",
    },
    {
      key: "market_contacts",
      label: "Tu connais des gens dans ce marché personnellement ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
  ],
  A2: [
    {
      key: "poste_actuel",
      label: "Quel est ton poste actuel ?",
      placeholder: "Ex : Chef de projet, Commercial B2B, DRH...",
    },
    {
      key: "duree_poste",
      label: "Depuis combien de temps tu fais ce métier ?",
      placeholder: "Ex : 5 ans",
    },
    {
      key: "force_reconnue",
      label: "Qu'est-ce que tes collègues/boss te reconnaissent comme force ?",
      placeholder: "Ex : Ma capacité à organiser les process...",
    },
    {
      key: "a_forme",
      label: "As-tu déjà formé ou mentoré quelqu'un dans ton job ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
    {
      key: "probleme_industrie",
      label:
        "Quel problème récurrent tu vois dans ton industrie que personne ne résout bien ?",
      placeholder: "Ex : Les PME n'ont pas de process RH structurés...",
    },
  ],
  A3: [
    {
      key: "type_missions",
      label: "Quel type de missions tu fais ?",
      placeholder: "Ex : Développement web, consulting marketing...",
    },
    {
      key: "type_clients",
      label: "Pour quel type de clients ?",
      placeholder: "Ex : PME, startups, agences...",
    },
    {
      key: "ca_mensuel",
      label: "Quel est ton CA mensuel moyen ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "0-2K", label: "0-2K€" },
        { value: "2-5K", label: "2-5K€" },
        { value: "5-10K", label: "5-10K€" },
        { value: "10-15K", label: "10-15K€" },
        { value: "15K+", label: "15K€+" },
      ],
    },
    {
      key: "tarif_actuel",
      label: "Quel est ton tarif actuel ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "tjm", label: "TJM (tarif journalier)" },
        { value: "forfait", label: "Forfait par projet" },
        { value: "resultat", label: "Au résultat" },
        { value: "mix", label: "Mix" },
      ],
    },
    {
      key: "clients_simultanes",
      label: "Combien de clients tu gères en simultané ?",
      placeholder: "Ex : 5",
      type: "number",
    },
    {
      key: "plus_gros_resultat",
      label: "Quel est ton plus gros résultat client ?",
      placeholder: "Ex : Client passé de 3K à 12K/mois...",
    },
    {
      key: "acquisition_clients",
      label: "Comment tu trouves tes clients aujourd'hui ?",
      placeholder: "",
      type: "multi-select",
      options: [
        { value: "bouche_oreille", label: "Bouche à oreille" },
        { value: "linkedin", label: "LinkedIn" },
        { value: "malt", label: "Malt / plateformes" },
        { value: "prospection", label: "Prospection directe" },
        { value: "reseaux_sociaux", label: "Réseaux sociaux" },
        { value: "ads", label: "Ads" },
        { value: "partenariats", label: "Partenariats" },
      ],
    },
    {
      key: "frustrations",
      label: "Qu'est-ce qui te frustre le plus dans ton modèle actuel ?",
      placeholder: "",
      type: "multi-select",
      options: [
        {
          value: "temps_argent",
          label: "Je trade mon temps contre de l'argent",
        },
        { value: "pas_recurrent", label: "Pas de revenus récurrents" },
        {
          value: "depend_clients",
          label: "Je dépends de quelques gros clients",
        },
        {
          value: "pas_packager",
          label: "Je ne sais pas comment packager mon offre",
        },
        { value: "prix_bas", label: "Je n'arrive pas à augmenter mes prix" },
        { value: "seul", label: "Je suis seul et je fais tout moi-même" },
      ],
    },
    {
      key: "scaler_ou_pivoter",
      label: "Tu veux scaler ton marché actuel ou explorer un nouveau marché ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "scaler", label: "Scaler mon marché actuel" },
        { value: "explorer", label: "Explorer un nouveau marché" },
      ],
    },
  ],
  B: [
    {
      key: "ca_mensuel",
      label: "Quel est ton CA mensuel actuel ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "2-5K", label: "2-5K€" },
        { value: "5-10K", label: "5-10K€" },
        { value: "10-20K", label: "10-20K€" },
        { value: "20-50K", label: "20-50K€" },
        { value: "50K+", label: "50K€+" },
      ],
    },
    {
      key: "offre_principale",
      label: "Quelle est ton offre principale ?",
      placeholder: "Ex : Accompagnement coaching 3 mois à 3000€...",
    },
    {
      key: "prix_offre",
      label: "À quel prix ?",
      placeholder: "Ex : 2000€",
    },
    {
      key: "clients_actifs",
      label: "Combien de clients actifs ?",
      placeholder: "Ex : 15",
      type: "number",
    },
    {
      key: "marge",
      label: "Quelle est ta marge ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "20-40", label: "20-40%" },
        { value: "40-60", label: "40-60%" },
        { value: "60-80", label: "60-80%" },
        { value: "80+", label: "80%+" },
      ],
    },
    {
      key: "acquisition_clients",
      label: "Comment tu acquiers tes clients ?",
      placeholder: "",
      type: "multi-select",
      options: [
        { value: "instagram", label: "Organique Instagram" },
        { value: "youtube", label: "YouTube" },
        { value: "linkedin", label: "LinkedIn" },
        { value: "meta_ads", label: "Meta Ads" },
        { value: "google_ads", label: "Google Ads" },
        { value: "prospection", label: "Prospection" },
        { value: "bouche_oreille", label: "Bouche à oreille" },
        { value: "partenariats", label: "Partenariats" },
      ],
    },
    {
      key: "a_funnel",
      label: "As-tu un funnel en place ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
    {
      key: "a_crm",
      label: "As-tu un CRM ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
    {
      key: "a_setter",
      label: "As-tu un setter/closer ?",
      placeholder: "",
      type: "select",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
        { value: "recruter", label: "Je veux en recruter" },
      ],
    },
    {
      key: "bottleneck",
      label: "Quel est ton plus gros bottleneck actuel ?",
      placeholder: "",
      type: "multi-select",
      options: [
        { value: "pas_leads", label: "Pas assez de leads" },
        { value: "leads_non_qualifies", label: "Leads pas qualifiés" },
        { value: "closing_bas", label: "Taux de closing trop bas" },
        {
          value: "delivery_temps",
          label: "Delivery qui me prend trop de temps",
        },
        {
          value: "pas_recurrence",
          label: "Pas de récurrence / revenus instables",
        },
        { value: "tout_seul", label: "Je fais tout moi-même" },
        { value: "scaler_ads", label: "Je ne sais pas comment scaler mes ads" },
        {
          value: "contenu_convertit_pas",
          label: "Mon contenu ne convertit pas",
        },
      ],
    },
  ],
  C: [
    {
      key: "raison_pivot",
      label: "Pourquoi tu veux pivoter ?",
      placeholder:
        "Ex : Mon marché est saturé, je m'ennuie, pas assez de demande...",
    },
    {
      key: "experience_actuelle",
      label: "Décris ton business/expertise actuel(le)",
      placeholder: "Ex : Agence de marketing digital pour restaurants...",
    },
    {
      key: "assets_reutilisables",
      label: "Quels assets de ton ancien business peux-tu réutiliser ?",
      placeholder: "Ex : Ma communauté Instagram, mes templates, mon réseau...",
    },
    {
      key: "nouveau_marche",
      label: "Vers quel marché tu veux pivoter ?",
      placeholder: "Ex : Le coaching business pour freelances...",
    },
    {
      key: "ca_actuel",
      label: "CA mensuel actuel de ton business existant ?",
      placeholder: "Ex : 8000€",
      type: "number",
    },
  ],
};
