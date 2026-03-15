export type MassiveAdBatch =
  | "cold_audience"
  | "warm_audience"
  | "hot_audience"
  | "hooks_controverses"
  | "storytelling";

export const MASSIVE_BATCHES: { key: MassiveAdBatch; label: string; description: string }[] = [
  { key: "cold_audience", label: "Cold Audience (Intérêt)", description: "15 variations pour audience froide — ciblage par centres d'intérêt" },
  { key: "warm_audience", label: "Warm Audience (Engagers)", description: "15 variations pour audience tiède — personnes ayant déjà interagi" },
  { key: "hot_audience", label: "Hot Audience (Opt-ins)", description: "15 variations pour audience chaude — leads et opt-ins existants" },
  { key: "hooks_controverses", label: "Hooks Controversés", description: "15 variations avec des hooks provocants et pattern interrupt" },
  { key: "storytelling", label: "Storytelling", description: "15 variations narratives avec des histoires engageantes" },
];

function buildOfferContext(offer: {
  offer_name: string;
  positioning: string;
  unique_mechanism: string;
  pricing: { real_price: number };
}, avatar: Record<string, unknown>): string {
  return `## Contexte de l'offre
- **Nom de l'offre** : ${offer.offer_name}
- **Positionnement** : ${offer.positioning}
- **Mécanisme unique** : ${offer.unique_mechanism}
- **Prix** : ${offer.pricing.real_price}€

## Avatar cible
${JSON.stringify(avatar, null, 2)}`;
}

const STYLE_DIRECTIVES = `## Directives de style
- Ton conversationnel et direct, tutoiement
- Phrases courtes, une idée par ligne
- Utilise des emojis stratégiquement (pas trop)
- Commence par une accroche qui arrête le scroll
- Inclus des chiffres concrets quand possible
- Termine toujours par un CTA clair
- Adapté au marché francophone (freelances/consultants IA)`;

const JSON_FORMAT = `## Format de réponse
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

${buildOfferContext(offer, avatar)}

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

${STYLE_DIRECTIVES}

${JSON_FORMAT}`;
}

/**
 * Prompt pour génération massive — un batch de 15 variations par catégorie
 */
export function adCopyMassivePrompt(
  offer: {
    offer_name: string;
    positioning: string;
    unique_mechanism: string;
    pricing: { real_price: number };
  },
  avatar: Record<string, unknown>,
  batch: MassiveAdBatch
): string {
  const batchInstructions: Record<MassiveAdBatch, string> = {
    cold_audience: `## Ta mission — COLD AUDIENCE (ciblage par intérêts)
Crée 15 variations de publicité pour une AUDIENCE FROIDE — des personnes qui ne connaissent pas encore la marque.
Ces pubs seront diffusées en ciblage large ou par centres d'intérêt.

### Angles à couvrir (3 variations par angle) :
1. **Problème/Douleur** — Identifie le problème brûlant que le prospect ne peut plus ignorer
2. **Opportunité manquée** — Ce qu'il perd en ne passant pas à l'action
3. **Éducation rapide** — Apporte une valeur immédiate (tip, stat, insight)
4. **Pattern interrupt** — Phrase choc qui casse le scroll
5. **Question rhétorique** — Provoque la réflexion et l'identification`,

    warm_audience: `## Ta mission — WARM AUDIENCE (engagers)
Crée 15 variations de publicité pour une AUDIENCE TIÈDE — des personnes qui ont déjà interagi (likes, commentaires, vues de vidéos).
Ces pubs renforcent la confiance et poussent vers l'action.

### Angles à couvrir (3 variations par angle) :
1. **Résultats clients** — Témoignages et transformations concrètes
2. **Behind the scenes** — Montrer les coulisses et l'authenticité
3. **Objection killer** — Adresser les doutes et hésitations courantes
4. **Valeur gratuite** — Offrir un contenu premium gratuitement (lead magnet)
5. **Urgence douce** — Créer un sentiment d'opportunité limitée sans pression`,

    hot_audience: `## Ta mission — HOT AUDIENCE (opt-ins, leads existants)
Crée 15 variations de publicité pour une AUDIENCE CHAUDE — des personnes qui ont déjà donné leur email ou réservé un appel.
Ces pubs convertissent en clients.

### Angles à couvrir (3 variations par angle) :
1. **Rappel de valeur** — Rappeler pourquoi ils se sont inscrits
2. **Preuve sociale intense** — Résultats chiffrés et cas concrets
3. **Offre irrésistible** — Mettre en avant la garantie et le risk reversal
4. **Dernier appel** — Urgence temporelle réelle (places limitées, prix qui change)
5. **Transformation promise** — Peindre le futur idéal après l'achat`,

    hooks_controverses: `## Ta mission — HOOKS CONTROVERSÉS
Crée 15 variations de publicité avec des hooks PROVOCANTS et controversés qui créent le débat.
L'objectif est de maximiser les commentaires, partages et le temps d'attention.

### Types de hooks à couvrir (3 variations par type) :
1. **Opinion impopulaire** — "La plupart des coachs vous mentent sur..."
2. **Mythe détruit** — "On vous a dit que X, c'est faux. Voici pourquoi..."
3. **Confession** — "J'ai perdu X€ avant de comprendre que..."
4. **Prédiction choc** — "Dans 6 mois, 80% des freelances qui ne font pas X..."
5. **Comparaison brutale** — "Tu fais encore X alors que les top performers font Y"`,

    storytelling: `## Ta mission — STORYTELLING
Crée 15 variations de publicité sous forme d'HISTOIRES engageantes.
Les histoires créent de l'émotion et de la connexion — elles sont les pubs les plus performantes.

### Types d'histoires à couvrir (3 variations par type) :
1. **L'échec transformé** — Raconter un échec qui a mené à la méthode actuelle
2. **Le client héros** — Histoire de transformation d'un client réel
3. **Le déclic** — Le moment exact où tout a changé
4. **Le parcours** — De X€ à Y€, les étapes clés du chemin
5. **La leçon cachée** — Une expérience du quotidien qui cache une leçon business`,
  };

  return `Tu es un expert en publicité digitale (Meta Ads, Google Ads) pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

${buildOfferContext(offer, avatar)}

${batchInstructions[batch]}

### Pour chaque variation, fournis :
- **Hook** : La première ligne qui arrête le scroll (max 125 caractères)
- **Body** : Le texte principal de la pub (150-300 mots)
- **Headline** : Le titre sous l'image/vidéo (max 40 caractères)
- **CTA** : Le texte du bouton d'appel à l'action
- **Angle** : L'angle utilisé (précis et descriptif)
- **Target audience** : Description de l'audience cible pour le ciblage

${STYLE_DIRECTIVES}

${JSON_FORMAT}`;
}
