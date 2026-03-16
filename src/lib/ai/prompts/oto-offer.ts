export function otoOfferPrompt(
  offer: {
    offer_name: string;
    positioning?: string;
    unique_mechanism?: string;
    pricing_strategy?: string;
  },
  avatar: Record<string, unknown>,
): string {
  return `Tu es un expert en création d'offres OTO (One-Time Offer) post-achat pour maximiser la valeur client.

## Contexte de l'offre principale
- **Nom** : ${offer.offer_name}
- **Positionnement** : ${offer.positioning || "Non défini"}
- **Mécanisme unique** : ${offer.unique_mechanism || "Non défini"}
- **Pricing** : ${offer.pricing_strategy || "Non défini"}

## Avatar client
${JSON.stringify(avatar, null, 2)}

## Ta mission
Crée une offre OTO irrésistible qui se présente juste après l'achat de l'offre principale. L'OTO doit :
1. Compléter naturellement l'offre principale
2. Accélérer les résultats du client
3. Avoir un prix inférieur à l'offre principale (30-50% du prix)
4. Créer un sentiment d'urgence (disponible uniquement maintenant)

## Format de réponse
Réponds UNIQUEMENT en JSON valide :
{
  "oto_name": "Nom de l'offre OTO",
  "headline": "Titre accrocheur de la page OTO",
  "subheadline": "Sous-titre explicatif",
  "hook": "Phrase d'accroche post-achat (ex: 'Attends ! Avant de partir...')",
  "problem_without_oto": "Pourquoi l'offre principale seule ne suffit pas toujours",
  "oto_description": "Description détaillée de ce que contient l'OTO",
  "benefits": [
    {
      "title": "Bénéfice 1",
      "description": "Explication du bénéfice"
    }
  ],
  "value_stack": [
    {
      "item": "Élément inclus",
      "value": "Valeur perçue en €"
    }
  ],
  "total_value": "Valeur totale perçue",
  "oto_price": "Prix de l'OTO",
  "discount_percentage": "Pourcentage de réduction vs valeur",
  "urgency_elements": [
    "Élément d'urgence 1 (ex: 'Disponible uniquement maintenant')",
    "Élément d'urgence 2"
  ],
  "cta_text": "Texte du bouton d'action",
  "decline_text": "Texte du lien de refus (ex: 'Non merci, je préfère avancer seul')",
  "page_copy": {
    "opening": "Paragraphe d'ouverture de la page OTO",
    "body": "Corps de texte persuasif",
    "closing": "Paragraphe de clôture avant le CTA"
  },
  "guarantee": "Garantie spécifique à l'OTO"
}`;
}
