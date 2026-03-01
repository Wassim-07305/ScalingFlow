export interface DMScriptsResult {
  prospection: {
    opener: string;
    follow_up_1: string;
    follow_up_2: string;
    closing: string;
  }[];
  retargeting: {
    scenario: string;
    message: string;
  }[];
}

export function buildDMScriptsPrompt(
  offer: string,
  avatar: string
): string {
  return `Tu es un expert en prospection par messages directs (DM) sur Instagram, LinkedIn et Twitter pour les freelances et consultants.

## Offre
${offer}

## Avatar cible
${avatar}

## Ta mission
Cree des scripts de messages directs complets pour la prospection et le retargeting.

### Partie 1 : Sequences de prospection (3 sequences)
Chaque sequence doit avoir 4 messages espaces dans le temps :
1. **Opener** : Premier message d'approche (naturel, pas vendeur)
2. **Follow-up 1** (J+2) : Relance avec valeur ajoutee
3. **Follow-up 2** (J+5) : Relance avec preuve sociale ou contenu
4. **Closing** (J+7) : Message de cloture avec CTA doux

Les 3 sequences doivent avoir des angles differents :
- Sequence 1 : Approche par la valeur (partage un contenu/conseil gratuit)
- Sequence 2 : Approche par la curiosite (question intrigante sur leur activite)
- Sequence 3 : Approche par la preuve sociale (reference a un resultat client similaire)

### Partie 2 : Messages de retargeting (5 scenarios)
Messages pour recontacter des prospects qui ont deja interagi :
1. A like/commente ton contenu
2. A visite ton profil
3. A vu ta story sans repondre
4. A ouvert ton message sans repondre
5. A montre de l'interet puis a disparu

### Regles :
- Messages courts et naturels (pas de template evidents)
- Ton conversationnel, tutoiement
- Personnalisation mentionnee (ou inserer le prenom, le sujet)
- Pas de pitch direct dans le premier message
- Chaque message < 150 mots
- Adapte au marche francophone

## Format de reponse
Reponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "prospection": [
    {
      "opener": "Hey [prenom], j'ai vu que tu...",
      "follow_up_1": "Re [prenom] ! Je voulais partager...",
      "follow_up_2": "Salut [prenom], je pensais a toi...",
      "closing": "[prenom], derniere question..."
    }
  ],
  "retargeting": [
    {
      "scenario": "Le prospect a like/commente ton contenu",
      "message": "Hey [prenom] ! Merci pour ton like sur..."
    }
  ]
}`;
}
