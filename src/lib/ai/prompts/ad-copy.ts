export function adCopyPrompt(
  offer: {
    offer_name: string;
    positioning: string;
    unique_mechanism: string;
    pricing: {
      real_price: number;
    };
  },
  avatar: Record<string, unknown>
): string {
  return `Tu es un expert en publicité digitale (Meta Ads, Google Ads) pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

## Contexte de l'offre
- **Nom de l'offre** : ${offer.offer_name}
- **Positionnement** : ${offer.positioning}
- **Mécanisme unique** : ${offer.unique_mechanism}
- **Prix** : ${offer.pricing.real_price}€

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Crée 5 variations de publicité complètes, chacune avec un angle différent. Chaque variation doit être prête à être mise en ligne sur Meta Ads ou Google Ads.

### Les 5 angles à couvrir :

1. **Angle Douleur** — Met en avant le problème principal et la frustration
2. **Angle Résultat** — Focus sur les résultats concrets et mesurables obtenus
3. **Angle Curiosité** — Utilise le pattern interrupt pour créer de l'intrigue
4. **Angle Preuve sociale** — S'appuie sur des témoignages et résultats clients
5. **Angle Contraste** — Compare l'avant/après ou l'ancienne vs nouvelle méthode

### Pour chaque variation, fournis :
- **Hook** : La première ligne qui arrête le scroll (max 125 caractères)
- **Body** : Le texte principal de la pub (150-300 mots)
- **Headline** : Le titre sous l'image/vidéo (max 40 caractères)
- **CTA** : Le texte du bouton d'appel à l'action
- **Angle** : L'angle utilisé
- **Target audience** : Description de l'audience cible pour le ciblage

## Directives de style
- Ton conversationnel et direct, tutoiement
- Phrases courtes, une idée par ligne
- Utilise des emojis stratégiquement (pas trop)
- Commence par une accroche qui arrête le scroll
- Inclus des chiffres concrets quand possible
- Termine toujours par un CTA clair
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "variations": [
    {
      "variation_number": 1,
      "hook": "La première ligne accrocheuse...",
      "body": "Le texte complet de la publicité...",
      "headline": "Titre court et percutant",
      "cta": "Texte du bouton CTA",
      "angle": "Douleur",
      "target_audience": "Description de l'audience cible pour cette variation"
    }
  ]
}`;
}
