export interface GuaranteeContext {
  niche: string;
  offer_name: string;
  price: number;
  duration: string;
  target_avatar: string;
}

export interface GuaranteeResult {
  guarantees: {
    type: string;
    name: string;
    description: string;
    conditions: string;
    metric: string;
    timeframe: string;
    risk_level: string;
    psychological_impact: string;
  }[];
  recommendation: string;
  recommended_index: number;
}

export function guaranteeGeneratorPrompt(ctx: GuaranteeContext): string {
  return `Tu es un expert en création de garanties irrésistibles (style Alex Hormozi / Russell Brunson). Une bonne garantie élimine le risque perçu par le prospect et augmente massivement les conversions.

## CONTEXTE
- Niche : ${ctx.niche}
- Offre : ${ctx.offer_name}
- Prix : ${ctx.price} €
- Durée : ${ctx.duration}
- Avatar cible : ${ctx.target_avatar}

## GÉNÈRE 4 GARANTIES DE TYPES DIFFÉRENTS

### Types obligatoires :
1. **Résultat garanti** — Garantie basée sur un résultat concret et mesurable
2. **Satisfaction** — Garantie de satisfaction totale avec remboursement
3. **Anti-risque** — Garantie qui inverse complètement le risque (plus qu'un remboursement)
4. **Performance** — Garantie conditionnelle liée à des KPIs précis

Pour chaque garantie, fournis :

1. **type** : Le type parmi les 4 ci-dessus
2. **name** : Nom accrocheur de la garantie (ex : "Garantie Résultat ou Remboursé x2", "Garantie Zéro Risque 90 jours")
3. **description** : Description complète de la garantie (2-3 phrases percutantes)
4. **conditions** : Les conditions d'application (ce que le client doit faire pour en bénéficier)
5. **metric** : La métrique ou le critère mesurable de la garantie
6. **timeframe** : La période couverte par la garantie
7. **risk_level** : Niveau de risque pour le vendeur ("faible", "moyen", "élevé")
8. **psychological_impact** : Explication de l'impact psychologique sur le prospect

## FORMAT DE RÉPONSE (JSON)
{
  "guarantees": [
    {
      "type": "résultat garanti",
      "name": "...",
      "description": "...",
      "conditions": "...",
      "metric": "...",
      "timeframe": "...",
      "risk_level": "...",
      "psychological_impact": "..."
    }
  ],
  "recommendation": "Explication de pourquoi la garantie recommandée est la plus adaptée à cette offre et ce marché",
  "recommended_index": 0
}`;
}
