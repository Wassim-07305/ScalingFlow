export interface ContentStrategyResult {
  strategie_globale: {
    ratio_klct: { know: number; like: number; trust: number; convert: number };
    frequence_recommandee: string;
    plateformes_prioritaires: string[];
  };
  calendrier: {
    jour: number;
    pilier: "know" | "like" | "trust" | "convert";
    type_contenu: string;
    titre: string;
    hook: string;
    plateforme: string;
    format: string;
  }[];
}

export function buildContentStrategyPrompt(
  market: string,
  offer: string,
  persona: string,
  parcours: string,
): string {
  return `Tu es un expert en strategie de contenu digital pour les freelances et consultants.

## Marche cible
${market}

## Offre
${offer}

## Persona
${persona}

## Parcours client
${parcours}

## Ta mission
Cree une strategie de contenu sur 30 jours basee sur les 4 piliers KLCT :
- **Know** : Contenu educatif pour te faire connaitre (tutoriels, tips, frameworks)
- **Like** : Contenu pour creer de la sympathie (behind the scenes, storytelling, valeurs)
- **Trust** : Contenu pour etablir la confiance (temoignages, etudes de cas, resultats)
- **Convert** : Contenu promotionnel pour convertir (offres, urgence, CTA direct)

### Regles :
- 30 jours de contenu, un contenu par jour
- Repartition equilibree des 4 piliers selon le marche
- Varier les formats (post, carousel, reel, story, video longue)
- Varier les plateformes (Instagram, LinkedIn, YouTube, TikTok)
- Chaque contenu doit avoir un hook puissant
- Les contenus "Convert" doivent etre places strategiquement apres des contenus "Trust"

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "strategie_globale": {
    "ratio_klct": { "know": 35, "like": 25, "trust": 25, "convert": 15 },
    "frequence_recommandee": "1 post/jour + 3 stories/jour",
    "plateformes_prioritaires": ["Instagram", "LinkedIn"]
  },
  "calendrier": [
    {
      "jour": 1,
      "pilier": "know",
      "type_contenu": "Carousel educatif",
      "titre": "Les 5 erreurs qui tuent ton business",
      "hook": "Tu fais probablement ces 5 erreurs sans le savoir...",
      "plateforme": "Instagram",
      "format": "carousel"
    }
  ]
}`;
}
