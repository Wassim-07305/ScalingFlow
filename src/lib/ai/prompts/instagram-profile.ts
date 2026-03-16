export interface InstagramProfileResult {
  bio: string;
  nom_affiche: string;
  highlights: { name: string; description: string; icon_suggestion: string }[];
  cta_lien: { texte: string; url_suggestion: string };
  grille_strategy: string;
  bio_alternatives: string[];
}

export function buildInstagramProfilePrompt(
  market: string,
  offer: string,
  brand: string,
): string {
  return `Tu es un expert en optimisation de profils Instagram pour les freelances et consultants.

## Marche cible
${market}

## Offre
${offer}

## Marque / identite
${brand}

## Ta mission
Optimise un profil Instagram complet pour maximiser les conversions et la credibilite.

### Elements a optimiser :

1. **Bio Instagram** (max 150 caracteres) :
   - Ligne 1 : Qui tu es / ce que tu fais
   - Ligne 2 : Pour qui / la transformation promise
   - Ligne 3 : Preuve sociale ou credibilite
   - Ligne 4 : CTA clair

2. **Nom affiche** : Le nom qui apparait sous la photo de profil (max 30 caracteres, inclure des mots-cles)

3. **Highlights** (5-7 categories) : Stories a la une avec nom, description du contenu, et suggestion d'icone

4. **Lien CTA** : Le texte et la suggestion de lien pour le "lien dans la bio"

5. **Strategie de grille** : Comment organiser visuellement le feed (alternance de formats, palette de couleurs, themes recurrents)

6. **Bio alternatives** : 3 versions alternatives de la bio pour A/B tester

### Regles :
- Utiliser des emojis strategiquement
- Inclure des mots-cles pour le SEO Instagram
- Ton professionnel mais accessible
- Adapte au marche francophone

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "bio": "La bio optimisee complete (avec sauts de ligne via \\n)",
  "nom_affiche": "Le nom affiche optimise",
  "highlights": [
    {
      "name": "Resultats",
      "description": "Stories montrant les resultats clients : avant/apres, temoignages video, chiffres cles",
      "icon_suggestion": "Etoile dorée ou fleche vers le haut"
    }
  ],
  "cta_lien": {
    "texte": "Le texte d'appel a l'action pour le lien",
    "url_suggestion": "Suggestion de type de page a lier (calendly, page de vente, etc.)"
  },
  "grille_strategy": "Description detaillee de la strategie visuelle du feed...",
  "bio_alternatives": [
    "Bio alternative 1...",
    "Bio alternative 2...",
    "Bio alternative 3..."
  ]
}`;
}
