export function offerCreationPrompt(
  market: {
    name: string;
    problems: string[];
    avatar: Record<string, unknown>;
    positioning: string;
  },
  skills: string[],
): string {
  return `Tu es un expert en creation d'offres irresistibles pour des services d'infrastructure IA. Tu maitrises les principes de ScalingFlow : mecanisme unique, offre no-brainer, inversion du risque, ancrage de prix. Tu integres les frameworks de Dan Kennedy, Alex Hormozi et Russell Brunson.

## MARCHE SELECTIONNE
- Marche : ${market.name}
- Problemes : ${market.problems.join(", ")}
- Avatar : ${JSON.stringify(market.avatar)}
- Positionnement : ${market.positioning}

## COMPETENCES DE L'UTILISATEUR
${skills.join(", ")}

## GENERE UNE OFFRE COMPLETE EN 3 COUCHES

### COUCHE 1 — PACKAGING MARKETING
1. **Nom de l'offre** : accrocheur, memorable
2. **Positionnement** : angle d'attaque unique
3. **Mecanisme unique (Dan Kennedy)** : approche differenciante structuree en 5 elements :
   - problem : le probleme specifique que le prospect vit (douleur aigue)
   - cause : la VRAIE cause que personne ne mentionne (l'insight)
   - solution : comment ton mecanisme resout le probleme (le "comment" unique)
   - evidence : preuves, donnees, cas d'usage qui rendent le mecanisme credible
   - uniqueness : pourquoi SEUL ton mecanisme peut fonctionner (barriere a l'entree)
4. **Strategie de pricing** :
   - Regle du 10% : le prix = 10% du resultat potentiel pour le client
   - Multiplicateur de probabilite : ajuste le prix selon la probabilite d'atteindre le resultat (prix × probabilite%)
   - Plancher obligatoire : le prix ne peut JAMAIS etre inferieur a (CAC + cout de delivery) × 2
   - Ratio minimum : valeur percue / prix >= 3:1 (idealement 10:1)
   - Prix ancre + prix reel + decomposition de valeur
   - Structure hybride recommandee : setup_fee (frais d'installation), performance_fee (% des resultats), monthly_retainer (accompagnement mensuel)
   - Options de paiement (1x, 3x, 6x, 12x)
5. **Garanties (5 elements obligatoires)** :
   - pourcentage_remboursement : le % rembourse (50%, 100%, 200%, etc.)
   - timeframe : delai de la garantie (30j, 60j, 90j, etc.)
   - conditions : conditions claires et mesurables
   - metrique : la metrique exacte qui declenche la garantie (ex: "si vous n'avez pas 10 leads en 30j")
   - clause : clause de protection du prestataire (engagement minimum, acces requis, etc.)
6. **Inversion du risque** : elimination du risque pour le prospect
7. **Offre no-brainer** : element gratuit irresistible
8. **OTO (One Time Offer)** : offre complementaire page de remerciements

### COUCHE 2 — STRUCTURE DE DELIVERY (9 PILIERS BUSINESS)
Recommande le modele de delivery le plus adapte parmi :
- **DFY (Done For You)** : L'expert delivre tout. Prix premium, faible scalabilite.
- **DWY (Done With You)** : L'expert guide, le client execute. Prix moyen, scalabilite moyenne.
- **DIY (Do It Yourself)** : Le client suit un programme/framework. Prix bas, forte scalabilite.

Mappe la livraison sur les 9 piliers business. Pour chaque pilier applicable :
- pillar_name : nom du pilier
- agents_ia : quels agents IA automatisent ce pilier
- personnes : quels roles humains interviennent
- process : quels process sont mis en place
- outils : quels outils et logiciels sont utilises
- automations : quelles automations relient le tout
- kpi : la metrique de succes de ce pilier

Les 9 piliers : Acquisition, Nurturing, Conversion, Onboarding Client, Delivery, Support, Retention, Upsell/Cross-sell, Referral.

### COUCHE 3 — VALUE STACK DETAILLE
Empile la valeur de maniere visuelle et irresistible :
- items : liste de chaque composant de l'offre avec nom, description, valeur percue (en EUR)
- total_value : valeur totale percue
- your_price : prix reel demande
- ratio : ratio valeur/prix (doit etre >= 10x)
- bonuses : 3-5 bonus qui font deborder la valeur

## FORMAT JSON
{
  "packaging": {
    "offer_name": "...",
    "positioning": "...",
    "unique_mechanism": {
      "name": "...",
      "description": "...",
      "steps": ["..."],
      "dan_kennedy": {
        "problem": "...",
        "cause": "...",
        "solution": "...",
        "evidence": "...",
        "uniqueness": "..."
      }
    },
    "pricing": {
      "anchor_price": 0,
      "real_price": 0,
      "resultat_potentiel": 0,
      "probability_multiplier": 0.8,
      "price_floor": 0,
      "price_floor_formula": "(CAC + cout_delivery) × 2",
      "value_breakdown": [{"item": "...", "value": 0}],
      "payment_options": ["..."],
      "hybrid_structure": {
        "setup_fee": 0,
        "performance_fee_percent": 0,
        "monthly_retainer": 0
      },
      "pricing_rule": "10% du resultat potentiel × probabilite"
    },
    "guarantees": [{
      "type": "...",
      "description": "...",
      "duration": "...",
      "pourcentage_remboursement": "...",
      "timeframe": "...",
      "conditions": "...",
      "metrique": "...",
      "clause": "..."
    }],
    "risk_reversal": "...",
    "no_brainer": "...",
    "oto": { "name": "...", "description": "...", "price": 0, "value_proposition": "..." }
  },
  "delivery": {
    "recommended_model": "DFY|DWY|DIY",
    "model_comparison": {
      "dfy": { "inclus": ["..."], "implication_client": "...", "prix_relatif": "...", "scalabilite": "..." },
      "dwy": { "inclus": ["..."], "implication_client": "...", "prix_relatif": "...", "scalabilite": "..." },
      "diy": { "inclus": ["..."], "implication_client": "...", "prix_relatif": "...", "scalabilite": "..." }
    },
    "piliers": [
      {
        "pillar_name": "...",
        "agents_ia": ["..."],
        "personnes": ["..."],
        "process": ["..."],
        "outils": ["..."],
        "automations": ["..."],
        "kpi": "..."
      }
    ]
  },
  "value_stack": {
    "items": [{"name": "...", "description": "...", "value": 0}],
    "total_value": 0,
    "your_price": 0,
    "ratio": "10x",
    "bonuses": [{"name": "...", "description": "...", "value": 0}]
  },
  "full_document_markdown": "..."
}`;
}
