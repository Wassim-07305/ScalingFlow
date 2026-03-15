export interface BusinessAuditContext {
  businessName: string;
  offerDescription: string;
  funnelDescription: string;
  acquisitionChannels: string[];
  monthlyRevenue: number;
  teamSize: number;
  mainChallenges: string;
}

export interface BusinessAuditRecommendation {
  title: string;
  description: string;
  priority: "urgent" | "important" | "nice-to-have";
}

export interface BusinessAuditCategory {
  name: string;
  score: number;
  diagnostic: string;
  recommendations: BusinessAuditRecommendation[];
}

export interface BusinessAuditResult {
  overall_score: number;
  summary: string;
  categories: {
    offre: BusinessAuditCategory;
    funnel: BusinessAuditCategory;
    acquisition: BusinessAuditCategory;
    vente: BusinessAuditCategory;
    retention: BusinessAuditCategory;
    automatisation: BusinessAuditCategory;
  };
  quick_wins: string[];
  plan_90_jours: string;
}

export function businessAuditPrompt(context: BusinessAuditContext): string {
  return `Tu es un consultant business senior spécialisé dans le scaling d'entreprises en ligne (infopreneurs, coaches, agences, SaaS). Tu réalises un audit complet et sans complaisance du business existant.

## INFORMATIONS DU BUSINESS
- Nom : ${context.businessName}
- Offre actuelle : ${context.offerDescription}
- Funnel actuel : ${context.funnelDescription}
- Canaux d'acquisition : ${context.acquisitionChannels.join(", ")}
- Revenu mensuel : ${context.monthlyRevenue} EUR/mois
- Taille équipe : ${context.teamSize <= 1 ? "Solopreneur" : context.teamSize + " personnes"}
- Défis principaux : ${context.mainChallenges}

## TA MISSION
Réalise un audit complet et honnête du business. Pour chaque catégorie, attribue un score /10, un diagnostic clair et 3 recommandations actionnables avec leur priorité.

Sois direct et précis. Identifie les failles, les opportunités manquées et les leviers de croissance les plus rapides.

## FORMAT DE RÉPONSE
Réponds en JSON structuré :
{
  "overall_score": 65,
  "summary": "Résumé exécutif en 2-3 phrases...",
  "categories": {
    "offre": {
      "name": "Offre",
      "score": 7,
      "diagnostic": "Analyse détaillée de l'offre actuelle, ses forces et faiblesses...",
      "recommendations": [
        {
          "title": "Titre de la recommandation",
          "description": "Description détaillée de l'action à prendre et pourquoi...",
          "priority": "urgent"
        },
        {
          "title": "...",
          "description": "...",
          "priority": "important"
        },
        {
          "title": "...",
          "description": "...",
          "priority": "nice-to-have"
        }
      ]
    },
    "funnel": {
      "name": "Funnel",
      "score": 5,
      "diagnostic": "...",
      "recommendations": [...]
    },
    "acquisition": {
      "name": "Acquisition",
      "score": 6,
      "diagnostic": "...",
      "recommendations": [...]
    },
    "vente": {
      "name": "Vente",
      "score": 4,
      "diagnostic": "...",
      "recommendations": [...]
    },
    "retention": {
      "name": "Rétention",
      "score": 3,
      "diagnostic": "...",
      "recommendations": [...]
    },
    "automatisation": {
      "name": "Automatisation",
      "score": 5,
      "diagnostic": "...",
      "recommendations": [...]
    }
  },
  "quick_wins": [
    "3 à 5 actions que l'entrepreneur peut faire cette semaine pour des résultats rapides"
  ],
  "plan_90_jours": "Plan d'action structuré sur 90 jours pour scaler le business, organisé en 3 phases de 30 jours..."
}

IMPORTANT :
- Le score overall est la moyenne pondérée des 6 catégories sur 100 (pas sur 10)
- Chaque catégorie a exactement 3 recommandations
- Les priorités sont : "urgent" (à faire cette semaine), "important" (ce mois-ci), "nice-to-have" (quand les bases sont solides)
- Sois spécifique à CE business, pas de conseils génériques
- Le plan 90 jours doit être concret et adapté au revenu actuel et aux ressources disponibles`;
}
