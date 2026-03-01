export interface OfferScoreResult {
  score_total: number;
  criteres: {
    clarte_promesse: { score: number; feedback: string };
    force_mecanisme: { score: number; feedback: string };
    pricing_justifie: { score: number; feedback: string };
    garantie_solide: { score: number; feedback: string };
    urgence_rarete: { score: number; feedback: string };
    value_stack: { score: number; feedback: string };
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

## CRITERES DE NOTATION (chaque critere sur ~16.7 points, total = 100)

### 1. Clarte de la promesse (0-17)
La promesse est-elle specifique, mesurable, temporelle ? Le prospect comprend-il en 5 secondes ce qu'il obtient ?

### 2. Force du mecanisme unique (0-17)
Le mecanisme est-il vraiment unique ? Est-il credible ? Le prospect peut-il comprendre POURQUOI ca marche ?

### 3. Pricing justifie (0-17)
Le prix est-il ancre correctement ? La decomposition de valeur est-elle convaincante ? Les options de paiement sont-elles strategiques ?

### 4. Garantie solide (0-17)
Les garanties sont-elles concretes, specifiques et inversent-elles reellement le risque pour le prospect ?

### 5. Urgence et rarete (0-16)
Y a-t-il des elements d'urgence authentique (pas des faux countdowns) ? Des elements de rarete credibles ?

### 6. Value Stack (0-16)
L'empilement de valeur est-il impressionnant ? Le ratio valeur percue / prix est-il ecrasant (minimum 10x) ?

## REGLES
- Sois HONNETE : pas de complaisance, le but est d'ameliorer l'offre
- Chaque feedback doit etre ACTIONNABLE (dire quoi ameliorer concretement)
- Genere 3 a 5 recommandations prioritaires
- quality_gate_passed = true si score_total >= 70

## FORMAT JSON
{
  "score_total": 0,
  "criteres": {
    "clarte_promesse": { "score": 0, "feedback": "..." },
    "force_mecanisme": { "score": 0, "feedback": "..." },
    "pricing_justifie": { "score": 0, "feedback": "..." },
    "garantie_solide": { "score": 0, "feedback": "..." },
    "urgence_rarete": { "score": 0, "feedback": "..." },
    "value_stack": { "score": 0, "feedback": "..." }
  },
  "recommandations": ["..."],
  "quality_gate_passed": false
}`;
}
