export interface ReelsScriptsResult {
  scripts: {
    numero: number;
    hook: string;
    corps: string;
    cta: string;
    hashtags: string[];
    duree_estimee: string;
    angle: string;
    pilier: "know" | "like" | "trust" | "convert";
  }[];
}

export function buildReelsScriptsPrompt(
  market: string,
  offer: string,
  persona: string,
  batchNumber: number,
): string {
  return `Tu es un expert en creation de contenu video court (Reels Instagram, TikTok, YouTube Shorts) pour les freelances et consultants.

## Marche cible
${market}

## Offre
${offer}

## Persona
${persona}

## Batch numero ${batchNumber}

## Ta mission
Genere 12 scripts de Reels/videos courtes optimises pour l'engagement et la conversion. Chaque script doit etre pret a tourner.

### Regles :
- 12 scripts par batch, numerotes de ${(batchNumber - 1) * 12 + 1} a ${batchNumber * 12}
- Mix des 4 piliers KLCT (Know, Like, Trust, Convert)
- Hooks percutants dans les 3 premieres secondes
- Duree entre 15s et 90s selon le contenu
- Varier les angles : educatif, storytelling, controversé, resultat, tutoriel
- Format adapte au scroll vertical
- CTA clair a la fin de chaque script
- Hashtags pertinents (5-8 par script)

### Angles a couvrir :
- 3 scripts educatifs (tutoriels, tips rapides)
- 3 scripts storytelling (experience personnelle, behind the scenes)
- 2 scripts resultats (avant/apres, preuves sociales)
- 2 scripts controverses (opinions fortes, mythes)
- 2 scripts promotionnels (offre, transformation promise)

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "scripts": [
    {
      "numero": ${(batchNumber - 1) * 12 + 1},
      "hook": "Arrete de faire cette erreur en prospection...",
      "corps": "Le script complet du reel, phrase par phrase, avec les indications de timing et de visuel entre parentheses. (Gros plan visage) Phrase 1... (Transition) Phrase 2...",
      "cta": "Abonne-toi pour plus de tips comme celui-ci",
      "hashtags": ["#business", "#freelance", "#ia"],
      "duree_estimee": "30s",
      "angle": "Educatif - tip rapide",
      "pilier": "know"
    }
  ]
}`;
}
