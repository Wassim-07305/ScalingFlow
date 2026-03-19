export interface AdsScoreDimension {
  score: number;
  max: number;
  feedback: string;
}

export interface AdsScoreResult {
  has_data: true;
  score_global: number;
  quality_gate_passed: boolean;
  dimensions: {
    creatives: AdsScoreDimension;
    audiences: AdsScoreDimension;
    budget: AdsScoreDimension;
    performance: AdsScoreDimension;
    structure: AdsScoreDimension;
    optimisation: AdsScoreDimension;
  };
  recommandations: Array<{
    priorite: "haute" | "moyenne" | "faible";
    dimension: string;
    action: string;
  }>;
}

export interface AdsScoringCampaign {
  campaign_name: string;
  status: string;
  daily_budget: number | null;
  total_budget: number | null;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  roas: number;
  meta_campaign_id: string | null;
}

export interface AdsScoringCreative {
  creative_type: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  cpa: number | null;
  meta_ad_id: string | null;
}

export interface AdsScoringMetrics {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  ctr: number;
  cpm: number;
  cpa: number;
}

export interface AdsDataForScoring {
  campaigns: AdsScoringCampaign[];
  creatives: AdsScoringCreative[];
  daily_metrics: AdsScoringMetrics[];
  niche: string | null;
}

export function buildAdsScoringPrompt(data: AdsDataForScoring): string {
  const totalSpend = data.campaigns.reduce((s, c) => s + (c.total_spend || 0), 0);
  const totalConversions = data.campaigns.reduce(
    (s, c) => s + (c.total_conversions || 0),
    0,
  );
  const totalImpressions = data.campaigns.reduce(
    (s, c) => s + (c.total_impressions || 0),
    0,
  );
  const totalClicks = data.campaigns.reduce((s, c) => s + (c.total_clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgROAS =
    totalSpend > 0
      ? data.campaigns.reduce((s, c) => s + c.roas * (c.total_spend || 0), 0) / totalSpend
      : 0;
  const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const creativeTypes = [...new Set(data.creatives.map((c) => c.creative_type))];
  const activeCampaigns = data.campaigns.filter((c) => c.status === "active").length;
  const niche = data.niche || "non spécifié";

  return `Tu es un expert en publicité Meta (Facebook/Instagram) et performance marketing. Tu analyses les données ads d'un entrepreneur et tu notes leur stratégie publicitaire sur 100 points répartis en 6 dimensions. Ton évaluation doit être EXIGEANTE, CONCRÈTE et ACTIONNABLE.

## DONNÉES DU COMPTE ADS

### Contexte
- Niche / secteur : ${niche}
- Campagnes actives : ${activeCampaigns} / ${data.campaigns.length} total
- Créatives analysées : ${data.creatives.length}
- Période analysée : ${data.daily_metrics.length} jours de métriques

### Performances globales
- Dépense totale : ${totalSpend.toFixed(2)} €
- Impressions : ${totalImpressions.toLocaleString("fr-FR")}
- Clics : ${totalClicks.toLocaleString("fr-FR")}
- CTR moyen : ${avgCTR.toFixed(2)}%
- Conversions : ${totalConversions}
- CPA moyen : ${avgCPA.toFixed(2)} €
- ROAS moyen : ${avgROAS.toFixed(2)}x

### Détail campagnes
${data.campaigns
  .map(
    (c) =>
      `- ${c.campaign_name} | status: ${c.status} | budget: ${c.total_budget ?? c.daily_budget ?? 0}€ | dépense: ${c.total_spend}€ | ROAS: ${c.roas}x | conv: ${c.total_conversions}`,
  )
  .join("\n")}

### Détail créatives
${data.creatives
  .map(
    (c) =>
      `- type: ${c.creative_type} | status: ${c.status} | CTR: ${c.ctr?.toFixed(2) ?? 0}% | dépense: ${c.spend}€ | conv: ${c.conversions} | CPA: ${c.cpa?.toFixed(2) ?? "N/A"}€`,
  )
  .join("\n")}

### Types de créatives utilisés
${creativeTypes.join(", ") || "Aucun"}

### Métriques journalières (30 derniers jours — résumé)
${
  data.daily_metrics.length > 0
    ? `- Dépense min/max jour : ${Math.min(...data.daily_metrics.map((m) => m.spend)).toFixed(0)}€ / ${Math.max(...data.daily_metrics.map((m) => m.spend)).toFixed(0)}€
- ROAS min/max : ${Math.min(...data.daily_metrics.map((m) => m.roas)).toFixed(1)}x / ${Math.max(...data.daily_metrics.map((m) => m.roas)).toFixed(1)}x
- CTR min/max : ${Math.min(...data.daily_metrics.map((m) => m.ctr)).toFixed(2)}% / ${Math.max(...data.daily_metrics.map((m) => m.ctr)).toFixed(2)}%`
    : "Aucune donnée journalière disponible"
}

## CRITÈRES DE NOTATION (total = 100 points)

### 1. Créatives (0-20 points)
Évalue : diversité des formats (image/vidéo/carrousel/UGC), variété des hooks et angles (douleur, résultat, curiosité, preuve sociale), taux de refresh (idéal : nouvelles créatives toutes les 2-4 semaines), volume de tests actifs (idéal : 3-5 créatives en test simultané), spécificité des hooks (éviter les généralités).
Benchmarks : ≥4 formats différents = bon, ≥2 angles narratifs = bon, CTR créative >2% = performant.

### 2. Audiences (0-15 points)
Évalue : présence de segmentation cold/warm/hot, diversité des types d'audience (intérêts, LAL, retargeting), taille estimée des audiences (pas trop larges ni trop étroites), exclusions configurées pour éviter l'overlap.
Benchmarks : 3 niveaux de funnel présents = bon, lookalike ≥ 1% = acceptable.

### 3. Budget (0-15 points)
Évalue : répartition test/scale (idéal 70% test / 30% scale), cohérence budget/objectif ROAS, scaling progressif (+20-30% max), présence d'un budget de sécurité. Si dépense < 500€ : difficile d'évaluer.
Benchmarks : ratio dépense/budget > 80% = bien utilisé, scaling régulier = positif.

### 4. Performance (0-25 points)
C'est la dimension la plus pondérée. Évalue les KPIs vs benchmarks par secteur :
- Coaching/formation : CTR >1.5%, CPA <50€, ROAS >2.5x
- E-commerce : CTR >1%, CPA <30€, ROAS >3x
- SaaS/Tech : CTR >0.8%, CPA <100€, ROAS >2x
- Immobilier : CTR >0.5%, CPA <200€, ROAS >1.5x
- Finance/Crypto : CTR >0.7%, CPA <150€, ROAS >2x
- Niche non identifiée : CTR >1%, CPA <80€, ROAS >2x

### 5. Structure (0-15 points)
Évalue : naming convention cohérente (campagne > adset > ad), organisation CBO vs ABO (CBO recommandé pour scaling), segmentation logique des objectifs, absence de cannibalisation entre campagnes.
Benchmarks : noms explicites = bon, objectifs distincts par campagne = bon.

### 6. Optimisation (0-10 points)
Évalue : fréquence de test (idéal : nouveau test chaque semaine), kill criteria définis (pauser si CTR <0.5% après 1000 impressions), décisions data-driven (basées sur les chiffres, pas l'intuition), itérations documentées.
Benchmarks : créatives stoppées régulièrement = signe d'optimisation, variance ROAS journalier faible = stable.

## RÈGLES
- Sois HONNÊTE : pas de complaisance si les données sont mauvaises
- Chaque feedback doit donner 1-2 actions concrètes à faire cette semaine
- Les recommandations doivent être triées par priorité (haute, moyenne, faible)
- quality_gate_passed = true si score_global >= 65
- Si données insuffisantes pour une dimension, score conservateur + feedback explicatif

## FORMAT JSON STRICT
{
  "has_data": true,
  "score_global": 0,
  "quality_gate_passed": false,
  "dimensions": {
    "creatives": { "score": 0, "max": 20, "feedback": "..." },
    "audiences": { "score": 0, "max": 15, "feedback": "..." },
    "budget": { "score": 0, "max": 15, "feedback": "..." },
    "performance": { "score": 0, "max": 25, "feedback": "..." },
    "structure": { "score": 0, "max": 15, "feedback": "..." },
    "optimisation": { "score": 0, "max": 10, "feedback": "..." }
  },
  "recommandations": [
    { "priorite": "haute", "dimension": "performance", "action": "..." },
    { "priorite": "haute", "dimension": "creatives", "action": "..." },
    { "priorite": "moyenne", "dimension": "budget", "action": "..." }
  ]
}`;
}
