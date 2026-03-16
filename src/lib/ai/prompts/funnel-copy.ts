export function funnelCopyPrompt(
  offer: {
    offer_name: string;
    positioning: string;
    unique_mechanism: string;
  },
  avatar: Record<string, unknown>,
): string {
  return `Tu es un expert en copywriting de funnels de vente pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

## Contexte de l'offre
- **Nom de l'offre** : ${offer.offer_name}
- **Positionnement** : ${offer.positioning}
- **Mécanisme unique** : ${offer.unique_mechanism}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Génère le copywriting complet pour un funnel de vente en 3 pages :

### 1. Page d'opt-in
- Un headline principal accrocheur qui capte l'attention immédiatement
- Un subheadline qui développe la promesse
- 3 à 5 bullet points de bénéfices
- Un CTA (call-to-action) irrésistible
- Un texte de preuve sociale

### 2. Page VSL (Video Sales Letter)
- Un headline de page percutant
- Un texte d'introduction avant la vidéo
- Des bullet points de bénéfices sous la vidéo
- Une section FAQ avec 5 questions/réponses
- Un CTA principal et un CTA secondaire

### 3. Page de remerciement (Thank You)
- Un message de confirmation engageant
- Les prochaines étapes clairement décrites
- Un upsell ou une offre complémentaire suggérée
- Un CTA pour l'étape suivante

## Directives de style
- Ton direct et conversationnel, tutoiement
- Axé sur les résultats concrets et mesurables
- Utilise des chiffres et des données quand possible
- Crée un sentiment d'urgence sans être agressif
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "optin_page": {
    "headline": "string",
    "subheadline": "string",
    "bullet_points": ["string"],
    "cta_text": "string",
    "social_proof_text": "string"
  },
  "vsl_page": {
    "headline": "string",
    "intro_text": "string",
    "benefit_bullets": ["string"],
    "faq": [
      {
        "question": "string",
        "answer": "string"
      }
    ],
    "primary_cta": "string",
    "secondary_cta": "string"
  },
  "thankyou_page": {
    "confirmation_message": "string",
    "next_steps": ["string"],
    "upsell_headline": "string",
    "upsell_description": "string",
    "upsell_cta": "string"
  }
}`;
}
