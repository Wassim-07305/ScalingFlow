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
    },
    "tonality_energy": {
      "score": 7,
      "max": 10,
      "strengths": ["Ton engageant, voix posée et confiante"],
      "improvements": ["Manque d'enthousiasme dans la phase de présentation"],
      "key_moment": "Moment où le ton a changé (positif ou négatif)"
    },
    "conversation_control": {
      "score": 6,
      "max": 10,
      "strengths": ["Bonne gestion du temps", "Transitions fluides"],
      "improvements": ["Le prospect a monopolisé la parole trop longtemps"],
      "key_moment": "Moment où le contrôle a été perdu/repris"
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
  "speaker_analysis": {
    "seller_talk_ratio": 35,
    "prospect_talk_ratio": 65,
    "ideal_ratio_met": true,
    "longest_monologue_seller": "Description du plus long monologue du vendeur et son impact",
    "longest_monologue_prospect": "Description du plus long monologue du prospect et ce qu'il révèle",
    "interruptions": 2,
    "silence_management": "Comment les silences ont été gérés (bien/mal, utilisés stratégiquement ou remplis par anxiété)"
  },
  "next_steps": ["Action recommandée 1", "Action recommandée 2"],
  "training_focus": ["Compétence à travailler en priorité"]
}

IMPORTANT :
- Le champ "playbook" doit contenir 5 à 7 actions concrètes basées sur les faiblesses identifiées. Chaque action a une priorité : "haute", "moyenne" ou "basse".
- Le scoring couvre 7 dimensions (pas 5) : discovery, rapport_building, problem_reframing, objection_handling, closing, tonality_energy, conversation_control.
- L'analyse des speakers doit estimer le ratio de parole vendeur/prospect (idéal : 30-40% vendeur / 60-70% prospect pour un discovery call, 40-50% / 50-60% pour un closing).
- Détecte les interruptions et la gestion des silences.`;
}
