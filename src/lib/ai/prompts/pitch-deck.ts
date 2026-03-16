export interface PitchDeckResult {
  slides: {
    slide_number: number;
    title: string;
    content: string;
    speaker_notes: string;
    visual_suggestion: string;
  }[];
}

export function pitchDeckPrompt(
  offer: Record<string, unknown>,
  avatar: Record<string, unknown>,
): string {
  return `Tu es un expert en création de pitch decks pour les freelances et consultants spécialisés en IA et automatisation.

## Contexte de l'offre
${JSON.stringify(offer, null, 2)}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Crée un pitch deck complet de 11 slides, professionnel et percutant, conçu pour convaincre des prospects ou investisseurs. Chaque slide doit être prête à être intégrée dans une présentation.

### Structure des 11 slides :

**Slide 1 — Titre**
- Nom de l'offre / entreprise
- Tagline percutante en une phrase
- Sous-titre qui résume la proposition de valeur

**Slide 2 — Problème**
- Le problème principal que tu résous
- Statistiques ou faits qui illustrent l'ampleur du problème
- Impact concret sur la cible

**Slide 3 — Solution**
- Ta solution en une phrase claire
- Les 3 bénéfices principaux
- Comment tu résous le problème différemment

**Slide 4 — Marché**
- Taille du marché cible (TAM, SAM, SOM)
- Tendances et croissance du secteur
- Pourquoi maintenant est le bon moment

**Slide 5 — Produit / Service**
- Description détaillée de l'offre
- Les composants principaux
- Démonstration de la valeur

**Slide 6 — Business Model**
- Comment tu génères du revenu
- Pricing et packages
- Marges et récurrence

**Slide 7 — Traction**
- Résultats obtenus jusqu'ici
- Métriques clés (clients, CA, croissance)
- Témoignages ou preuves sociales

**Slide 8 — Équipe**
- Profil du fondateur / de l'équipe
- Compétences clés et expérience
- Pourquoi cette équipe est la bonne

**Slide 9 — Roadmap**
- Vision à 6-12 mois
- Prochaines étapes et milestones
- Fonctionnalités ou offres à venir

**Slide 10 — Financials**
- Projections de revenus
- Coûts principaux et point de rentabilité
- KPIs de croissance

**Slide 11 — Ask / CTA**
- Ce que tu demandes (investissement, partenariat, achat)
- Les prochaines étapes concrètes
- Coordonnées et appel à l'action

## Directives de style
- Ton professionnel mais accessible
- Données chiffrees et concretes
- Phrases courtes, idéales pour des slides (pas de pavé de texte)
- Speaker notes détaillées pour accompagner chaque slide
- Suggestions visuelles précises pour le design
- Adapté au marché francophone

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Titre de la slide",
      "content": "Contenu principal de la slide (bullet points séparés par des retours à la ligne)",
      "speaker_notes": "Notes détaillées pour le présentateur...",
      "visual_suggestion": "Description de la mise en page et des éléments visuels suggérés"
    }
  ]
}`;
}
