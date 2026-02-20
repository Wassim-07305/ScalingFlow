export function contentIdeasPrompt(
  market: string,
  platform: string
): string {
  return `Tu es un expert en stratégie de contenu pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

## Marché cible
${market}

## Plateforme
${platform}

## Ta mission
Génère 10 idées de contenu optimisées pour la plateforme ${platform}, conçues pour attirer et convertir des prospects dans le marché ciblé.

### Pour chaque idée, fournis :
- **Titre/Hook** : Le titre ou l'accroche du contenu
- **Format** : Le format idéal (carousel, vidéo courte, post texte, article, thread, etc.)
- **Angle** : L'angle éditorial (éducatif, inspirant, controversé, tutoriel, storytelling)
- **Outline** : Un plan en 3-5 points du contenu
- **CTA** : L'appel à l'action à la fin du contenu
- **Objectif** : Ce que ce contenu doit accomplir (notoriété, engagement, conversion, autorité)

### Mix de contenu recommandé :
- 3 contenus éducatifs (tutoriels, how-to, frameworks)
- 2 contenus inspirants (résultats, transformations, études de cas)
- 2 contenus controversés (opinions fortes, mythes à déconstruire)
- 2 contenus storytelling (parcours, échecs, leçons apprises)
- 1 contenu promotionnel direct (offre, lancement, témoignage)

## Directives de style
- Adapté aux codes de la plateforme ${platform}
- Ton authentique et personnel
- Favorise le contenu actionnable (que l'audience peut appliquer immédiatement)
- Optimisé pour l'algorithme de ${platform} (engagement, partages, saves)
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "ideas": [
    {
      "idea_number": 1,
      "title": "Le titre ou hook du contenu",
      "format": "Carousel",
      "angle": "Éducatif",
      "outline": [
        "Point 1 du plan",
        "Point 2 du plan",
        "Point 3 du plan"
      ],
      "cta": "L'appel à l'action",
      "objective": "Notoriété et autorité",
      "estimated_engagement": "Haut — sujet tendance qui génère des saves"
    }
  ]
}`;
}
