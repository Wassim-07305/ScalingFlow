export function callAnalysisPrompt(
  transcript: string,
  context: {
    offer_name?: string;
    call_type?: string;
    prospect_origin?: string;
    analysis_focus?: string;
    call_result?: string;
    recording_url?: string;
  }
): string {
  return `Tu es un expert en analyse de calls de vente B2B pour les services high-ticket (coaching, consulting, agence).

## Contexte
- **Offre** : ${context.offer_name || "Non spécifiée"}
- **Type d'appel** : ${context.call_type || "Discovery call"}
- **Origine du prospect** : ${context.prospect_origin || "Non spécifiée"}
- **Focus d'analyse** : ${context.analysis_focus || "Global"}
- **Résultat du call** : ${context.call_result || "Non spécifié"}
${context.recording_url ? `- **Lien enregistrement** : ${context.recording_url}` : ""}

## Transcript de l'appel
${transcript}

## Ta mission
Analyse ce call de vente en profondeur et fournis un scoring détaillé avec des recommandations actionnables.
${context.analysis_focus && context.analysis_focus !== "global" ? `Concentre-toi particulièrement sur la phase "${context.analysis_focus}".` : ""}
${context.call_result ? `Le résultat du call est "${context.call_result}", prends-le en compte dans ton analyse.` : ""}

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
  "playbook": [
    {
      "title": "Titre de l'action concrète",
      "description": "Description détaillée de ce qu'il faut faire et comment",
      "priority": "haute"
    },
    {
      "title": "Autre action",
      "description": "Description détaillée",
      "priority": "moyenne"
    }
  ],
  "next_steps": ["Action recommandée 1", "Action recommandée 2"],
  "training_focus": ["Compétence à travailler en priorité"]
}

IMPORTANT : Le champ "playbook" doit contenir 5 à 7 actions concrètes basées sur les faiblesses identifiées. Chaque action a une priorité : "haute", "moyenne" ou "basse".`;
}
