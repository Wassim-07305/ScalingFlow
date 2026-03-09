export function contentSpyPrompt(
  competitor: {
    name: string;
    handle?: string;
    platform: string;
  }
): string {
  return `Tu es un expert en analyse de contenu organique et en strategie de content marketing.

## Concurrent a analyser
- **Nom** : ${competitor.name}
- **Handle/URL** : ${competitor.handle || "Non fourni"}
- **Plateforme** : ${competitor.platform}

## Ta mission
Analyse la strategie de contenu probable de ce concurrent sur ${competitor.platform} et fournis des insights actionnables.

## Format de reponse
Reponds UNIQUEMENT en JSON valide :
{
  "competitor_name": "${competitor.name}",
  "platform": "${competitor.platform}",
  "overview": "Resume de la strategie contenu",
  "content_types": [
    {
      "type": "Type de contenu (ex: Reels educatifs)",
      "frequency": "3-4 par semaine",
      "estimated_engagement": "Eleve",
      "description": "Description du type"
    }
  ],
  "top_themes": [
    {
      "theme": "Theme principal",
      "sub_topics": ["Sous-sujet 1", "Sous-sujet 2"],
      "engagement_level": "Fort | Moyen | Faible"
    }
  ],
  "hook_variations": [
    {
      "hook_type": "Type de hook",
      "example": "Exemple concret",
      "effectiveness": "Fort | Moyen | Faible"
    }
  ],
  "posting_patterns": {
    "frequency": "X posts/semaine",
    "best_days": ["Lundi", "Mercredi"],
    "best_times": ["9h", "18h"],
    "consistency": "Regulier | Irregulier"
  },
  "engagement_tactics": ["Tactique 1", "Tactique 2"],
  "viral_formula": {
    "pattern": "Le pattern de contenu viral identifie",
    "elements": ["Element cle 1", "Element cle 2"],
    "replication_guide": "Comment repliquer cette formule"
  },
  "content_gaps": [
    {
      "gap": "Sujet non couvert par le concurrent",
      "opportunity": "Comment tu peux l'exploiter",
      "difficulty": "Facile | Moyen | Difficile"
    }
  ],
  "actionable_insights": [
    {
      "insight": "Insight actionnable",
      "action": "Action concrete a prendre",
      "expected_result": "Resultat attendu"
    }
  ]
}`;
}
