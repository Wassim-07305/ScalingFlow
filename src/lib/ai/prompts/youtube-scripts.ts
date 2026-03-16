export interface YouTubeScriptResult {
  titre: string;
  hook: string;
  plan: { section: string; duree: string; contenu: string }[];
  script_complet: string;
  thumbnail_concept: string;
  description_youtube: string;
  tags: string[];
}

export function buildYouTubeScriptPrompt(
  market: string,
  offer: string,
  topic: string,
): string {
  return `Tu es un expert en creation de contenu YouTube pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

## Marche cible
${market}

## Offre
${offer}

## Sujet de la video
${topic}

## Ta mission
Cree un script YouTube complet, optimise pour la retention et la conversion. La video doit eduquer tout en vendant subtilement l'expertise.

### Structure obligatoire :
1. **Hook** (0-30s) : Accroche puissante qui donne envie de rester
2. **Probleme** (30s-2min) : Identifier le probleme du viewer
3. **Contenu principal** (2-12min) : La valeur, les etapes, le framework
4. **Preuve** (12-14min) : Resultats, temoignages, exemples concrets
5. **CTA** (14-15min) : Appel a l'action vers l'offre

### Regles :
- Duree cible : 12-15 minutes
- Ton conversationnel, tutoiement
- Inclure des "pattern interrupts" toutes les 2-3 minutes
- Chaque section avec duree estimee
- Script complet mot a mot
- Concept de thumbnail clickable
- Description YouTube avec timestamps et liens
- Tags SEO optimises

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "titre": "Comment [resultat] en [temps] sans [obstacle]",
  "hook": "Le texte complet du hook d'ouverture (30 premieres secondes)...",
  "plan": [
    {
      "section": "Hook & Introduction",
      "duree": "0:00 - 0:30",
      "contenu": "Resume du contenu de cette section avec les points cles a aborder"
    }
  ],
  "script_complet": "Le script mot a mot complet de la video...",
  "thumbnail_concept": "Description detaillee du concept de thumbnail : texte, couleurs, expression, elements visuels",
  "description_youtube": "La description complete avec timestamps, liens et mots-cles",
  "tags": ["tag1", "tag2", "tag3"]
}`;
}
