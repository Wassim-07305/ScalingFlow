export interface YouTubeTranscriptData {
  competitor: string;
  title: string;
  channelName: string;
  viewCount: number;
  transcript: string;
  url: string;
}

export interface PersonaForgeResult {
  avatar_name: string;
  avatar_role: string;
  bio_fictive: string;
  journee_type: string;
  canaux_medias: string[];
  based_on_real_data: boolean;
  verbatims_reels: string[];
  niveau_schwartz: string;
  raisons_achat: string[];
  desirs_par_profondeur: {
    surface: string[];
    intermediaire: string[];
    profond: string[];
  };
  niveau_1_demo: {
    age_range: string;
    genre: string;
    situation_familiale: string;
    revenu_annuel: string;
    localisation: string;
    situation_pro: string;
    niveau_education: string;
  };
  niveau_2_psycho: {
    peurs: string[];
    frustrations: string[];
    desirs_profonds: string[];
    croyances_limitantes: string[];
    declencheurs_achat: string[];
  };
  niveau_3_comportemental: {
    habitudes_digitales: string[];
    reseaux_sociaux: string[];
    type_contenu_consomme: string[];
    objections_typiques: string[];
    frequence_achat_en_ligne: string;
    appareils_utilises: string[];
  };
  niveau_4_strategique: {
    parcours_achat: string[];
    points_contact_optimaux: string[];
    messages_qui_resonnent: string[];
    timing_ideal: string;
    criteres_decision: string[];
    influenceurs_prescripteurs: string[];
  };
}

export interface MarketAnalysisData {
  market_name: string;
  market_description: string | null;
  problems: string[] | null;
  recommended_positioning: string | null;
  target_avatar: Record<string, unknown> | null;
  country: string | null;
  language: string | null;
}

export interface VaultContextData {
  skills?: string[];
  vaultSkills?: {
    name?: string;
    category?: string;
    level: string;
    details?: string;
  }[];
  expertiseAnswers?: Record<string, string>;
  situation?: string;
  parcours?: string;
}

export function buildPersonaForgePrompt(data: {
  marketAnalysis: MarketAnalysisData;
  vaultData: VaultContextData;
  youtubeTranscripts?: YouTubeTranscriptData[];
}): string {
  const { marketAnalysis, vaultData, youtubeTranscripts } = data;

  let userContext = "";
  if (vaultData.skills && vaultData.skills.length > 0) {
    userContext += `\n- Compétences de l'utilisateur : ${vaultData.skills.join(", ")}`;
  }
  if (vaultData.situation) {
    userContext += `\n- Situation : ${vaultData.situation}`;
  }
  if (vaultData.parcours) {
    userContext += `\n- Parcours : ${vaultData.parcours}`;
  }

  let vaultSkillsContext = "";
  if (vaultData.vaultSkills && vaultData.vaultSkills.length > 0) {
    vaultSkillsContext = "\n\n## COMPÉTENCES DÉTAILLÉES\n";
    for (const skill of vaultData.vaultSkills) {
      vaultSkillsContext += `- ${skill.name || skill.category || "Compétence"} (${skill.level})${skill.details ? ` : ${skill.details}` : ""}\n`;
    }
  }

  let expertiseContext = "";
  if (
    vaultData.expertiseAnswers &&
    Object.keys(vaultData.expertiseAnswers).length > 0
  ) {
    expertiseContext = "\n\n## EXPERTISE UTILISATEUR\n";
    for (const [q, a] of Object.entries(vaultData.expertiseAnswers)) {
      expertiseContext += `- ${q} : ${a}\n`;
    }
  }

  const avatarContext = marketAnalysis.target_avatar
    ? `\n\n## AVATAR INITIAL (à approfondir)\n${JSON.stringify(marketAnalysis.target_avatar, null, 2)}`
    : "";

  // Construire la section YouTube si des transcripts sont disponibles
  let youtubeSection = "";
  const hasYoutubeData = youtubeTranscripts && youtubeTranscripts.length > 0;

  if (hasYoutubeData) {
    youtubeSection = `\n\n## DONNÉES YOUTUBE RÉELLES (PRIORITÉ MAXIMALE)
Ces données proviennent de vraies vidéos YouTube de concurrents (interviews clients, études de cas, témoignages). Tu DOIS t'appuyer en priorité sur ces données réelles pour construire l'avatar.

Extrais de ces transcripts :
- Le LANGAGE NATUREL exact utilisé par les vrais clients (expressions, mots, tournures)
- Les DOULEURS réelles exprimées (pas des suppositions)
- Les DÉSIRS et OBJECTIFS mentionnés par les vrais clients
- Les OBJECTIONS et HÉSITATIONS évoquées
- Le CONTEXTE de vie réel (situation, parcours, frustrations quotidiennes)
- Les RAISONS D'ACHAT concrètes mentionnées

`;
    for (const t of youtubeTranscripts) {
      // Limiter chaque transcript à ~2000 caractères pour éviter de dépasser les tokens
      const truncatedTranscript =
        t.transcript.length > 2000
          ? t.transcript.slice(0, 2000) + "..."
          : t.transcript;
      youtubeSection += `### Vidéo : "${t.title}" — ${t.channelName} (${t.viewCount.toLocaleString("fr-FR")} vues)
Concurrent : ${t.competitor}
URL : ${t.url}
Transcript :
${truncatedTranscript}

`;
    }
  }

  return `Tu es un expert en psychologie consommateur et en marketing, spécialisé dans la création d'avatars clients ultra-détaillés. Tu maîtrises les frameworks de personas avancés (Jobs-to-be-Done, Empathy Map, Buyer Journey).

## MARCHÉ ANALYSÉ
- Nom du marché : ${marketAnalysis.market_name}
- Description : ${marketAnalysis.market_description || "Non fournie"}
- Problèmes identifiés : ${marketAnalysis.problems?.join(", ") || "Non fournis"}
- Positionnement recommandé : ${marketAnalysis.recommended_positioning || "Non fourni"}
- Pays cible : ${marketAnalysis.country || "Non spécifié"}
- Langue : ${marketAnalysis.language || "Français"}${userContext}${vaultSkillsContext}${expertiseContext}${avatarContext}${youtubeSection}

## TA MISSION
Crée un avatar client ultra-détaillé sur 4 niveaux de profondeur pour le marché "${marketAnalysis.market_name}". Cet avatar doit être tellement précis que l'utilisateur pourra écrire du copy qui parle directement à cette personne.${hasYoutubeData ? "\n\nATTENTION : Tu disposes de données YouTube RÉELLES. Base-toi EN PRIORITÉ sur ces transcripts pour extraire le langage naturel, les douleurs, désirs et objections des vrais clients. Cite des verbatims réels dans le champ 'verbatims_reels'." : ""}

### BIO FICTIVE
Écris une bio fictive ultra-détaillée de 3-5 phrases : prénom, nom, âge, situation, parcours pro, situation actuelle, personnalité. Comme si tu décrivais un vrai être humain.

### JOURNÉE TYPE
Décris une journée type de cet avatar : du réveil au coucher, ses habitudes, ses frustrations au quotidien, les moments où il scrolle les réseaux, quand il est le plus réceptif aux publicités.

### CANAUX MÉDIAS CONSOMMÉS
Liste les 5-8 canaux médias qu'il consomme : réseaux sociaux spécifiques, podcasts, newsletters, YouTube, blogs, groupes Facebook, forums, etc. Sois précis sur les types de contenu consommés.

### COMPLÉMENTS AVANCÉS
- **Verbatims réels** : Si tu disposes de données YouTube, extrais 5-10 citations mot-pour-mot des vrais clients (langage naturel, expressions familières, mots exacts). Sinon, génère des verbatims réalistes basés sur ton analyse.
- **Niveau Schwartz** : Identifie le niveau de conscience de l'avatar selon Eugene Schwartz (Unaware, Problem-Aware, Solution-Aware, Product-Aware, Most-Aware). Explique pourquoi.
- **Raisons d'achat** : Liste les 5-8 raisons concrètes qui poussent cet avatar à acheter (pas des généralités, des motivations spécifiques à ce marché).
- **Désirs par profondeur** : 3 niveaux — désirs de surface (ce qu'il dit vouloir), désirs intermédiaires (ce qu'il veut vraiment), désirs profonds (le besoin fondamental caché).

### NIVEAU 1 — Démographique
Âge, sexe, localisation, revenus, situation professionnelle. Donne les caractéristiques démographiques précises : tranche d'âge, genre prédominant, situation familiale, revenu annuel, localisation type, situation professionnelle, niveau d'éducation.

### NIVEAU 2 — Psychographique (Problématique + Émotionnel)
Peurs, frustrations, désirs, croyances limitantes, déclencheurs d'achat. Va en profondeur dans la psychologie : peurs réelles, frustrations quotidiennes, désirs profonds (pas juste de surface), croyances limitantes qui les empêchent d'agir, déclencheurs émotionnels qui les font passer à l'action.

### NIVEAU 3 — Comportemental
Habitudes digitales, réseaux sociaux utilisés, type de contenu consommé, objections typiques. Analyse le comportement en ligne : habitudes digitales quotidiennes, réseaux sociaux utilisés et comment, types de contenu qu'ils consomment et partagent, objections typiques avant un achat, fréquence d'achat en ligne, appareils utilisés.

### NIVEAU 4 — Stratégique
Parcours d'achat, points de contact optimaux, messages qui résonnent, timing idéal. Analyse stratégique pour le marketing : les étapes de leur parcours d'achat, les points de contact optimaux pour les atteindre, les messages et angles qui résonnent le plus chez eux, le timing idéal pour les contacter, leurs critères de décision, les influenceurs et prescripteurs qui les influencent.

## FORMAT DE RÉPONSE
Réponds en JSON structuré :
{
  "avatar_name": "Prénom + Nom fictif mais réaliste",
  "avatar_role": "Titre / Rôle professionnel",
  "bio_fictive": "Bio narrative détaillée de 3-5 phrases...",
  "journee_type": "Description de la journée type de l'avatar...",
  "canaux_medias": ["Instagram (Reels business)", "YouTube (formations)", "Podcast X", "Newsletter Y", "LinkedIn"],
  "based_on_real_data": ${hasYoutubeData ? "true" : "false"},
  "verbatims_reels": ["Citation exacte d'un vrai client...", "Autre citation mot-pour-mot..."],
  "niveau_schwartz": "Problem-Aware — Explication de pourquoi ce niveau...",
  "raisons_achat": ["Raison concrète 1", "Raison concrète 2", "..."],
  "desirs_par_profondeur": {
    "surface": ["Ce qu'il dit vouloir ouvertement..."],
    "intermediaire": ["Ce qu'il veut vraiment en creusant..."],
    "profond": ["Le besoin fondamental caché..."]
  },
  "niveau_1_demo": {
    "age_range": "35-45 ans",
    "genre": "...",
    "situation_familiale": "...",
    "revenu_annuel": "...",
    "localisation": "...",
    "situation_pro": "...",
    "niveau_education": "..."
  },
  "niveau_2_psycho": {
    "peurs": ["...", "..."],
    "frustrations": ["...", "..."],
    "desirs_profonds": ["...", "..."],
    "croyances_limitantes": ["...", "..."],
    "declencheurs_achat": ["...", "..."]
  },
  "niveau_3_comportemental": {
    "habitudes_digitales": ["...", "..."],
    "reseaux_sociaux": ["...", "..."],
    "type_contenu_consomme": ["...", "..."],
    "objections_typiques": ["...", "..."],
    "frequence_achat_en_ligne": "...",
    "appareils_utilises": ["...", "..."]
  },
  "niveau_4_strategique": {
    "parcours_achat": ["Étape 1 : ...", "Étape 2 : ...", "..."],
    "points_contact_optimaux": ["...", "..."],
    "messages_qui_resonnent": ["...", "..."],
    "timing_ideal": "...",
    "criteres_decision": ["...", "..."],
    "influenceurs_prescripteurs": ["...", "..."]
  }
}`;
}
