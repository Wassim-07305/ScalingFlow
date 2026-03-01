export interface CompetitorAnalysisResult {
  competitors: {
    name: string;
    positioning: string;
    pricing_estimate: string;
    strengths: string[];
    weaknesses: string[];
    differentiation: string;
  }[];
  market_gaps: string[];
  positioning_opportunities: string[];
  recommended_differentiation: string;
}

export interface CompetitorAnalysisInput {
  market_name: string;
  market_description: string | null;
  recommended_positioning: string | null;
  country: string | null;
  language: string | null;
  user_skills?: string[];
}

export function buildCompetitorAnalysisPrompt(data: CompetitorAnalysisInput): string {
  const skillsContext = data.user_skills && data.user_skills.length > 0
    ? `\n- Competences de l'utilisateur : ${data.user_skills.join(", ")}`
    : "";

  return `Tu es un expert en veille concurrentielle et en analyse strategique de marche. Tu analyses les concurrents d'un marche donne sans scraping — tu utilises ta connaissance des marches, des acteurs cles et des tendances pour fournir une analyse pertinente.

## MARCHE A ANALYSER
- Nom du marche : ${data.market_name}
- Description : ${data.market_description || "Non fournie"}
- Positionnement envisage : ${data.recommended_positioning || "Non fourni"}
- Pays cible : ${data.country || "Non specifie"}
- Langue : ${data.language || "Francais"}${skillsContext}

## TA MISSION
Realise une analyse concurrentielle approfondie de ce marche :

1. **Concurrents principaux** (5-8 concurrents) : Pour chacun, identifie :
   - Nom de l'entreprise/offre
   - Positionnement (comment ils se presentent)
   - Estimation de tarification (fourchette de prix)
   - Forces (3-5 points)
   - Faiblesses (3-5 points)
   - Ce qui les differencie

2. **Lacunes du marche** (market gaps) : 3-5 opportunites non exploitees par les concurrents actuels

3. **Opportunites de positionnement** : 3-5 angles de positionnement uniques pour se differencier

4. **Differenciation recommandee** : La strategie de differenciation la plus pertinente pour l'utilisateur compte tenu de ses competences et du paysage concurrentiel

## FORMAT DE REPONSE
Reponds en JSON structure :
{
  "competitors": [
    {
      "name": "Nom du concurrent",
      "positioning": "Comment ils se positionnent...",
      "pricing_estimate": "500-2000 EUR/mois",
      "strengths": ["Force 1", "Force 2", "Force 3"],
      "weaknesses": ["Faiblesse 1", "Faiblesse 2", "Faiblesse 3"],
      "differentiation": "Ce qui les rend uniques..."
    }
  ],
  "market_gaps": ["Lacune 1", "Lacune 2", "Lacune 3"],
  "positioning_opportunities": ["Opportunite 1", "Opportunite 2", "Opportunite 3"],
  "recommended_differentiation": "La strategie de differenciation recommandee..."
}`;
}
