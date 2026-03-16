export function socialAssetsPrompt(
  offer: {
    offer_name: string;
    positioning?: string;
    unique_mechanism?: string;
  },
  avatar: Record<string, unknown>,
  brandKit?: {
    colors?: string[];
    fonts?: string[];
    tone?: string;
  },
): string {
  return `Tu es un expert en création de visuels et assets pour les réseaux sociaux. Tu maîtrises le design de contenus qui convertissent sur Instagram, Facebook, LinkedIn et YouTube.

## Contexte de l'offre
- **Nom** : ${offer.offer_name}
- **Positionnement** : ${offer.positioning || "Non défini"}
- **Mécanisme unique** : ${offer.unique_mechanism || "Non défini"}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

${
  brandKit
    ? `## Kit de marque
- Couleurs : ${brandKit.colors?.join(", ") || "Non définies"}
- Typographies : ${brandKit.fonts?.join(", ") || "Non définies"}
- Ton : ${brandKit.tone || "Professionnel et percutant"}`
    : ""
}

## Ta mission
Génère un pack complet de social assets prêts à être designés. Chaque asset doit inclure le texte exact, les dimensions recommandées et les instructions de design.

Retourne un JSON avec cette structure exacte :
{
  "testimonial_cards": [
    {
      "title": "Titre de la carte témoignage",
      "quote": "Citation du client (fictive mais réaliste)",
      "client_name": "Prénom N.",
      "client_role": "Rôle / Niche",
      "metric": "Résultat chiffré (ex: +340% de CA en 60 jours)",
      "format": "1080x1080",
      "design_notes": "Instructions de design"
    }
  ],
  "social_banners": [
    {
      "platform": "Instagram / Facebook / LinkedIn / YouTube",
      "type": "Couverture / Post / Story",
      "headline": "Texte principal",
      "subline": "Sous-texte",
      "cta": "Call to action",
      "dimensions": "ex: 1200x628",
      "design_notes": "Instructions de design"
    }
  ],
  "highlight_covers": [
    {
      "name": "Nom du highlight (ex: Résultats, Méthode, FAQ)",
      "icon_description": "Description de l'icône à utiliser",
      "color": "Couleur de fond suggérée"
    }
  ],
  "email_signature": {
    "name": "Nom complet",
    "title": "Titre professionnel",
    "tagline": "Phrase d'accroche",
    "cta_text": "Texte du CTA",
    "cta_url": "URL suggérée"
  },
  "social_proof_badges": [
    {
      "text": "Texte du badge (ex: +500 clients accompagnés)",
      "style": "Style suggéré (minimaliste, bold, etc.)",
      "usage": "Où utiliser ce badge (bio, posts, site, emails)"
    }
  ]
}

Génère 3 cartes témoignage, 5 bannières (une par plateforme/format), 5 highlight covers, 1 signature email et 3 badges de preuve sociale. Tous les textes en français.`;
}
