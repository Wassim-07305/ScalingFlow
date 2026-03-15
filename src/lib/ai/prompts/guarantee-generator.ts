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
    pourcentage_remboursement: string;
    timeframe: string;
    conditions: string;
    metrique: string;
    clause_protection: string;
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

Pour chaque garantie, fournis les **5 éléments CDC obligatoires** + métadonnées :

### 5 éléments obligatoires (CDC) :
1. **pourcentage_remboursement** : Le % remboursé si la garantie est déclenchée (ex: "100%", "200%", "50%")
2. **timeframe** : Délai de la garantie (ex: "30 jours", "60 jours", "90 jours")
3. **conditions** : Conditions claires et mesurables que le client doit respecter pour bénéficier de la garantie
4. **metrique** : La métrique EXACTE qui déclenche la garantie (ex: "Si vous n'avez pas 10 leads qualifiés en 30 jours")
5. **clause_protection** : Clause de protection du prestataire — engagement minimum du client, accès requis, actions obligatoires, délai de réclamation (ex: "Le client doit avoir suivi 100% des modules, répondu à tous les feedbacks, et donné accès admin au compte Meta Ads")

### Métadonnées additionnelles :
6. **type** : Le type parmi les 4 ci-dessus
7. **name** : Nom accrocheur de la garantie
8. **description** : Description complète (2-3 phrases percutantes)
9. **risk_level** : Niveau de risque pour le vendeur ("faible", "moyen", "élevé")
10. **psychological_impact** : Impact psychologique sur le prospect

## FORMAT DE RÉPONSE (JSON)
{
  "guarantees": [
    {
      "type": "résultat garanti",
      "name": "...",
      "description": "...",
      "pourcentage_remboursement": "100%",
      "timeframe": "90 jours",
      "conditions": "...",
      "metrique": "...",
      "clause_protection": "...",
      "risk_level": "...",
      "psychological_impact": "..."
    }
  ],
  "recommendation": "Explication de pourquoi la garantie recommandée est la plus adaptée à cette offre et ce marché",
  "recommended_index": 0
}`;
}
