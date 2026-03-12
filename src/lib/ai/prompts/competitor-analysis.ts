export interface CompetitorAdInsight {
  platform: string;
  ad_formats: string[];
  estimated_monthly_spend: string;
  main_hooks: string[];
  cta_patterns: string[];
  landing_page_type: string;
}

export interface CompetitorContentInsight {
  platform: string;
  posting_frequency: string;
  top_content_types: string[];
  engagement_level: string;
  audience_size_estimate: string;
}

export interface CompetitorAnalysisResult {
  competitors: {
    name: string;
    positioning: string;
    pricing_estimate: string;
    strengths: string[];
    weaknesses: string[];
    differentiation: string;
    ad_insights: CompetitorAdInsight[];
    content_insights: CompetitorContentInsight[];
    funnel_type: string;
    estimated_revenue_range: string;
  }[];
  market_gaps: string[];
  positioning_opportunities: string[];
  recommended_differentiation: string;
  industry_benchmarks: {
    avg_cpa: string;
    avg_ctr: string;
    avg_conversion_rate: string;
    dominant_ad_platform: string;
    dominant_content_platform: string;
  };
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
Realise une analyse concurrentielle ultra-approfondie de ce marche. Tu simules une veille complete comme si tu avais acces a Meta Ad Library, Instagram, YouTube, TikTok et LinkedIn. Utilise ta connaissance des marches pour fournir des donnees realistes et exploitables.

1. **Concurrents principaux** (5-8 concurrents) : Pour chacun, identifie :
   - Nom de l'entreprise/offre
   - Positionnement (comment ils se presentent)
   - Estimation de tarification (fourchette de prix)
   - Forces (3-5 points)
   - Faiblesses (3-5 points)
   - Ce qui les differencie
   - **Insights publicitaires** : plateformes utilisees, formats d'annonces, budget estime, hooks principaux, CTAs, type de landing page
   - **Insights contenu organique** : plateformes, frequence, types de contenu, niveau d'engagement, taille d'audience estimee
   - **Type de funnel** utilise (VSL, webinar, call booking, low-ticket, etc.)
   - **Fourchette de CA estime**

2. **Lacunes du marche** (market gaps) : 3-5 opportunites non exploitees par les concurrents actuels

3. **Opportunites de positionnement** : 3-5 angles de positionnement uniques pour se differencier

4. **Differenciation recommandee** : La strategie de differenciation la plus pertinente pour l'utilisateur

5. **Benchmarks sectoriels** : CPA moyen, CTR moyen, taux de conversion moyen, plateforme ads dominante, plateforme contenu dominante

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
      "differentiation": "Ce qui les rend uniques...",
      "ad_insights": [
        {
          "platform": "Meta Ads",
          "ad_formats": ["Image statique", "Video courte"],
          "estimated_monthly_spend": "5000-15000 EUR",
          "main_hooks": ["Hook 1", "Hook 2"],
          "cta_patterns": ["Reserver un appel", "Telecharger le guide"],
          "landing_page_type": "VSL + formulaire"
        }
      ],
      "content_insights": [
        {
          "platform": "Instagram",
          "posting_frequency": "5x/semaine",
          "top_content_types": ["Reels educatifs", "Temoignages"],
          "engagement_level": "Eleve (3-5%)",
          "audience_size_estimate": "15k-30k"
        }
      ],
      "funnel_type": "VSL → Call booking",
      "estimated_revenue_range": "50k-150k EUR/mois"
    }
  ],
  "market_gaps": ["Lacune 1", "Lacune 2", "Lacune 3"],
  "positioning_opportunities": ["Opportunite 1", "Opportunite 2", "Opportunite 3"],
  "recommended_differentiation": "La strategie de differenciation recommandee...",
  "industry_benchmarks": {
    "avg_cpa": "15-40 EUR",
    "avg_ctr": "1.5-3%",
    "avg_conversion_rate": "2-5%",
    "dominant_ad_platform": "Meta Ads",
    "dominant_content_platform": "Instagram"
  }
}`;
}
