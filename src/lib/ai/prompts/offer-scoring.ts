export interface OfferScoreResult {
  score_total: number;
  criteres: {
    credibilite: { score: number; feedback: string };
    pricing: { score: number; feedback: string };
    garantie: { score: number; feedback: string };
    delivery: { score: number; feedback: string };
    marche: { score: number; feedback: string };
    differenciation: { score: number; feedback: string };
  };
  recommandations: string[];
  quality_gate_passed: boolean;
}

interface OfferForScoring {
  offer_name: string;
  positioning: string | null;
  unique_mechanism: string | null;
  pricing_strategy: unknown;
  guarantees: unknown;
  no_brainer_element: string | null;
  risk_reversal: string | null;
  delivery_structure: unknown;
  oto_offer: unknown;
  ai_raw_response: unknown;
}

export function buildOfferScoringPrompt(offer: OfferForScoring): string {
  return `Tu es un expert en evaluation d'offres commerciales haute valeur. Tu notes les offres sur 100 points repartis en 6 criteres. Ton evaluation doit etre EXIGEANTE mais CONSTRUCTIVE.

## OFFRE A EVALUER

- Nom : ${offer.offer_name}
- Positionnement : ${offer.positioning || "Non defini"}
- Mecanisme unique : ${offer.unique_mechanism || "Non defini"}
- Strategie de prix : ${JSON.stringify(offer.pricing_strategy || {})}
- Garanties : ${JSON.stringify(offer.guarantees || [])}
- Element no-brainer : ${offer.no_brainer_element || "Non defini"}
- Inversion du risque : ${offer.risk_reversal || "Non defini"}
- Structure de delivery : ${JSON.stringify(offer.delivery_structure || {})}
- OTO : ${JSON.stringify(offer.oto_offer || {})}
${offer.ai_raw_response ? `- Reponse IA brute : ${JSON.stringify(offer.ai_raw_response)}` : ""}

## CRITERES DE NOTATION (total = 100 points, repartition CDC officielle)

### 1. Credibilite (0-20)
Le mecanisme unique est-il credible et differenciant ? La promesse est-elle specifique, mesurable, temporelle ? Le prospect comprend-il en 5 secondes ce qu'il obtient ? Le mecanisme a-t-il un nom propriétaire memorisable ? Les preuves (case studies, temoignages, data) soutiennent-elles la credibilite ?

### 2. Pricing (0-20)
Le prix suit-il la regle du 10% (10% du potentiel ajuste du client) ? Le ratio valeur percue / prix est-il minimum 3:1 (ideal 5:1) ? Les structures de paiement sont-elles strategiques (setup + performance, retainer + perf, paiement unique) ? Le plancher est-il respecte : (CAC + cout delivery) × 2 = prix minimum ? Le pricing est-il coherent avec le marche et les concurrents ?

### 3. Garantie (0-15)
La garantie comporte-t-elle les 5 elements requis : (1) pourcentage de remboursement (recommande 85%), (2) timeframe (90/120/180 jours), (3) conditions client (X actions/semaine, 100% calls, 80%+ implementation), (4) metrique de succes mesurable, (5) clause de service delivre ? L'inversion du risque est-elle reelle et credible ?

### 4. Delivery (0-15)
La structure de delivery est-elle operationnellement faisable ? Couvre-t-elle les piliers cles (acquisition, conversion, nurturing, vente, delivery) ? Le modele est-il adapte au niveau (DFY pour experts, DWY+DIY pour debutants) ? Y a-t-il un roadmap clair (S1-2, S3-4, M2, M3, M4+) avec milestones ? Les ressources necessaires sont-elles identifiees (personnes, outils, automatisations) ?

### 5. Marche (0-15)
L'offre repond-elle a une demande reelle validee par les donnees TRUTH (insights, ICP, Schwartz) ? Le positionnement est-il coherent avec le niveau de sophistication du marche ? Le pricing est-il valide par les budgets reels des clients cibles ? La taille de marche est-elle suffisante pour les objectifs de revenue ?

### 6. Differenciation (0-15)
L'offre est-elle clairement differenciee des 5-10 concurrents identifies ? Le Category OS est-il convaincant (nouvel ennemi, truth bombs, nouveau modele) ? Le prospect comprend-il immediatement POURQUOI cette offre est differente ? Y a-t-il des gaps concurrentiels exploites ?

## REGLES
- Sois HONNETE : pas de complaisance, le but est d'ameliorer l'offre
- Chaque feedback doit etre ACTIONNABLE (dire quoi ameliorer concretement)
- Genere 3 a 5 recommandations prioritaires
- quality_gate_passed = true si score_total >= 70

## FORMAT JSON
{
  "score_total": 0,
  "criteres": {
    "credibilite": { "score": 0, "feedback": "..." },
    "pricing": { "score": 0, "feedback": "..." },
    "garantie": { "score": 0, "feedback": "..." },
    "delivery": { "score": 0, "feedback": "..." },
    "marche": { "score": 0, "feedback": "..." },
    "differenciation": { "score": 0, "feedback": "..." }
  },
  "recommandations": ["..."],
  "quality_gate_passed": false
}`;
}
