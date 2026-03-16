export interface SalesLetterResult {
  headline: string;
  sub_headline: string;
  sections: {
    name: string;
    content: string;
  }[];
  estimated_word_count: number;
}

export function salesLetterPrompt(
  offer: Record<string, unknown>,
  avatar: Record<string, unknown>,
): string {
  return `Tu es un expert en copywriting et en rédaction de sales letters longues (long-form sales letters) pour les freelances et consultants spécialisés en IA et automatisation.

## Contexte de l'offre
${JSON.stringify(offer, null, 2)}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Rédige une sales letter complète et persuasive, prête à être publiée sur une page de vente. La lettre doit suivre les meilleures pratiques du copywriting direct-response.

### Structure de la sales letter (14 sections) :

**1. Pre-headline**
- Phrase courte qui cible l'audience ("Attention : freelances et consultants IA qui veulent...")
- Crée un filtre pour qualifier le lecteur

**2. Headline (Titre principal)**
- Promesse forte et spécifique
- Inclut un bénéfice mesurable et un timeframe
- Crée la curiosité

**3. Sub-headline**
- Renforce le headline avec un angle complémentaire
- Ajoute de la crédibilité ou un bénéfice secondaire

**4. Opening Story (Histoire d'ouverture)**
- Une histoire personnelle ou de client qui capte l'attention
- Le lecteur doit se reconnaître dans la situation
- Crée une connexion émotionnelle

**5. Problem (Problème)**
- Décris le problème principal en détail
- Montre que tu comprends profondément la situation
- Utilise le langage de l'avatar

**6. Agitation (Amplification)**
- Amplifie les conséquences de ne rien faire
- Décris le coût de l'inaction (financier, émotionnel, temporel)
- Crée l'urgence de trouver une solution

**7. Solution (Solution)**
- Présente ta solution comme la réponse idéale
- Explique le mécanisme unique qui la rend efficace
- Différencie-toi de ce qui existe sur le marché

**8. Benefits (Bénéfices)**
- Liste de 7-10 bénéfices concrets et spécifiques
- Chaque bénéfice = fonctionnalité + avantage + résultat
- Du plus impactant au moins impactant

**9. Proof (Preuves)**
- Témoignages clients (même fictifs mais réalistes)
- Résultats chiffrés et études de cas
- Éléments de crédibilité et d'autorité

**10. Offer Stack (Empilement de valeur)**
- Détaille chaque composant de l'offre avec sa valeur individuelle
- Bonus et éléments supplémentaires
- Valeur totale vs prix demandé

**11. Price Justification (Justification du prix)**
- Compare le prix au coût du problème
- ROI attendu
- Analogies de prix ("Moins cher qu'un café par jour...")

**12. Guarantee (Garantie)**
- Garantie de satisfaction détaillée
- Renverse le risque complètement
- Conditions claires et généreuses

**13. Scarcity (Rareté)**
- Limite de temps, de places ou de prix
- Justification crédible de la rareté
- Urgence authentique

**14. CTA (Appel à l'action)**
- Bouton d'action clair et direct
- Récapitulatif de ce qu'il obtient
- Dernière phrase de motivation

**15. PS (Post-scriptum)**
- 2-3 PS qui renforcent l'offre
- Rappel du bénéfice principal
- Rappel de l'urgence

## Directives de style
- Ton conversationnel et direct, tutoiement
- Phrases courtes (max 2 lignes)
- Beaucoup de retours à la ligne pour la lisibilité
- Mots puissants et émotionnels
- Sous-titres accrocheurs entre les sections
- Minimum 2000 mots pour la lettre complète
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "headline": "Le titre principal de la sales letter",
  "sub_headline": "Le sous-titre",
  "sections": [
    {
      "name": "Pre-headline",
      "content": "Le contenu complet de cette section..."
    },
    {
      "name": "Headline",
      "content": "..."
    },
    {
      "name": "Opening Story",
      "content": "..."
    },
    {
      "name": "Problem",
      "content": "..."
    },
    {
      "name": "Agitation",
      "content": "..."
    },
    {
      "name": "Solution",
      "content": "..."
    },
    {
      "name": "Benefits",
      "content": "..."
    },
    {
      "name": "Proof",
      "content": "..."
    },
    {
      "name": "Offer Stack",
      "content": "..."
    },
    {
      "name": "Price Justification",
      "content": "..."
    },
    {
      "name": "Guarantee",
      "content": "..."
    },
    {
      "name": "Scarcity",
      "content": "..."
    },
    {
      "name": "CTA",
      "content": "..."
    },
    {
      "name": "PS",
      "content": "..."
    }
  ],
  "estimated_word_count": 2500
}

IMPORTANT : Ne PAS inclure de champ "full_letter". Retourne uniquement headline, sub_headline, sections et estimated_word_count.`;
}
