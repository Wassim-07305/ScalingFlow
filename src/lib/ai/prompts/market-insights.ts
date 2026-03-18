// ─── Market Insights Scraper Prompt (#6) ──────────────────────

export interface MarketInsightsContext {
  market: string;
  niche?: string;
  targetAvatar?: string;
  existingPains?: string[];
}

export interface MarketInsight {
  source: string; // "Reddit" | "Forum" | "YouTube" | "Review" | "Twitter/X"
  subreddit_or_channel?: string;
  title: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral" | "frustrated";
  relevance: number; // 1-10
  pain_expressed?: string;
  desire_expressed?: string;
  objection?: string;
  language_pattern: string; // exact words/phrases used by the target
}

export interface PainLayer {
  surface_symptoms: Array<{
    symptom: string;
    frequency: number;
    exact_quotes: string[];
  }>;
  root_causes: Array<{
    cause: string;
    frequency: number;
    exact_quotes: string[];
  }>;
  triggering_events: Array<{
    event: string;
    frequency: number;
    exact_quotes: string[];
  }>;
}

export interface MarketInsightsResult {
  insights: MarketInsight[];
  pain_layers: PainLayer;
  top_pain_points: Array<{
    pain: string;
    frequency: number;
    intensity: string; // "critique" | "forte" | "moderee" | "legere"
    exact_quotes: string[];
  }>;
  top_desires: Array<{
    desire: string;
    frequency: number;
    exact_quotes: string[];
  }>;
  common_objections: Array<{
    objection: string;
    context: string;
    counter_argument: string;
  }>;
  language_vault: {
    power_words: string[];
    phrases_to_reuse: string[];
    emotional_triggers: string[];
    before_after_descriptions: Array<{ before: string; after: string }>;
  };
  content_angles: Array<{
    angle: string;
    source_inspiration: string;
    hook_idea: string;
  }>;
  summary: string;
}

export function marketInsightsPrompt(ctx: MarketInsightsContext): string {
  return `Tu es un expert en recherche de marche et social listening. Tu vas simuler une analyse approfondie des conversations en ligne sur un marche specifique, comme si tu avais scrape Reddit, des forums specialises, YouTube, des avis clients et Twitter/X.

## Marche cible
- Marche : ${ctx.market}
${ctx.niche ? `- Niche : ${ctx.niche}` : ""}
${ctx.targetAvatar ? `- Avatar cible : ${ctx.targetAvatar}` : ""}
${ctx.existingPains?.length ? `- Douleurs deja identifiees : ${ctx.existingPains.join(", ")}` : ""}

## Ta mission

Genere un rapport detaille d'insights de marche en simulant l'analyse de :
- 5-8 posts Reddit (subreddits pertinents)
- 3-5 discussions de forums specialises
- 3-5 sections commentaires YouTube
- 3-5 avis clients (Trustpilot, Google, App Store)
- 2-3 threads Twitter/X

Pour chaque insight :
1. Indique la source precise (subreddit, nom du forum, chaine YT, etc.)
2. Donne un titre et un contenu realistes
3. Extrais le sentiment, la douleur, le desir ou l'objection
4. Note la pertinence (1-10)
5. Capture les MOTS EXACTS utilises par la cible (language patterns)

## STRUCTURATION PAR COUCHES (PersonaForge)
Tu DOIS structurer les douleurs en 3 niveaux :
1. **Symptômes de surface** (4-5) : Ce que les gens DISENT (plaintes visibles, expressions utilisées)
2. **Causes racines** (4-6) : Ce qui BLOQUE réellement (problèmes profonds sous-jacents)
3. **Événements déclencheurs** (3-4) : Les MOMENTS bascules qui poussent à agir (rupture, échec, deadline, etc.)

## Output JSON

Reponds UNIQUEMENT en JSON avec cette structure :
{
  "insights": [...],  // 15-20 insights detailles
  "pain_layers": {
    "surface_symptoms": [{ "symptom": "...", "frequency": 80, "exact_quotes": ["..."] }],
    "root_causes": [{ "cause": "...", "frequency": 60, "exact_quotes": ["..."] }],
    "triggering_events": [{ "event": "...", "frequency": 40, "exact_quotes": ["..."] }]
  },
  "top_pain_points": [...],  // Top 6-8 douleurs avec frequence et citations
  "top_desires": [...],  // Top 4-6 desirs
  "common_objections": [...],  // 4-6 objections courantes avec contre-arguments
  "language_vault": {
    "power_words": [...],  // 8-10 mots puissants utilises par la cible
    "phrases_to_reuse": [...],  // 6-8 phrases exactes reutilisables en copy
    "emotional_triggers": [...],  // 4-6 declencheurs emotionnels
    "before_after_descriptions": [...]  // 3-4 descriptions avant/apres
  },
  "content_angles": [...],  // 4-6 angles de contenu inspires des insights
  "summary": "..."  // Resume de 2-3 phrases
}

IMPORTANT :
- Les insights doivent etre REALISTES et specifiques au marche donne
- Utilise le vocabulaire EXACT de la cible (pas du jargon marketing)
- Les citations doivent sonner authentiques, comme ecrites par de vrais utilisateurs
- Les subreddits et forums doivent etre plausibles pour cette niche
- Tout en francais sauf les noms de sources (Reddit, YouTube, etc.)
- TOUS les champs STRING doivent etre remplis — NE LAISSE JAMAIS un champ vide ("") ou null
- Pour common_objections : "context" et "counter_argument" doivent toujours contenir du texte (min 10 mots chacun)
- Pour content_angles : "source_inspiration" et "hook_idea" doivent toujours contenir du texte
- Pour before_after_descriptions : "before" ET "after" doivent toujours etre remplis
- Pour exact_quotes : chaque tableau doit contenir au moins 1 citation non vide`;
}
