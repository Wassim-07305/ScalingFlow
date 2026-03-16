export interface CarouselResult {
  titre: string;
  hook_cover: string;
  slides: {
    numero: number;
    texte_principal: string;
    texte_secondaire: string;
    design_direction: string;
  }[];
  cta_final: string;
  hashtags: string[];
  caption: string;
}

export function buildCarouselPrompt(
  market: string,
  offer: string,
  topic: string,
): string {
  return `Tu es un expert en creation de carousels Instagram/LinkedIn pour les freelances et consultants.

## Marche cible
${market}

## Offre
${offer}

## Sujet du carousel
${topic}

## Ta mission
Cree un carousel complet de 8 a 10 slides, optimise pour les saves et les partages.

### Structure du carousel :
1. **Slide 1 (Cover)** : Hook ultra-percutant qui donne envie de swiper
2. **Slides 2-8 (Contenu)** : Une idee par slide, progression logique
3. **Slide finale (CTA)** : Appel a l'action clair

### Regles :
- 8 a 10 slides au total
- Texte principal court (max 20 mots par slide)
- Texte secondaire explicatif (max 40 mots)
- Direction design pour chaque slide (couleurs, layout, icones)
- Hook de cover qui cree le "pattern interrupt"
- Progression logique qui incite a swiper
- CTA final avec une action concrete
- Hashtags pertinents (15-20)
- Caption engageante avec question pour les commentaires

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "titre": "Le titre interne du carousel",
  "hook_cover": "Le texte de la premiere slide qui arrete le scroll",
  "slides": [
    {
      "numero": 1,
      "texte_principal": "Le texte principal court et impactant",
      "texte_secondaire": "L'explication ou le detail complementaire",
      "design_direction": "Fond sombre, texte blanc en gras, icone de fleche"
    }
  ],
  "cta_final": "Le texte du call-to-action final",
  "hashtags": ["#business", "#freelance", "#marketing"],
  "caption": "La caption complete du post avec question d'engagement..."
}`;
}
