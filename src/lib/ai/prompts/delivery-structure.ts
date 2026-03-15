export function deliveryStructurePrompt(
  offer: {
    offer_name: string;
    positioning?: string;
    unique_mechanism?: string;
    pricing_strategy?: string;
    delivery_structure?: string;
  },
  avatar: Record<string, unknown>
): string {
  return `Tu es un expert en design de systèmes de delivery et d'opérations pour les freelances et consultants premium.

## Contexte de l'offre
- **Nom** : ${offer.offer_name}
- **Positionnement** : ${offer.positioning || "Non défini"}
- **Mécanisme unique** : ${offer.unique_mechanism || "Non défini"}
- **Pricing** : ${offer.pricing_strategy || "Non défini"}

## Avatar client
${JSON.stringify(avatar, null, 2)}

## Ta mission
Conçois un système de delivery complet qui :
1. Garantit les résultats promis dans l'offre
2. Est scalable (ne dépend pas à 100% du temps de l'expert)
3. Intègre des agents IA et de l'automatisation où possible
4. Crée une expérience client premium

## MODÈLE DE DELIVERY (DFY / DWY / DIY)
Tu DOIS recommander le modèle le plus adapté et détailler comment chacun s'applique :
- **DFY (Done For You)** : L'expert délivre tout. Le client ne fait rien. Prix le plus élevé.
- **DWY (Done With You)** : L'expert guide, le client exécute avec support. Prix moyen.
- **DIY (Do It Yourself)** : Le client suit un framework/programme. Prix le plus bas.

Pour chaque modèle, indique : ce qui est inclus, le niveau d'implication client, le prix relatif, et la scalabilité.

## MAPPING SUR LES 9 PILIERS BUSINESS
Tu DOIS mapper la delivery sur les 9 piliers suivants. Pour chaque pilier :
1. **Acquisition** — Comment les clients sont acquis
2. **Nurturing** — Comment les leads sont nourris
3. **Conversion** — Comment les leads deviennent clients
4. **Onboarding Client** — Comment le client est accueilli
5. **Delivery** — Comment le service est délivré
6. **Support** — Comment le client est supporté
7. **Rétention** — Comment le client est fidélisé
8. **Upsell/Cross-sell** — Comment augmenter le panier moyen
9. **Referral** — Comment générer du bouche-à-oreille

Pour chaque pilier, détaille :
- agents_ia : quels agents IA automatisent ce pilier
- personnes : quels rôles humains interviennent
- process : quels process sont mis en place
- outils : quels outils sont utilisés
- automations : quelles automations relient le tout
- kpi : la métrique de succès du pilier

## Format de réponse
Réponds UNIQUEMENT en JSON valide :
{
  "delivery_name": "Nom du système de delivery",
  "overview": "Description en 2-3 phrases du système",
  "recommended_model": "DFY | DWY | DIY",
  "model_comparison": {
    "dfy": { "inclus": ["..."], "implication_client": "Aucune", "prix_relatif": "Premium", "scalabilite": "Faible" },
    "dwy": { "inclus": ["..."], "implication_client": "Moyenne", "prix_relatif": "Moyen", "scalabilite": "Moyenne" },
    "diy": { "inclus": ["..."], "implication_client": "Forte", "prix_relatif": "Bas", "scalabilite": "Forte" }
  },
  "piliers": [
    {
      "pillar_name": "Acquisition",
      "agents_ia": ["..."],
      "personnes": ["..."],
      "process": ["..."],
      "outils": ["..."],
      "automations": ["..."],
      "kpi": "..."
    }
  ],
  "phases": [
    {
      "name": "Phase 1 : Onboarding Client",
      "duration": "Semaine 1",
      "description": "Ce qui se passe dans cette phase",
      "deliverables": ["Livrable 1", "Livrable 2"],
      "tools": ["Outil/plateforme utilisé"],
      "automation_level": "Manuel | Semi-auto | Full auto",
      "ai_agents": ["Description de l'agent IA utilisé (si applicable)"]
    }
  ],
  "tech_stack": [
    {
      "tool": "Nom de l'outil",
      "purpose": "À quoi il sert",
      "category": "CRM | Automatisation | Communication | IA | Paiement | Analytics"
    }
  ],
  "ai_agents": [
    {
      "name": "Nom de l'agent IA",
      "role": "Ce qu'il fait",
      "trigger": "Quand il se déclenche",
      "output": "Ce qu'il produit"
    }
  ],
  "sops": [
    {
      "name": "Nom du process",
      "frequency": "À chaque client | Hebdomadaire | Mensuel",
      "steps": ["Étape 1", "Étape 2", "Étape 3"],
      "owner": "Expert | Assistant | Agent IA | Client"
    }
  ],
  "kpis": [
    {
      "metric": "Nom de la métrique",
      "target": "Objectif",
      "frequency": "Hebdomadaire | Mensuel"
    }
  ],
  "scalability_score": 75,
  "automation_percentage": 60,
  "bottlenecks": ["Risque ou goulot d'étranglement identifié"],
  "recommendations": ["Recommandation pour améliorer le delivery"]
}`;
}
