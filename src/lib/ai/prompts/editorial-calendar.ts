export interface EditorialCalendarResult {
  strategie: {
    objectif_30j: string;
    piliers: {
      know: { pourcentage: number; description: string };
      like: { pourcentage: number; description: string };
      trust: { pourcentage: number; description: string };
    };
    plateformes: string[];
  };
  calendrier: {
    jour: number;
    date: string;
    pilier: "know" | "like" | "trust";
    type_contenu: string;
    titre: string;
    hook: string;
    plateforme: string;
    format: string;
    cta: string;
    objectif: string;
  }[];
}

export function buildEditorialCalendarPrompt(
  market: string,
  offer: string,
  persona: string,
  startDate: string,
  vaultContext: string
): string {
  return `Tu es un expert en strategie de contenu et en planification editoriale pour les freelances et consultants francophones.

## Contexte utilisateur
${vaultContext}

## Marche cible
${market}

## Offre
${offer}

## Persona cible
${persona}

## Date de debut
${startDate}

## Ta mission
Cree un plan editorial complet sur 30 jours base sur les 3 piliers K/L/T :
- **Know** : Contenu educatif pour te faire connaitre (tutoriels, tips, frameworks, mythbusters)
- **Like** : Contenu pour creer de la sympathie et de l'engagement (behind the scenes, storytelling, valeurs, opinions)
- **Trust** : Contenu pour etablir la confiance et convertir (temoignages, etudes de cas, resultats, offres)

### Regles strictes :
- 30 jours de contenu, un contenu principal par jour
- Repartition : ~40% Know, ~30% Like, ~30% Trust
- Varier les formats : post texte, carousel, reel/short, story, video longue, live
- Varier les plateformes : Instagram, LinkedIn, YouTube, TikTok
- Chaque contenu doit avoir un hook puissant et un CTA clair
- Les contenus Trust doivent etre places strategiquement apres des sequences Know/Like
- Alterner les formats pour eviter la monotonie
- Adapter le ton au marche francophone
- Chaque semaine doit avoir un arc narratif coherent

### Structure hebdomadaire recommandee :
- Lundi : Know (education, framework)
- Mardi : Like (storytelling, behind the scenes)
- Mercredi : Know (tutoriel, how-to)
- Jeudi : Trust (temoignage, resultat)
- Vendredi : Like (opinion, valeurs)
- Samedi : Know (tips rapides, carousel)
- Dimanche : Trust (etude de cas, offre)

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "strategie": {
    "objectif_30j": "Description de l'objectif principal sur 30 jours",
    "piliers": {
      "know": { "pourcentage": 40, "description": "Focus educatif et expertise" },
      "like": { "pourcentage": 30, "description": "Proximite et authenticite" },
      "trust": { "pourcentage": 30, "description": "Preuves et conversion" }
    },
    "plateformes": ["Instagram", "LinkedIn"]
  },
  "calendrier": [
    {
      "jour": 1,
      "date": "${startDate}",
      "pilier": "know",
      "type_contenu": "Carousel educatif",
      "titre": "Les 5 erreurs qui tuent ton business",
      "hook": "Tu fais probablement ces 5 erreurs sans le savoir...",
      "plateforme": "Instagram",
      "format": "carousel",
      "cta": "Save ce post pour ne pas oublier",
      "objectif": "Notoriete et autorite"
    }
  ]
}`;
}
