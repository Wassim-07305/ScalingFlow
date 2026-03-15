export interface ObjectionContext {
  niche: string;
  offer: string;
  persona: string;
  objections: { text: string; frequency: number }[];
}

export interface ObjectionContentPiece {
  objection: string;
  frequency: number;
  reel: {
    hook: string;
    script: string;
    cta: string;
    hashtags: string[];
    duree_estimee: string;
  };
  carousel: {
    hook_cover: string;
    slides: { numero: number; texte_principal: string; texte_secondaire: string }[];
    cta_final: string;
    caption: string;
    hashtags: string[];
  };
}

export interface ObjectionContentResult {
  total_objections: number;
  contenus: ObjectionContentPiece[];
}

export function objectionToContentPrompt(context: ObjectionContext): string {
  const objectionsList = context.objections
    .map((o, i) => `${i + 1}. "${o.text}" (fréquence : ${o.frequency}/10)`)
    .join("\n");

  return `Tu es un expert en content marketing et en traitement des objections de vente pour les entrepreneurs francophones.

## CONTEXTE BUSINESS
- Niche : ${context.niche}
- Offre : ${context.offer}
- Persona cible : ${context.persona}

## OBJECTIONS DE VENTE À TRANSFORMER EN CONTENU
${objectionsList}

## TA MISSION
Pour CHAQUE objection de vente, génère :

### 1. Un script Reel (30-60 secondes)
- Hook percutant qui capte l'attention en adressant l'objection
- Script complet avec instructions de tournage
- CTA qui pousse à l'action
- L'objectif : casser l'objection de manière subtile et éducative, PAS en vendant directement

### 2. Un outline de carousel (8-10 slides)
- Cover avec un hook irrésistible lié à l'objection
- Slides qui déconstruisent l'objection avec des preuves, des exemples concrets, des chiffres
- CTA final
- Caption engageante

## STRATÉGIES DE TRAITEMENT DES OBJECTIONS
- **Objection prix** → Montrer le coût de l'inaction, comparer avec d'autres investissements
- **Objection temps** → Montrer que NE PAS agir coûte plus de temps, donner des raccourcis
- **Objection confiance** → Preuves sociales, études de cas, démonstrations gratuites
- **Objection besoin** → Révéler le problème caché, éduquer sur les conséquences
- **Objection « je peux le faire seul »** → Montrer la courbe d'apprentissage, les erreurs coûteuses

## FORMAT DE RÉPONSE
Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "total_objections": ${context.objections.length},
  "contenus": [
    {
      "objection": "L'objection originale",
      "frequency": 8,
      "reel": {
        "hook": "Le hook du Reel",
        "script": "Le script complet avec instructions...",
        "cta": "L'appel à l'action",
        "hashtags": ["#hashtag1", "#hashtag2"],
        "duree_estimee": "45 secondes"
      },
      "carousel": {
        "hook_cover": "Le titre de la cover slide",
        "slides": [
          { "numero": 1, "texte_principal": "Titre de la slide", "texte_secondaire": "Contenu détaillé" }
        ],
        "cta_final": "Le CTA de la dernière slide",
        "caption": "La caption Instagram complète",
        "hashtags": ["#hashtag1", "#hashtag2"]
      }
    }
  ]
}`;
}
