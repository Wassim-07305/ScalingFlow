export function callAnalysisPrompt(
  transcript: string,
  context: {
    offer_name?: string;
    call_type?: string;
    prospect_origin?: string;
    analysis_focus?: string;
    call_result?: string;
    recording_url?: string;
    attribution_context?: string; // parcours multi-touch du lead
  },
): string {
  return `Tu es un expert en analyse de calls de vente B2B pour les services high-ticket (coaching, consulting, agence).

## Contexte
- **Offre** : ${context.offer_name || "Non spécifiée"}
- **Type d'appel** : ${context.call_type || "Discovery call"}
- **Origine du prospect** : ${context.prospect_origin || "Non spécifiée"}
- **Focus d'analyse** : ${context.analysis_focus || "Global"}
- **Résultat du call** : ${context.call_result || "Non spécifié"}
${context.recording_url ? `- **Lien enregistrement** : ${context.recording_url}` : ""}
${context.attribution_context ? `
## Contexte d'attribution du prospect
${context.attribution_context}
Utilise ces informations pour adapter ton analyse du niveau de conscience du prospect (niveau Schwartz) et les recommandations de pitch. Un prospect venant de cold ads Meta (premier contact) est probablement niveau 1-2 (non-conscient ou conscient du problème), alors qu'un prospect venu via referral ou email nurturing long est probablement niveau 4-5 (conscient de la solution ou du produit). Mentionne le niveau de conscience probable dans ton verdict et adapte le playbook en conséquence.
` : ""}

## Transcript de l'appel
${transcript}

## Ta mission
Analyse ce call de vente en profondeur et fournis un scoring détaillé avec des recommandations actionnables.
${context.analysis_focus && context.analysis_focus !== "global" ? `Concentre-toi particulièrement sur la phase "${context.analysis_focus}".` : ""}
${context.call_result ? `Le résultat du call est "${context.call_result}", prends-le en compte dans ton analyse.` : ""}

## Format de réponse
Réponds UNIQUEMENT en JSON valide :
{
  "overall_score": 72,
  "overall_verdict": "Verdict global en une phrase",
  "scores": {
    "decouverte": {
      "score": 75,
      "max": 100,
      "strengths": ["Ce qui a été bien fait (min 2)"],
      "improvements": ["Ce qui peut être amélioré (min 2)"],
      "key_moment": "Le moment clé de la phase découverte"
    },
    "pitch": {
      "score": 68,
      "max": 100,
      "strengths": ["..."],
      "improvements": ["..."],
      "key_moment": "..."
    },
    "objections": {
      "score": 60,
      "max": 100,
      "strengths": ["..."],
      "improvements": ["..."],
      "key_moment": "..."
    },
    "closing": {
      "score": 55,
      "max": 100,
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
  "training_focus": ["Compétence à travailler en priorité"],
  "suggested_script": "Script de vente personnalisé de minimum 200 mots, structuré avec les phases d'accroche, découverte, pitch, gestion des objections et closing. Adapté aux faiblesses identifiées dans l'analyse."
}

IMPORTANT — RÈGLES STRICTES :
- Tous les scores sont sur 100 (PAS sur 10). Chaque "max" vaut 100. Le "overall_score" est sur 100.
- Le champ "scores" contient EXACTEMENT 4 clés : "decouverte", "pitch", "objections", "closing". PAS d'autres clés. PAS "discovery", PAS "rapport", PAS "recadrage".
- Le champ "playbook" doit contenir 5 à 7 actions concrètes basées sur les faiblesses identifiées. Chaque action a une priorité : "haute", "moyenne" ou "basse".
- Chaque dimension doit avoir au moins 2 strengths et 2 improvements.
- L'analyse des speakers doit estimer le ratio de parole vendeur/prospect (idéal : 30-40% vendeur / 60-70% prospect pour un discovery call, 40-50% / 50-60% pour un closing).
- Détecte les interruptions et la gestion des silences.
- Inclure un champ "suggested_script" (string, min 200 mots) contenant un script de vente personnalisé basé sur les faiblesses identifiées, les objections mal gérées et les bonnes pratiques à renforcer.`;
}
