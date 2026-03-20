export interface ExtractedKnowledge {
  frameworks: { name: string; steps: string[]; use_case: string }[];
  case_studies: {
    client_type: string;
    problem: string;
    solution: string;
    result: string;
  }[];
  delivery_process: { phase: string; actions: string[]; tools: string[] }[];
  objection_responses: {
    objection: string;
    response: string;
    category: string;
  }[];
  unique_insights: string[];
  communication_style: {
    tone: string;
    vocabulary: string[];
    patterns: string[];
  };
}

interface UserProfile {
  niche?: string | null;
  offer_name?: string | null;
  experience_level?: string | null;
  situation?: string | null;
}

export function buildKnowledgeExtractionPrompt(
  rawContent: string,
  userProfile: UserProfile,
): string {
  const profileContext = [
    userProfile.niche ? `Niche : ${userProfile.niche}` : null,
    userProfile.offer_name ? `Offre principale : ${userProfile.offer_name}` : null,
    userProfile.experience_level
      ? `Niveau d'expérience : ${userProfile.experience_level}`
      : null,
    userProfile.situation ? `Situation : ${userProfile.situation}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Tu es un expert en extraction et structuration du savoir-faire. Tu analyses du contenu brut (conversations, textes, interviews) et tu en extrais la connaissance structurée. Tu travailles avec du contenu parfois désorganisé, incomplet ou brut — c'est normal.

## PROFIL DU USER

${profileContext || "Non renseigné"}

## CONTENU À ANALYSER

${rawContent}

## TA MISSION

Extraire et structurer TOUT le savoir-faire présent dans ce contenu. Sois exhaustif. Si le contenu est une conversation, extraire les insights partagés. Si c'est une interview, capturer les méthodologies. Si c'est un texte brut, identifier les patterns et frameworks implicites.

**RÉPONDS EN JSON STRICT avec cette structure :**

\`\`\`json
{
  "frameworks": [
    {
      "name": "Nom du framework ou méthode (invente un nom clair si nécessaire)",
      "steps": ["Étape 1", "Étape 2", "..."],
      "use_case": "Dans quel contexte utiliser cette méthode"
    }
  ],
  "case_studies": [
    {
      "client_type": "Type de client (ex: coach débutant, e-commercant, SaaS B2B)",
      "problem": "Problème initial du client",
      "solution": "Ce qui a été fait concrètement",
      "result": "Résultat obtenu (chiffré si possible)"
    }
  ],
  "delivery_process": [
    {
      "phase": "Nom de la phase (ex: Onboarding, Diagnostic, Mise en oeuvre)",
      "actions": ["Action concrète 1", "Action 2"],
      "tools": ["Outil ou ressource utilisé"]
    }
  ],
  "objection_responses": [
    {
      "objection": "L'objection telle que formulée",
      "response": "La réponse donnée ou à donner",
      "category": "prix | timing | confiance | concurrence | autonomie | autre"
    }
  ],
  "unique_insights": [
    "Pépite de savoir-faire unique #1 — une idée, observation ou principe qui différencie",
    "Pépite #2",
    "..."
  ],
  "communication_style": {
    "tone": "Description du ton (ex: direct et factuel, bienveillant mais exigeant, storytelling)",
    "vocabulary": ["Mot ou expression caractéristique 1", "Expression 2"],
    "patterns": ["Pattern de communication récurrent (ex: commence par les résultats, puis le comment)"]
  }
}
\`\`\`

**Contraintes :**
- Si un élément n'est pas présent dans le contenu, retourne un tableau vide (ne jamais inventer)
- Minimum 1 élément par section si le contenu le permet
- Les insights doivent être des vraies pépites, pas des généralités
- Le ton communication_style doit capturer la voix unique de cette personne
- Tout doit être en français`;
}

/** Prompt pour l'interview IA — génère la prochaine question adaptée aux réponses précédentes */
export function buildInterviewNextQuestionPrompt(
  answers: Record<number, string>,
  questionIndex: number,
  userProfile: UserProfile,
): string {
  const INTERVIEW_QUESTIONS = [
    "Décris ton activité en 3 phrases : ce que tu fais, pour qui, et quel résultat tu garantis.",
    "Décris ton process complet quand tu prends un nouveau client, étape par étape.",
    "Quelle est l'erreur #1 que font tes clients avant de travailler avec toi ? Et comment tu la corriges ?",
    "Raconte ton meilleur cas client : situation initiale, ce que tu as fait, résultat final.",
    "Si tu devais former quelqu'un à faire ton travail en 1 jour, quels sont les 3-5 frameworks essentiels ?",
    "Quelle objection revient le plus souvent chez tes prospects ? Comment tu la traites ?",
    "Qu'est-ce qui te différencie fondamentalement de tes concurrents ? (Sois honnête, pas marketing)",
    "Quel est le moment 'déclic' que tes clients vivent en travaillant avec toi ?",
    "Quels outils ou méthodes utilises-tu que d'autres n'utilisent pas ?",
    "Quel est le pire cas client que tu aies eu ? Qu'est-ce que tu as appris ?",
    "Si un prospect hésitait entre toi et un concurrent moins cher, qu'est-ce que tu dirais ?",
    "Dans 5 ans, quelle expertise veux-tu être connue pour avoir développée ?",
  ];

  const previousAnswersText = Object.entries(answers)
    .map(
      ([idx, ans]) =>
        `Q${Number(idx) + 1}: ${INTERVIEW_QUESTIONS[Number(idx)] || "?"}\nR: ${ans}`,
    )
    .join("\n\n");

  const defaultQuestion = INTERVIEW_QUESTIONS[questionIndex] || INTERVIEW_QUESTIONS[INTERVIEW_QUESTIONS.length - 1];

  if (Object.keys(answers).length === 0) {
    return defaultQuestion;
  }

  return `Tu conduis une interview pour extraire l'expertise d'un entrepreneur. Tu dois générer la prochaine question la plus pertinente basée sur ce qui a déjà été dit.

**Profil** : ${userProfile.niche || "Non renseigné"} — ${userProfile.offer_name || "Offre non précisée"}

**Réponses précédentes :**
${previousAnswersText}

**Question par défaut pour ce stade** : ${defaultQuestion}

Génère UNE question de suivi adaptée aux réponses données. La question doit :
- Approfondir un aspect intéressant mentionné OU couvrir un angle important non abordé
- Être conversationnelle et naturelle
- Viser à extraire du concret (exemples, chiffres, process)
- Rester dans l'esprit de la question par défaut si elle n'a pas été couverte

Réponds UNIQUEMENT avec la question, rien d'autre.`;
}

export const INTERVIEW_QUESTIONS_COUNT = 12;

export const DEFAULT_INTERVIEW_QUESTIONS = [
  "Décris ton activité en 3 phrases : ce que tu fais, pour qui, et quel résultat tu garantis.",
  "Décris ton process complet quand tu prends un nouveau client, étape par étape.",
  "Quelle est l'erreur #1 que font tes clients avant de travailler avec toi ? Et comment tu la corriges ?",
  "Raconte ton meilleur cas client : situation initiale, ce que tu as fait, résultat final.",
  "Si tu devais former quelqu'un à faire ton travail en 1 jour, quels sont les 3-5 frameworks essentiels ?",
  "Quelle objection revient le plus souvent chez tes prospects ? Comment tu la traites ?",
  "Qu'est-ce qui te différencie fondamentalement de tes concurrents ? (Sois honnête, pas marketing)",
  "Quel est le moment 'déclic' que tes clients vivent en travaillant avec toi ?",
  "Quels outils ou méthodes utilises-tu que d'autres n'utilisent pas ?",
  "Quel est le pire cas client que tu aies eu ? Qu'est-ce que tu as appris ?",
  "Si un prospect hésitait entre toi et un concurrent moins cher, qu'est-ce que tu dirais ?",
  "Dans 5 ans, quelle expertise veux-tu être reconnue pour avoir développée ?",
];
