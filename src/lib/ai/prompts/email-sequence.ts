export function emailSequencePrompt(
  offer: {
    offer_name: string;
    unique_mechanism: string;
  },
  avatar: Record<string, unknown>,
): string {
  return `Tu es un expert en email marketing et en séquences de nurturing pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

## Contexte de l'offre
- **Nom de l'offre** : ${offer.offer_name}
- **Mécanisme unique** : ${offer.unique_mechanism}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Crée une séquence de 7 emails post-opt-in conçue pour convertir les leads en clients. Chaque email doit être rédigé intégralement, prêt à être envoyé.

### Structure de la séquence :

**Email 1 — Bienvenue & Livraison (J+0)**
- Délivre le lead magnet promis
- Présente-toi brièvement
- Crée de l'anticipation pour la suite

**Email 2 — Histoire & Problème (J+1)**
- Raconte une histoire qui résonne avec l'avatar
- Identifie le problème principal
- Crée de l'empathie

**Email 3 — Erreur commune (J+2)**
- Révèle une erreur que la plupart des gens font
- Explique pourquoi ça ne marche pas
- Teaser la solution

**Email 4 — Mécanisme unique (J+3)**
- Présente le mécanisme unique de l'offre
- Explique pourquoi c'est différent
- Montre des résultats

**Email 5 — Preuve sociale (J+4)**
- Partage un cas concret / témoignage
- Montre la transformation avant/après
- Renforce la crédibilité

**Email 6 — Objections (J+5)**
- Anticipe et répond aux objections principales
- Réduis les frictions à l'achat
- Ajoute des garanties

**Email 7 — Urgence & CTA final (J+6)**
- Crée un sentiment d'urgence
- Récapitule la valeur de l'offre
- Appel à l'action direct et clair

## Directives de style
- Ton personnel et conversationnel, tutoiement
- Sujets d'email courts et intrigants (max 50 caractères)
- Un seul CTA par email
- Emails de 200-400 mots maximum
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "sequence_name": "Nom de la séquence",
  "emails": [
    {
      "day": 0,
      "subject": "Objet de l'email",
      "preview_text": "Texte de prévisualisation",
      "body": "Corps complet de l'email en texte...",
      "cta_text": "Texte du bouton CTA",
      "cta_url_placeholder": "URL cible du CTA",
      "purpose": "Objectif de cet email"
    }
  ]
}`;
}
