export function bleedingNeckPainsPrompt(
  market: {
    market_name: string;
    market_description?: string;
    problems?: string[];
    recommended_positioning?: string;
  },
  avatar: Record<string, unknown>,
): string {
  return `Tu es un expert en psychologie du consommateur et en identification de "bleeding-neck pains" — les douleurs si intenses que le prospect est pret a payer immediatement pour les resoudre.

## Contexte du marche
- **Marche** : ${market.market_name}
- **Description** : ${market.market_description || "Non definie"}
- **Problemes identifies** : ${(market.problems || []).join(", ") || "Non definis"}
- **Positionnement** : ${market.recommended_positioning || "Non defini"}

## Avatar client
${JSON.stringify(avatar, null, 2)}

## Ta mission
Identifie les bleeding-neck pains sur 4 couches de profondeur, du plus visible au plus profond. Chaque couche doit contenir 3-5 pains concrets et actionnables.

### Les 4 couches :
1. **Surface** — Les symptomes visibles, ce dont les prospects se plaignent ouvertement
2. **Economique** — L'impact financier concret (perte de CA, couts caches, manque a gagner)
3. **Psychologique** — Les croyances limitantes, peurs, frustrations profondes
4. **Opportunite** — Ce qu'ils veulent mais ne savent pas comment obtenir

## Format de reponse
Reponds UNIQUEMENT en JSON valide :
{
  "market_name": "${market.market_name}",
  "total_pains": 16,
  "severity_score": 85,
  "layers": [
    {
      "layer": "Surface",
      "description": "Les symptomes visibles du probleme",
      "pains": [
        {
          "pain": "Description concise du pain",
          "intensity": 8,
          "verbatim": "Ce que le prospect dirait litteralement",
          "trigger": "Ce qui declenche ce pain au quotidien",
          "current_solution": "Comment ils essaient de resoudre ca (souvent mal)"
        }
      ]
    },
    {
      "layer": "Economique",
      "description": "L'impact financier concret",
      "pains": [...]
    },
    {
      "layer": "Psychologique",
      "description": "Les croyances et peurs profondes",
      "pains": [...]
    },
    {
      "layer": "Opportunite",
      "description": "Ce qu'ils veulent sans savoir comment",
      "pains": [...]
    }
  ],
  "bleeding_neck_pain": {
    "statement": "LE pain #1 le plus intense du marche en une phrase",
    "why_bleeding": "Pourquoi c'est un bleeding-neck pain (urgence + intensite)",
    "hook_angle": "Comment utiliser ce pain dans un hook marketing"
  }
}`;
}
