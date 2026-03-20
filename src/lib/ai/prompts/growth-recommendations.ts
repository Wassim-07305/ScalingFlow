import type { GrowthTier } from "@/lib/services/growth-tiers";

export interface GrowthRecommendationsResult {
  current_tier: string;
  next_tier: string;
  blocking_reasons: string[];
  recommendations: Array<{
    title: string;
    action: string;
    kpi_target: string;
    suggested_deadline: string;
    scalingflow_feature: string;
    priority: "haute" | "moyenne";
  }>;
  transition_plan: string[];
  benchmark_comparison: string;
}

export interface GrowthRecommendationsContext {
  // Profil
  current_revenue: number | null;
  target_revenue: number | null;
  niche: string | null;
  experience_level: string | null;

  // Palier
  current_tier: GrowthTier;
  next_tier: GrowthTier | null;
  progress_percent: number;

  // Scores business
  business_score_global: number | null;
  acquisition_score: number | null;
  offer_score: number | null;
  delivery_score: number | null;

  // Ads
  has_ads: boolean;
  ad_campaigns_count: number;
  avg_roas: number;
  avg_cpl: number;

  // Pipeline
  pipeline_leads_count: number;
  funnels_count: number;
  leads_count: number;

  // Offre
  offer_name: string | null;
  has_offer: boolean;
}

export function buildGrowthRecommendationsPrompt(
  ctx: GrowthRecommendationsContext,
): string {
  const tierInfo = `
**Palier actuel : ${ctx.current_tier.label} (${ctx.current_tier.id})**
- CA mensuel : ${ctx.current_revenue ? `${ctx.current_revenue.toLocaleString("fr-FR")} €` : "Non renseigné"}
- Objectif : ${ctx.target_revenue ? `${ctx.target_revenue.toLocaleString("fr-FR")} €/mois` : "Non renseigné"}
- Progression vers ${ctx.next_tier ? ctx.next_tier.label : "le sommet"} : ${ctx.progress_percent}%

**Focus prioritaire à ce palier** : ${ctx.current_tier.focus_areas.join(", ")}
**Métriques clés du palier** : ${ctx.current_tier.key_metrics.join(" | ")}
**Canaux typiques à ce stade** : ${ctx.current_tier.typical_channels.join(", ")}
**Équipe typique** : ${ctx.current_tier.typical_team}`;

  const scoresInfo =
    ctx.business_score_global !== null
      ? `
**Scores Business**
- Score global : ${ctx.business_score_global}/100
- Acquisition : ${ctx.acquisition_score ?? "N/A"}/100
- Offre : ${ctx.offer_score ?? "N/A"}/100
- Delivery : ${ctx.delivery_score ?? "N/A"}/100`
      : "Scores business : non calculés";

  const adsInfo = ctx.has_ads
    ? `
**Performance Ads**
- ${ctx.ad_campaigns_count} campagne(s) active(s)
- ROAS moyen : ${ctx.avg_roas}x
- CPL moyen : ${ctx.avg_cpl}€`
    : "Publicité payante : pas encore lancée";

  const pipelineInfo = `
**Pipeline & Funnel**
- Leads pipeline : ${ctx.pipeline_leads_count}
- Funnels créés : ${ctx.funnels_count}
- Leads totaux : ${ctx.leads_count}
- Offre principale : ${ctx.offer_name ?? "Non définie"}`;

  const dangerSigns = ctx.current_tier.danger_signs
    .map((s) => `- ${s}`)
    .join("\n");

  const nextTierReqs = ctx.next_tier
    ? ctx.next_tier.next_level_requirements
        .map((r) => `- ${r}`)
        .join("\n")
    : "";

  const scalingflowFeatures = `
**Features ScalingFlow disponibles :**
- Scoring Business : analyse acquisition, offre, delivery
- Scoring Ads : identifie les créatives fatiguées et optimise le budget
- Funnel Builder : crée et publie des funnels de conversion
- Vault : documente ton expertise pour les agents IA
- Plan Quotidien : 3-5 actions prioritaires chaque jour
- Scoring Ads : détecte les blocages de performance publicitaire
- Pipeline : suivi des prospects en cours
- Offre : packaging et positionnement de ton offre
- Contenu : stratégie de contenu adaptée à ta niche`;

  return `Tu es un coach business senior et exigeant. Tu aides des entrepreneurs à passer au palier de CA suivant. Tu parles CASH, sans bullshit, avec des exemples concrets. Tu connais les pièges de chaque palier parce que tu en as vu des centaines.

## DONNÉES DU USER

${tierInfo}

${scoresInfo}

${adsInfo}

${pipelineInfo}

**Niche** : ${ctx.niche ?? "Non renseignée"}
**Expérience** : ${ctx.experience_level ?? "Non renseignée"}

## SIGNAUX D'ALARME TYPIQUES AU PALIER ${ctx.current_tier.label.toUpperCase()}

${dangerSigns}

${ctx.next_tier ? `## REQUIREMENTS POUR PASSER À ${ctx.next_tier.label.toUpperCase()}\n\n${nextTierReqs}` : ""}

${scalingflowFeatures}

## TA MISSION

Génère un plan de croissance personnalisé basé sur les données réelles de ce user. Sois CONCRET et DIRECT. Pas de conseils génériques.

**RÉPONDS EN JSON STRICT avec cette structure :**
\`\`\`json
{
  "current_tier": "label du palier actuel",
  "next_tier": "label du palier suivant ou 'Au sommet'",
  "blocking_reasons": [
    "Raison précise #1 basée sur les données (ex: Score acquisition à 35/100 = ton acquisition est cassée)",
    "Raison précise #2",
    "Raison précise #3 maximum"
  ],
  "recommendations": [
    {
      "title": "Titre court de l'action (max 8 mots)",
      "action": "Description précise et actionnables de ce qu'il faut faire. Inclut comment le faire concrètement.",
      "kpi_target": "Métrique précise avec chiffre cible (ex: ROAS > 2x, 5 appels/semaine)",
      "suggested_deadline": "J+30 / J+60 / J+90",
      "scalingflow_feature": "Nom de la feature ScalingFlow à utiliser",
      "priority": "haute ou moyenne"
    }
  ],
  "transition_plan": [
    "Changement #1 le plus impactant pour passer au palier suivant — sois spécifique",
    "Changement #2",
    "Changement #3"
  ],
  "benchmark_comparison": "Comparaison avec ce que font les entrepreneurs qui réussissent à ce palier. Exemple concret de ce qui marche."
}
\`\`\`

**Contraintes :**
- Exactement 5 recommandations, classées par priorité décroissante
- Les raisons de blocage doivent être basées sur les DONNÉES RÉELLES (scores, métriques)
- Chaque recommandation doit mentionner une feature ScalingFlow concrète
- Le ton : coach direct et bienveillant, pas professeur, pas générique
- Exemples : "Les entrepreneurs à 5-10K qui passent à 10K+ le font généralement en..."`;
}
