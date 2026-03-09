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

## Format de réponse
Réponds UNIQUEMENT en JSON valide :
{
  "delivery_name": "Nom du système de delivery",
  "overview": "Description en 2-3 phrases du système",
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
