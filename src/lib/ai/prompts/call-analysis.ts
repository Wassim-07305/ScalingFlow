export function callAnalysisPrompt(
  transcript: string,
  context: {
    offer_name?: string;
    call_type?: string;
  }
): string {
  return `Tu es un expert en analyse de calls de vente B2B pour les services high-ticket (coaching, consulting, agence).

## Contexte
- **Offre** : ${context.offer_name || "Non spécifiée"}
- **Type d'appel** : ${context.call_type || "Discovery call"}

## Transcript de l'appel
${transcript}

## Ta mission
Analyse ce call de vente en profondeur et fournis un scoring détaillé avec des recommandations actionnables.

## Format de réponse
Réponds UNIQUEMENT en JSON valide :
{
  "overall_score": 7.5,
  "overall_verdict": "Verdict global en une phrase",
  "scores": {
    "discovery": {
      "score": 8,
      "max": 10,
      "strengths": ["Ce qui a été bien fait"],
      "improvements": ["Ce qui peut être amélioré"],
      "key_moment": "Le moment clé de la phase discovery"
    },
    "rapport_building": {
      "score": 7,
      "max": 10,
      "strengths": ["..."],
      "improvements": ["..."],
      "key_moment": "..."
    },
    "problem_reframing": {
      "score": 6,
      "max": 10,
      "strengths": ["..."],
      "improvements": ["..."],
      "key_moment": "..."
    },
    "objection_handling": {
      "score": 7,
      "max": 10,
      "strengths": ["..."],
      "improvements": ["..."],
      "key_moment": "..."
    },
    "closing": {
      "score": 5,
      "max": 10,
      "strengths": ["..."],
      "improvements": ["..."],
      "key_moment": "..."
    }
  },
  "key_phrases_to_keep": [
    {
      "phrase": "Phrase exacte du vendeur qui a bien marché",
      "why": "Pourquoi c'est efficace"
    }
  ],
  "key_phrases_to_improve": [
    {
      "phrase": "Phrase qui aurait pu être meilleure",
      "suggestion": "Version améliorée"
    }
  ],
  "objections_detected": [
    {
      "objection": "L'objection soulevée",
      "handling": "Comment elle a été gérée",
      "score": 7,
      "better_response": "Comment mieux la gérer"
    }
  ],
  "client_signals": {
    "buying_signals": ["Signal d'achat détecté"],
    "warning_signals": ["Signal de désintérêt détecté"],
    "emotional_triggers": ["Déclencheur émotionnel identifié"]
  },
  "next_steps": ["Action recommandée 1", "Action recommandée 2"],
  "training_focus": ["Compétence à travailler en priorité"]
}`;
}
