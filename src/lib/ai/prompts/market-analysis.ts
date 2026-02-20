export interface OnboardingData {
  skills: string[];
  experienceLevel: string;
  currentRevenue: number;
  targetRevenue: number;
  industries: string[];
  objectives: string[];
  budgetMonthly: number;
}

export function marketAnalysisPrompt(data: OnboardingData): string {
  return `Tu es un expert en stratégie marketing et business development spécialisé dans l'IA et l'automatisation pour les freelances et agences.

## CONTEXTE UTILISATEUR
- Compétences : ${data.skills.join(", ")}
- Niveau d'expérience : ${data.experienceLevel}
- Industries passées : ${data.industries.join(", ")}
- Revenu actuel : ${data.currentRevenue}€/mois
- Objectif : ${data.targetRevenue}€/mois
- Budget ads : ${data.budgetMonthly}€/mois

## TA MISSION
Analyse le marché et identifie les 3 meilleures opportunités de positionnement pour cet utilisateur. Pour chaque opportunité :

1. **Marché cible** : industrie/niche spécifique qui a besoin d'infrastructure IA
2. **Problèmes spécifiques** : 3-5 problèmes concrets que cette niche rencontre
3. **Score de viabilité** (0-100) basé sur : taille du marché, urgence du besoin, capacité à payer, niveau de concurrence, adéquation avec les compétences de l'utilisateur
4. **Positionnement recommandé** : angle unique d'attaque
5. **Avatar client** : persona détaillé (nom, rôle, CA, problèmes quotidiens, désirs, objections)
6. **Concurrents principaux** : 3-5 concurrents avec forces/faiblesses
7. **Signaux de demande** : indices concrets que ce marché est prêt

## FORMAT DE RÉPONSE
Réponds en JSON structuré :
{
  "markets": [
    {
      "name": "...",
      "description": "...",
      "problems": ["...", "..."],
      "viability_score": 85,
      "positioning": "...",
      "avatar": { "name": "...", "role": "...", "revenue": "...", "pain_points": ["..."], "desires": ["..."], "objections": ["..."] },
      "competitors": [{ "name": "...", "strengths": ["..."], "weaknesses": ["..."] }],
      "demand_signals": ["...", "..."],
      "why_good_fit": "..."
    }
  ],
  "recommended_market_index": 0,
  "reasoning": "..."
}`;
}
