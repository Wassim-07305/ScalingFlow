export interface ContinuousContentContext {
  niche: string;
  offer: string;
  persona: string;
  topPerformingTypes?: string;
  engagementMetrics?: string;
  salesObjections?: string;
  adInsights?: string;
}

export interface ContentPiece {
  type: "reel" | "carousel" | "post" | "story";
  pillar: "Know" | "Like" | "Trust" | "Conversion";
  hook: string;
  script: string;
  hashtags: string[];
  best_posting_time: string;
  reasoning: string;
}

export interface WeeklyBatchResult {
  semaine: string;
  adaptation_intelligente: {
    type_dominant: string;
    raison: string;
    repartition: { type: string; pourcentage: number }[];
  };
  contenus: ContentPiece[];
}

export function continuousContentPrompt(context: ContinuousContentContext): string {
  return `Tu es un expert en stratégie de contenu organique et en growth marketing pour les entrepreneurs francophones.

## CONTEXTE BUSINESS
- Niche : ${context.niche}
- Offre : ${context.offer}
- Persona cible : ${context.persona}

${context.topPerformingTypes ? `## DONNÉES DE PERFORMANCE (adaptation intelligente)
Types de contenu les plus performants cette semaine :
${context.topPerformingTypes}
→ Génère DAVANTAGE de contenus du type qui performe le mieux. Adapte le mix en conséquence.` : ""}

${context.engagementMetrics ? `## MÉTRIQUES D'ENGAGEMENT
${context.engagementMetrics}
→ Utilise ces données pour orienter les angles et les hooks.` : ""}

${context.salesObjections ? `## OBJECTIONS DE VENTE FRÉQUENTES
${context.salesObjections}
→ Intègre des contenus qui adressent ces objections de manière subtile (éducation, preuve sociale, storytelling).` : ""}

${context.adInsights ? `## INSIGHTS PUBLICITAIRES
${context.adInsights}
→ Décline les hooks et angles performants en contenu organique.` : ""}

## TA MISSION
Génère un batch de 5 contenus pour la semaine, en respectant ces règles :

1. **Adaptation intelligente** : Si des données de performance sont fournies, génère PLUS de contenus du type qui performe le mieux (ex: si les Reels marchent mieux, 3 Reels sur 5). Sinon, fais un mix équilibré.
2. **Contenu depuis data vente** : Si des objections de vente sont fournies, au moins 1-2 contenus doivent adresser directement ces objections.
3. **Mix KLCT** : Respecte les 4 piliers Know/Like/Trust/Conversion.
4. **Variété** : Alterne entre reel, carousel, post et story.

## FORMAT DE RÉPONSE
Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "semaine": "Semaine du [date]",
  "adaptation_intelligente": {
    "type_dominant": "reel",
    "raison": "Les Reels ont eu 3x plus d'engagement cette semaine",
    "repartition": [
      { "type": "reel", "pourcentage": 60 },
      { "type": "carousel", "pourcentage": 20 },
      { "type": "post", "pourcentage": 10 },
      { "type": "story", "pourcentage": 10 }
    ]
  },
  "contenus": [
    {
      "type": "reel",
      "pillar": "Know",
      "hook": "L'accroche percutante en 1 phrase",
      "script": "Le script complet avec intro, corps et CTA. Inclus les instructions de tournage (cadrage, texte à l'écran, transitions).",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "best_posting_time": "Mardi 18h",
      "reasoning": "Ce contenu a été choisi car les Reels éducatifs ont eu le meilleur taux d'engagement (+45% vs moyenne)."
    }
  ]
}`;
}
