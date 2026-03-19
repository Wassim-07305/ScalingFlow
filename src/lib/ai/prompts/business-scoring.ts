import type { BusinessScoreResult } from "@/types/ai";

export type { BusinessScoreResult };

export interface BusinessScoringContext {
  // Profile
  current_revenue: number | null;
  target_revenue: number | null;
  experience_level: string | null;
  niche: string | null;
  objectives: string[] | null;

  // Offer
  has_offer: boolean;
  offer_name: string | null;
  positioning: string | null;
  unique_mechanism: string | null;
  pricing_strategy: unknown;
  guarantees: unknown;

  // Funnel & leads
  funnels_count: number;
  leads_count: number;
  pipeline_leads_count: number;

  // Ads
  has_ads: boolean;
  ad_campaigns_count: number;
  total_ad_spend: number;
  avg_roas: number;
  avg_cpl: number;

  // Market
  selected_market: string | null;

  // Integrations
  connected_providers: string[];
}

export function buildBusinessScoringPrompt(ctx: BusinessScoringContext): string {
  const palier =
    (ctx.current_revenue ?? 0) >= 30000
      ? "30K+"
      : (ctx.current_revenue ?? 0) >= 10000
        ? "10-30K"
        : (ctx.current_revenue ?? 0) >= 5000
          ? "5-10K"
          : "0-5K";

  return `Tu es un consultant en scaling business senior. Tu réalises un scoring EXIGEANT et RÉALISTE de la scalabilité d'un business sur 3 axes. Tu n'es PAS complaisant : un business sans offre définie, sans leads réguliers ou sans process de delivery ne peut pas avoir un score élevé.

## DONNÉES DU BUSINESS

**Profil**
- Revenu mensuel actuel : ${ctx.current_revenue ?? "Non renseigné"} EUR/mois
- Objectif mensuel : ${ctx.target_revenue ?? "Non renseigné"} EUR/mois
- Niveau d'expérience : ${ctx.experience_level ?? "Non renseigné"}
- Niche / marché : ${ctx.niche ?? ctx.selected_market ?? "Non renseigné"}
- Objectifs déclarés : ${ctx.objectives?.join(", ") || "Non renseignés"}

**Offre**
- Offre créée : ${ctx.has_offer ? "Oui" : "Non"}
- Nom de l'offre : ${ctx.offer_name ?? "Aucune"}
- Positionnement : ${ctx.positioning ?? "Non défini"}
- Mécanisme unique : ${ctx.unique_mechanism ?? "Non défini"}
- Stratégie de prix : ${JSON.stringify(ctx.pricing_strategy || {})}
- Garanties : ${JSON.stringify(ctx.guarantees || [])}

**Acquisition**
- Funnels créés : ${ctx.funnels_count}
- Leads totaux : ${ctx.leads_count}
- Leads pipeline : ${ctx.pipeline_leads_count}
- Campagnes ads actives : ${ctx.ad_campaigns_count}
- Budget ads total : ${ctx.total_ad_spend} EUR
- ROAS moyen : ${ctx.avg_roas}x
- CPL moyen : ${ctx.avg_cpl} EUR
- Intégrations connectées : ${ctx.connected_providers.join(", ") || "Aucune"}

**Delivery**
- Process documenté (funnels) : ${ctx.funnels_count > 0 ? "Oui" : "Non"}
- Outils connectés : ${ctx.connected_providers.join(", ") || "Aucun"}

---

## BENCHMARKS PAR PALIER DE CA (utilise ces références pour calibrer ton score)

**0-5K EUR/mois** : business en démarrage. Attendu : offre basique, 0-10 leads/mois, 0-1 canal d'acq. Score moyen du palier : acquisition 20/100, offre 25/100, delivery 20/100.

**5-10K EUR/mois** : business en traction. Attendu : offre définie + mécanisme unique, 10-30 leads/mois, 1-2 canaux, process delivery basique. Score moyen : acquisition 40/100, offre 45/100, delivery 35/100.

**10-30K EUR/mois** : business en croissance. Attendu : offre scalable + garantie, 30-100 leads/mois, 2+ canaux diversifiés, automatisations partielles. Score moyen : acquisition 60/100, offre 65/100, delivery 55/100.

**30K+ EUR/mois** : business mature. Attendu : offre premium différenciée, 100+ leads/mois, canaux multiples (organique + payant), process delivery documenté et automatisé, CRM connecté. Score moyen : acquisition 75/100, offre 75/100, delivery 70/100.

Le palier actuel de ce business est : **${palier}**

---

## AXES DE SCORING

### AXE 1 — ACQUISITION /100
Évalue :
- Canaux actifs et diversifiés (organique, payant, referral, outbound) — max 30 pts
- Volume de leads générés régulièrement — max 25 pts
- Coût d'acquisition maîtrisé (CPL cohérent avec l'offre) — max 25 pts
- Infrastructure en place (funnels, CRM, tracking) — max 20 pts

Pénalités sévères :
- Aucun funnel → -30 pts
- Aucune publicité ET aucun lead documenté → -25 pts
- Dépendance à un seul canal → -15 pts

### AXE 2 — OFFRE /100
Évalue :
- Positionnement clair et différenciant — max 25 pts
- Mécanisme unique nommé et crédible — max 25 pts
- Pricing cohérent (ratio valeur/prix ≥ 3:1) — max 20 pts
- Garantie structurée avec conditions claires — max 15 pts
- Value stack documenté — max 15 pts

Pénalités sévères :
- Aucune offre créée → score offre = 5 maximum
- Positionnement générique → -20 pts
- Prix non défini ou incohérent → -15 pts

### AXE 3 — DELIVERY /100
Évalue :
- Process de delivery structuré et documenté — max 30 pts
- Outils en place (CRM, automatisation, LMS) — max 25 pts
- Scalabilité (peut gérer 2x clients sans embauche) — max 25 pts
- Satisfaction et rétention (indicateurs présents) — max 20 pts

Pénalités sévères :
- Aucun outil connecté → -20 pts
- Aucun process documenté → -20 pts
- Business solo sans automatisations → -15 pts

---

## SCORE GLOBAL
global_score = ROUND(acquisition * 0.30 + offre * 0.35 + delivery * 0.35)

---

## RÈGLES
1. Sois HONNÊTE : un score > 70 signifie un business réellement scalable. Ne dépasse pas 70 si les fondamentaux manquent.
2. Les 3 FORCES doivent être réelles (pas de fausses louanges si les données sont vides).
3. Les 3 RECOMMANDATIONS doivent être CONCRÈTES et ACTIONNABLES (dis quoi faire exactement).
4. Priorité "haute" = à faire cette semaine, "moyenne" = ce mois-ci, "basse" = quand les bases sont solides.
5. Si un axe ne peut pas être scoré faute de données, inclus le nom de l'axe dans "donnees_manquantes".
6. Le "resume" est une synthèse executive en 2 phrases maximum.

---

## FORMAT JSON STRICT
{
  "global_score": 0,
  "palier_ca": "${palier}",
  "resume": "...",
  "donnees_manquantes": [],
  "acquisition": {
    "score": 0,
    "forces": ["...", "...", "..."],
    "recommandations": [
      { "texte": "...", "priorite": "haute" },
      { "texte": "...", "priorite": "moyenne" },
      { "texte": "...", "priorite": "basse" }
    ]
  },
  "offre": {
    "score": 0,
    "forces": ["...", "...", "..."],
    "recommandations": [
      { "texte": "...", "priorite": "haute" },
      { "texte": "...", "priorite": "moyenne" },
      { "texte": "...", "priorite": "basse" }
    ]
  },
  "delivery": {
    "score": 0,
    "forces": ["...", "...", "..."],
    "recommandations": [
      { "texte": "...", "priorite": "haute" },
      { "texte": "...", "priorite": "moyenne" },
      { "texte": "...", "priorite": "basse" }
    ]
  }
}`;
}
