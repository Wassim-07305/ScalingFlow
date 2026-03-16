export interface VideoAdScriptResult {
  scripts: {
    duree: "15s" | "30s" | "60s";
    hook: string;
    corps: string;
    cta: string;
    visual_notes: string;
    angle: string;
  }[];
}

export function buildVideoAdScriptPrompt(
  offer: string,
  avatar: string,
): string {
  return `Tu es un expert en publicite video (Meta Ads, YouTube Ads, TikTok Ads) pour les freelances et consultants.

## Offre
${offer}

## Avatar cible
${avatar}

## Ta mission
Cree 3 scripts de publicite video, un pour chaque duree (15s, 30s, 60s). Chaque script doit etre optimise pour sa plateforme et sa duree.

### Structure par duree :

**15 secondes (TikTok/Reels Ads)** :
- Hook (0-3s) : Pattern interrupt immediat
- Valeur (3-10s) : Le message principal en une phrase
- CTA (10-15s) : Action immediate

**30 secondes (Meta Ads)** :
- Hook (0-5s) : Accroche emotionnelle
- Probleme (5-15s) : Identifier la douleur
- Solution (15-25s) : Presenter la transformation
- CTA (25-30s) : Urgence + action

**60 secondes (YouTube Ads)** :
- Hook (0-5s) : Question ou stat choc
- Contexte (5-15s) : Situer le probleme
- Solution (15-35s) : Presenter l'offre et les benefices
- Preuves (35-50s) : Resultats et temoignages
- CTA (50-60s) : Offre irresistible + CTA

### Regles :
- Ton direct et personnel, tutoiement
- Notes visuelles detaillees pour le montage
- Angles differents pour chaque duree
- Adapte au marche francophone

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "scripts": [
    {
      "duree": "15s",
      "hook": "Le texte du hook (3 premieres secondes)...",
      "corps": "Le script complet avec indications visuelles entre crochets [gros plan], [texte a l'ecran]...",
      "cta": "Le call-to-action final",
      "visual_notes": "Notes detaillees pour le montage video : transitions, musique, texte overlay...",
      "angle": "Pattern interrupt - question choc"
    }
  ]
}`;
}
