export function offerCreationPrompt(market: {
  name: string;
  problems: string[];
  avatar: Record<string, unknown>;
  positioning: string;
}, skills: string[]): string {
  return `Tu es un expert en création d'offres irrésistibles pour des services d'infrastructure IA. Tu maîtrises les principes de ScalingFlow : mécanisme unique, offre no-brainer, inversion du risque, ancrage de prix.

## MARCHÉ SÉLECTIONNÉ
- Marché : ${market.name}
- Problèmes : ${market.problems.join(", ")}
- Avatar : ${JSON.stringify(market.avatar)}
- Positionnement : ${market.positioning}

## COMPÉTENCES DE L'UTILISATEUR
${skills.join(", ")}

## GÉNÈRE UNE OFFRE COMPLÈTE EN 2 COUCHES

### COUCHE 1 — PACKAGING MARKETING
1. **Nom de l'offre** : accrocheur, mémorable
2. **Positionnement** : angle d'attaque unique
3. **Mécanisme unique** : approche différenciante (ex: "Le Système X en 3 Phases")
4. **Stratégie de pricing** : prix ancre, prix réel, décomposition valeur, options paiement
5. **Garanties** : minimum 2 garanties concrètes
6. **Inversion du risque** : élimination du risque pour le prospect
7. **Offre no-brainer** : élément gratuit irrésistible
8. **OTO (One Time Offer)** : offre complémentaire page de remerciements

### COUCHE 2 — STRUCTURE DE DELIVERY
Pour chaque problématique business : quels agents IA, personnes, process, outils, automations

## FORMAT JSON
{
  "packaging": {
    "offer_name": "...",
    "positioning": "...",
    "unique_mechanism": { "name": "...", "description": "...", "steps": ["..."] },
    "pricing": { "anchor_price": 0, "real_price": 0, "value_breakdown": [{"item": "...", "value": 0}], "payment_options": ["..."] },
    "guarantees": [{"type": "...", "description": "...", "duration": "..."}],
    "risk_reversal": "...",
    "no_brainer": "...",
    "oto": { "name": "...", "description": "...", "price": 0, "value_proposition": "..." }
  },
  "delivery": {
    "problematiques": [
      { "name": "...", "agents_ia": ["..."], "personnes": ["..."], "process": ["..."], "outils": ["..."], "automations": ["..."] }
    ]
  },
  "full_document_markdown": "..."
}`;
}
