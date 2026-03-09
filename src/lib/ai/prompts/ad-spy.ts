export function adSpyPrompt(
  competitor: {
    name: string;
    url?: string;
    industry: string;
    platform: string;
  }
): string {
  return `Tu es un expert en veille concurrentielle publicitaire et en analyse de strategies d'acquisition payante.

## Concurrent a analyser
- **Nom** : ${competitor.name}
- **URL/Page** : ${competitor.url || "Non fournie"}
- **Industrie** : ${competitor.industry}
- **Plateforme** : ${competitor.platform}

## Ta mission
En te basant sur ta connaissance du marche ${competitor.industry} et des strategies publicitaires de ce type d'entreprise, produis une analyse detaillee de la strategie publicitaire probable de ce concurrent.

## Format de reponse
Reponds UNIQUEMENT en JSON valide :
{
  "competitor_name": "${competitor.name}",
  "platform": "${competitor.platform}",
  "overview": "Resume de la strategie pub en 2-3 phrases",
  "estimated_active_ads": 15,
  "estimated_monthly_spend": "2000-5000EUR",
  "creative_mix": {
    "video_pct": 40,
    "image_pct": 35,
    "carousel_pct": 25
  },
  "ad_copy_patterns": [
    {
      "type": "Hook base sur la douleur",
      "example": "Exemple de hook",
      "frequency": "Tres frequent"
    }
  ],
  "hook_frameworks": [
    {
      "framework": "Nom du framework",
      "example": "Exemple concret",
      "effectiveness": "Fort | Moyen | Faible"
    }
  ],
  "cta_patterns": ["CTA utilise 1", "CTA utilise 2"],
  "targeting_inference": {
    "demographics": "Profil demographique cible",
    "interests": ["Interet 1", "Interet 2"],
    "lookalike_sources": ["Source probable"]
  },
  "funnel_structure": "Description de la structure de funnel utilisee",
  "strengths": ["Force 1", "Force 2"],
  "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
  "opportunities": [
    {
      "opportunity": "Description de l'opportunite",
      "action": "Comment l'exploiter"
    }
  ],
  "recommendations": [
    {
      "action": "Action recommandee",
      "priority": "Haute | Moyenne | Basse",
      "expected_impact": "Impact attendu"
    }
  ]
}`;
}
