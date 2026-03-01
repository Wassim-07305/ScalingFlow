export interface StoriesResult {
  stories: {
    type: "behind_the_scenes" | "temoignage" | "education" | "cta" | "engagement";
    slides: { text: string; visual_direction: string }[];
    sticker_suggestions: string[];
  }[];
}

export function buildStoriesPrompt(
  market: string,
  offer: string
): string {
  return `Tu es un expert en creation de Stories Instagram pour les freelances et consultants.

## Marche cible
${market}

## Offre
${offer}

## Ta mission
Cree 5 series de Stories Instagram, une pour chaque type. Chaque serie doit etre prete a etre publiee.

### Les 5 types de Stories :

1. **Behind the scenes** : Montre les coulisses de ton activite (journee type, espace de travail, processus de creation)
2. **Temoignage** : Partage un resultat client ou une transformation (avant/apres, chiffres, citations)
3. **Education** : Enseigne quelque chose de valeur en 3-5 slides (tip, framework, methode)
4. **CTA** : Pousse vers une action specifique (inscription, lien, offre limitee)
5. **Engagement** : Cree de l'interaction (sondage, quiz, question, "ceci ou cela")

### Regles pour chaque serie :
- 3 a 6 slides par serie
- Texte court et percutant (lisible en 5 secondes par slide)
- Direction visuelle pour chaque slide (type de contenu visuel a utiliser)
- Suggestions de stickers Instagram pertinents (sondage, quiz, question, compte a rebours, etc.)
- Ton authentique et personnel

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "stories": [
    {
      "type": "behind_the_scenes",
      "slides": [
        {
          "text": "Le texte affiche sur la story",
          "visual_direction": "Selfie video devant l'ordinateur, ambiance decontractee"
        }
      ],
      "sticker_suggestions": ["sondage: Tu preferes bosser le matin ou le soir ?", "question: Quel est ton outil prefere ?"]
    }
  ]
}`;
}
