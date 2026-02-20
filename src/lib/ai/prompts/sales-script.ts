export function salesScriptPrompt(
  offer: Record<string, unknown>,
  avatar: Record<string, unknown>
): string {
  return `Tu es un expert en vente consultative pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

## Contexte de l'offre
${JSON.stringify(offer, null, 2)}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Crée un script complet pour un appel de découverte (discovery call) de 30-45 minutes, conçu pour qualifier le prospect et le convertir en client.

### Structure du script :

**1. Ouverture & Rapport (3 minutes)**
- Comment ouvrir l'appel de manière chaleureuse
- Questions brise-glace
- Établir le cadre de l'appel

**2. Découverte de la situation actuelle (7 minutes)**
- Questions pour comprendre la situation du prospect
- Explorer les résultats actuels
- Identifier les outils et méthodes utilisées

**3. Identification des douleurs (7 minutes)**
- Questions pour creuser les problèmes
- Quantifier l'impact financier des problèmes
- Faire ressentir l'urgence du changement

**4. Vision du futur idéal (5 minutes)**
- Questions pour définir la situation rêvée
- Quantifier les résultats souhaités
- Créer l'écart entre situation actuelle et idéale

**5. Présentation de la solution (8 minutes)**
- Comment introduire l'offre naturellement
- Présenter les composants de l'offre
- Relier chaque composant aux douleurs identifiées

**6. Traitement des objections (5 minutes)**
- Les 5 objections les plus courantes et comment y répondre
- Techniques de reformulation
- Questions de clarification

**7. Close (5 minutes)**
- Récapituler la valeur
- Proposer les prochaines étapes
- Techniques de closing adaptées
- Gérer le "Je dois réfléchir"

### Pour chaque section, fournis :
- Les phrases exactes à dire
- Les questions clés à poser
- Les transitions entre les sections
- Les erreurs à éviter

## Directives de style
- Ton consultif, pas agressif
- Tutoiement naturel
- Écoute active : 70% écoute, 30% parole
- Questions ouvertes principalement
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "sections": [
    {
      "step": 1,
      "name": "Ouverture & Rapport",
      "duration": "3 minutes",
      "script": "Les phrases exactes à dire...",
      "key_questions": ["Question 1", "Question 2"],
      "transition": "Phrase de transition vers la section suivante",
      "mistakes_to_avoid": ["Erreur 1"]
    }
  ]
}`;
}
