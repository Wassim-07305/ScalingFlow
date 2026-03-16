export interface SchwartzAnalysisResult {
  niveau: 1 | 2 | 3 | 4 | 5;
  description: string;
  implication_marketing: string;
  strategie_recommandee:
    | "vsl"
    | "social_funnel"
    | "education_first"
    | "direct_response";
  angle_publicitaire: string;
  type_contenu_prioritaire: string;
  niveau_preuve_requis: "faible" | "moyen" | "eleve" | "tres_eleve";
}

export interface SchwartzAnalysisInput {
  market_name: string;
  market_description: string | null;
  problems: string[] | null;
  recommended_positioning: string | null;
  country: string | null;
}

export function buildSchwartzAnalysisPrompt(
  data: SchwartzAnalysisInput,
): string {
  return `Tu es un expert en marketing direct et en analyse de sophistication de marche selon les 5 niveaux d'Eugene Schwartz (Breakthrough Advertising).

## MARCHE A ANALYSER
- Nom du marche : ${data.market_name}
- Description : ${data.market_description || "Non fournie"}
- Problemes identifies : ${data.problems?.join(", ") || "Non fournis"}
- Positionnement envisage : ${data.recommended_positioning || "Non fourni"}
- Pays : ${data.country || "Non specifie"}

## LES 5 NIVEAUX DE SCHWARTZ

**Niveau 1 — Marche vierge** : Le prospect ne sait pas qu'il a un probleme. Personne ne propose de solution. Le marche est completement non eduque. Strategie : education, creation de conscience du probleme.

**Niveau 2 — Probleme connu, pas de solution** : Le prospect sait qu'il a un probleme mais ne connait aucune solution. Il cherche activement. Strategie : presenter la solution de facon directe, promesse forte.

**Niveau 3 — Solutions connues, pas la tienne** : Le prospect connait des solutions mais pas la tienne. Concurrence moderee. Strategie : differenciation, mecanisme unique, USP.

**Niveau 4 — Marche sature** : Beaucoup de solutions existent, le prospect est sceptique. Les promesses classiques ne marchent plus. Strategie : preuve sociale massive, angle unique, story-telling.

**Niveau 5 — Marche hyper-sature** : Le prospect est completement blase, ne croit plus aux promesses. Strategie : identification pure (parler de LUI, pas du produit), preuves extremes, approche contre-intuitive.

## TA MISSION
Analyse ce marche et determine :
1. Son niveau de sophistication Schwartz (1 a 5)
2. La description precise de pourquoi ce marche est a ce niveau
3. Les implications concretes pour le marketing
4. La strategie recommandee parmi : "vsl" (Video Sales Letter — marches niveaux 2-3), "social_funnel" (Entonnoir social — marches niveaux 3-4), "education_first" (Education d'abord — marches niveaux 1-2), "direct_response" (Reponse directe — marches niveaux 4-5)
5. L'angle publicitaire a privilegier
6. Le type de contenu prioritaire
7. Le niveau de preuve requis ("faible", "moyen", "eleve", "tres_eleve")

## FORMAT DE REPONSE
Reponds en JSON structure :
{
  "niveau": 3,
  "description": "Explication detaillee de pourquoi le marche est a ce niveau...",
  "implication_marketing": "Ce que cela implique concretement pour la strategie...",
  "strategie_recommandee": "social_funnel",
  "angle_publicitaire": "L'angle a utiliser dans les publicites...",
  "type_contenu_prioritaire": "Le type de contenu a privilegier...",
  "niveau_preuve_requis": "eleve"
}`;
}
