export function smsSequencePrompt(
  offer: {
    offer_name: string;
  },
  avatar: Record<string, unknown>,
): string {
  return `Tu es un expert en marketing SMS pour les freelances et consultants dans le domaine de l'IA et de l'automatisation.

## Contexte de l'offre
- **Nom de l'offre** : ${offer.offer_name}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Crée une séquence de 5 SMS de suivi post-inscription, conçue pour maximiser les taux de conversion. Chaque SMS doit être court, percutant et inciter à l'action.

### Structure de la séquence :

**SMS 1 — Confirmation immédiate (J+0, H+0)**
- Confirme l'inscription
- Rappelle ce qu'ils vont recevoir
- Crée de l'anticipation

**SMS 2 — Rappel de valeur (J+0, H+4)**
- Rappelle le bénéfice principal
- Encourage à regarder/lire le contenu envoyé
- Lien direct vers la ressource

**SMS 3 — Preuve sociale (J+1)**
- Partage un résultat concret
- Crée de la curiosité
- Redirige vers une page de vente

**SMS 4 — Objection killer (J+2)**
- Anticipe la principale objection
- Répond de manière concise
- CTA vers l'offre

**SMS 5 — Dernière chance (J+3)**
- Crée un sentiment d'urgence
- Récapitule la promesse en une phrase
- CTA final clair

## Directives de style
- Maximum 160 caractères par SMS quand possible (sinon 320 max)
- Ton direct et amical, tutoiement
- Un seul lien par SMS
- Utilise des emojis avec parcimonie (1-2 max par SMS)
- Pas de spam words (gratuit, offre limitée, etc. — sauf SMS 5)
- Adapté au marché francophone

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "messages": [
    {
      "sms_number": 1,
      "delay": "J+0, H+0",
      "body": "Texte complet du SMS...",
      "character_count": 142,
      "cta_url_placeholder": "{{lien_ressource}}",
      "purpose": "Confirmation et anticipation"
    }
  ]
}`;
}
