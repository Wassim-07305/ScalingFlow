export interface PersonaForgeResult {
  avatar_name: string;
  avatar_role: string;
  bio_fictive: string;
  journee_type: string;
  canaux_medias: string[];
  niveau_1_demo: {
    age_range: string;
    genre: string;
    situation_familiale: string;
    revenu_annuel: string;
    localisation: string;
    niveau_education: string;
  };
  niveau_2_psycho: {
    desirs_profonds: string[];
    peurs: string[];
    frustrations: string[];
    objections_achat: string[];
    croyances_limitantes: string[];
  };
  niveau_3_langage: {
    expressions_courantes: string[];
    mots_cles_recherche: string[];
    phrases_douleur: string[];
    phrases_desir: string[];
    ton_communication: string;
  };
  niveau_4_parcours: {
    declencheurs_achat: string[];
    sources_info: string[];
    criteres_decision: string[];
    obstacles_achat: string[];
    timeline_decision: string;
    influenceurs: string[];
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
  vaultSkills?: { name?: string; category?: string; level: string; details?: string }[];
  expertiseAnswers?: Record<string, string>;
  situation?: string;
  parcours?: string;
}

export function buildPersonaForgePrompt(data: {
  marketAnalysis: MarketAnalysisData;
  vaultData: VaultContextData;
}): string {
  const { marketAnalysis, vaultData } = data;

  let userContext = "";
  if (vaultData.skills && vaultData.skills.length > 0) {
    userContext += `\n- Competences de l'utilisateur : ${vaultData.skills.join(", ")}`;
  }
  if (vaultData.situation) {
    userContext += `\n- Situation : ${vaultData.situation}`;
  }
  if (vaultData.parcours) {
    userContext += `\n- Parcours : ${vaultData.parcours}`;
  }

  let vaultSkillsContext = "";
  if (vaultData.vaultSkills && vaultData.vaultSkills.length > 0) {
    vaultSkillsContext = "\n\n## COMPETENCES DETAILLEES\n";
    for (const skill of vaultData.vaultSkills) {
      vaultSkillsContext += `- ${skill.name || skill.category || "Competence"} (${skill.level})${skill.details ? ` : ${skill.details}` : ""}\n`;
    }
  }

  let expertiseContext = "";
  if (vaultData.expertiseAnswers && Object.keys(vaultData.expertiseAnswers).length > 0) {
    expertiseContext = "\n\n## EXPERTISE UTILISATEUR\n";
    for (const [q, a] of Object.entries(vaultData.expertiseAnswers)) {
      expertiseContext += `- ${q} : ${a}\n`;
    }
  }

  const avatarContext = marketAnalysis.target_avatar
    ? `\n\n## AVATAR INITIAL (a approfondir)\n${JSON.stringify(marketAnalysis.target_avatar, null, 2)}`
    : "";

  return `Tu es un expert en psychologie consommateur et en marketing, specialise dans la creation d'avatars clients ultra-detailles. Tu maitrises les frameworks de personas avances (Jobs-to-be-Done, Empathy Map, Buyer Journey).

## MARCHE ANALYSE
- Nom du marche : ${marketAnalysis.market_name}
- Description : ${marketAnalysis.market_description || "Non fournie"}
- Problemes identifies : ${marketAnalysis.problems?.join(", ") || "Non fournis"}
- Positionnement recommande : ${marketAnalysis.recommended_positioning || "Non fourni"}
- Pays cible : ${marketAnalysis.country || "Non specifie"}
- Langue : ${marketAnalysis.language || "Francais"}${userContext}${vaultSkillsContext}${expertiseContext}${avatarContext}

## TA MISSION
Cree un avatar client ultra-detaille sur 4 niveaux de profondeur pour le marche "${marketAnalysis.market_name}". Cet avatar doit etre tellement precis que l'utilisateur pourra ecrire du copy qui parle directement a cette personne.

### BIO FICTIVE
Ecris une bio fictive ultra-detaillee de 3-5 phrases : prenom, nom, age, situation, parcours pro, situation actuelle, personnalite. Comme si tu decrivais un vrai etre humain.

### JOURNEE TYPE
Decris une journee type de cet avatar : du reveil au coucher, ses habitudes, ses frustrations au quotidien, les moments ou il scrolle les reseaux, quand il est le plus receptif aux publicites.

### CANAUX MEDIAS CONSOMMES
Liste les 5-8 canaux medias qu'il consomme : reseaux sociaux specifiques, podcasts, newsletters, YouTube, blogs, groupes Facebook, forums, etc. Sois precis sur les types de contenu consommes.

### NIVEAU 1 — Demographique
Donne les caracteristiques demographiques precises : tranche d'age, genre predominant, situation familiale, revenu annuel, localisation type, niveau d'education.

### NIVEAU 2 — Psychographique
Va en profondeur dans la psychologie : desirs profonds (pas juste de surface), peurs reelles, frustrations quotidiennes, objections a l'achat, croyances limitantes qui les empechent d'agir.

### NIVEAU 3 — Langage
Donne les mots exacts qu'ils utilisent : expressions courantes dans leur domaine, mots-cles qu'ils tapent sur Google, phrases qui decrivent leur douleur (verbatim), phrases qui decrivent leur desir ideal, ton de communication prefere.

### NIVEAU 4 — Parcours d'achat
Analyse leur processus de decision : declencheurs d'achat (qu'est-ce qui les fait passer a l'action), sources d'information (ou ils se renseignent), criteres de decision, obstacles a l'achat, timeline de decision moyenne, influenceurs/prescripteurs.

## FORMAT DE REPONSE
Reponds en JSON structure :
{
  "avatar_name": "Prenom + Nom fictif mais realiste",
  "avatar_role": "Titre / Role professionnel",
  "bio_fictive": "Bio narrative detaillee de 3-5 phrases...",
  "journee_type": "Description de la journee type de l'avatar...",
  "canaux_medias": ["Instagram (Reels business)", "YouTube (formations)", "Podcast X", "Newsletter Y", "LinkedIn"],
  "niveau_1_demo": {
    "age_range": "35-45 ans",
    "genre": "...",
    "situation_familiale": "...",
    "revenu_annuel": "...",
    "localisation": "...",
    "niveau_education": "..."
  },
  "niveau_2_psycho": {
    "desirs_profonds": ["...", "..."],
    "peurs": ["...", "..."],
    "frustrations": ["...", "..."],
    "objections_achat": ["...", "..."],
    "croyances_limitantes": ["...", "..."]
  },
  "niveau_3_langage": {
    "expressions_courantes": ["...", "..."],
    "mots_cles_recherche": ["...", "..."],
    "phrases_douleur": ["...", "..."],
    "phrases_desir": ["...", "..."],
    "ton_communication": "..."
  },
  "niveau_4_parcours": {
    "declencheurs_achat": ["...", "..."],
    "sources_info": ["...", "..."],
    "criteres_decision": ["...", "..."],
    "obstacles_achat": ["...", "..."],
    "timeline_decision": "...",
    "influenceurs": ["...", "..."]
  }
}`;
}
