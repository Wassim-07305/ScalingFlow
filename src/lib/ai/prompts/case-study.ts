export function caseStudyPrompt(
  offer: {
    offer_name: string;
  },
  result: {
    metric: string;
    value: string;
  }
): string {
  return `Tu es un expert en rédaction de cas d'études et de témoignages pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

## Contexte de l'offre
- **Nom de l'offre** : ${offer.offer_name}

## Résultat obtenu
- **Métrique clé** : ${result.metric}
- **Valeur obtenue** : ${result.value}

## Ta mission
Génère une étude de cas complète et professionnelle qui peut être utilisée sur un site web, dans des présentations commerciales, ou comme contenu marketing.

### Structure de l'étude de cas :

**1. Titre accrocheur**
- Un titre qui met en avant le résultat principal
- Format : "Comment [client type] a [résultat] en [durée] grâce à [méthode]"

**2. Contexte du problème**
- La situation initiale du client
- Les défis spécifiques rencontrés
- Les solutions déjà essayées sans succès
- L'impact financier et opérationnel du problème

**3. La solution mise en place**
- Comment l'offre a été présentée au client
- Les étapes d'implémentation
- Les ajustements spécifiques au cas du client
- Le calendrier de mise en place

**4. Les résultats obtenus**
- Résultats quantitatifs (chiffres, pourcentages, ROI)
- Résultats qualitatifs (satisfaction, gain de temps, peace of mind)
- Timeline des résultats (résultats rapides vs long terme)
- Comparaison avant/après

**5. Témoignage client**
- Un témoignage rédigé à la première personne
- Authentique et émotionnel
- Inclut des détails spécifiques
- Se termine par une recommandation

## Directives de style
- Ton professionnel mais accessible
- Basé sur des données concrètes
- Storytelling engageant
- Crédible et réaliste (pas de promesses exagérées)
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "title": "Comment [client] a obtenu [résultat] en [durée]",
  "problem": {
    "client_profile": "Description du profil client",
    "initial_situation": "Situation de départ",
    "challenges": ["Défi 1", "Défi 2", "Défi 3"],
    "previous_attempts": ["Tentative 1", "Tentative 2"],
    "financial_impact": "Impact financier du problème"
  },
  "solution": {
    "approach": "Comment la solution a été proposée",
    "implementation_steps": ["Étape 1", "Étape 2", "Étape 3"],
    "timeline": "Calendrier de mise en place",
    "customizations": "Ajustements spécifiques"
  },
  "results": {
    "quantitative": [
      {
        "metric": "Nom de la métrique",
        "before": "Valeur avant",
        "after": "Valeur après",
        "improvement": "Amélioration en %"
      }
    ],
    "qualitative": ["Résultat qualitatif 1", "Résultat qualitatif 2"],
    "roi": "Retour sur investissement estimé",
    "timeline_to_results": "Temps pour obtenir les premiers résultats"
  },
  "testimonial": {
    "quote": "Le témoignage complet du client à la première personne...",
    "client_name_placeholder": "{{prenom}} {{nom}}",
    "client_title_placeholder": "{{titre}}, {{entreprise}}",
    "rating": 5
  }
}`;
}
