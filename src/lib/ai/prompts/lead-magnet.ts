export interface LeadMagnetResult {
  type: "checklist" | "mini_cours" | "template" | "quiz" | "guide";
  title: string;
  description: string;
  content: {
    section_title: string;
    section_content: string;
  }[];
  opt_in_headline: string;
  opt_in_subheadline: string;
  delivery_email_subject: string;
  delivery_email_body: string;
}

export function leadMagnetPrompt(
  offer: Record<string, unknown>,
  avatar: Record<string, unknown>,
  type:
    | "checklist"
    | "mini_cours"
    | "template"
    | "quiz"
    | "guide" = "checklist",
): string {
  const typeInstructions = getTypeInstructions(type);

  return `Tu es un expert en création de lead magnets à forte valeur perçue pour les freelances et consultants spécialisés en IA et automatisation.

## Contexte de l'offre
${JSON.stringify(offer, null, 2)}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Type de lead magnet demandé : ${typeLabels[type]}

## Ta mission
Crée un lead magnet complet de type "${typeLabels[type]}" qui attire des prospects qualifiés et les prépare à acheter l'offre. Le lead magnet doit apporter une valeur immédiate tout en créant le besoin pour l'offre payante.

### Instructions spécifiques au type :

${typeInstructions}

### Éléments additionnels à créer :

**Page d'opt-in**
- Un headline percutant qui donne envie de télécharger
- Un sous-titre qui renforce la promesse
- Ces textes doivent fonctionner seuls sur une landing page

**Email de livraison**
- Objet d'email court et intrigant
- Corps de l'email : livraison + teaser de l'offre principale
- Ton chaleureux et professionnel

## Directives de style
- Ton expert mais accessible, tutoiement
- Contenu actionnable — le lecteur doit pouvoir agir immédiatement
- Valeur réelle — pas de contenu superficiel
- Design pensé pour être consommé rapidement (5-15 min)
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "type": "${type}",
  "title": "Titre du lead magnet",
  "description": "Description courte (2-3 phrases) pour la page d'opt-in",
  "content": [
    {
      "section_title": "Titre de la section",
      "section_content": "Contenu complet de la section..."
    }
  ],
  "opt_in_headline": "Le titre de la page d'opt-in",
  "opt_in_subheadline": "Le sous-titre de la page d'opt-in",
  "delivery_email_subject": "Objet de l'email de livraison",
  "delivery_email_body": "Corps complet de l'email de livraison"
}`;
}

const typeLabels: Record<LeadMagnetResult["type"], string> = {
  checklist: "Checklist",
  mini_cours: "Mini-cours",
  template: "Template",
  quiz: "Quiz",
  guide: "Guide",
};

function getTypeInstructions(type: LeadMagnetResult["type"]): string {
  switch (type) {
    case "checklist":
      return `**Checklist (Liste de contrôle)**
- Crée une checklist de 15-25 items organisés par catégories
- Chaque item doit être actionnable et vérifiable
- Inclus des explications courtes pour chaque item (1-2 phrases)
- Organise en 4-6 sections thématiques
- Le prospect doit pouvoir l'utiliser comme outil de diagnostic
- Exemple : "Checklist des 23 points à vérifier avant de lancer ta première campagne IA"`;

    case "mini_cours":
      return `**Mini-cours (3-5 leçons)**
- Structure en 3-5 leçons progressives
- Chaque leçon : concept + exemple + exercice pratique
- La leçon 1 doit apporter un quick win immédiat
- Les dernières leçons doivent naturellement mener vers l'offre payante
- Inclus des points clés à retenir pour chaque leçon
- Exemple : "Mini-cours : Automatise tes 3 premières tâches IA en 5 jours"`;

    case "template":
      return `**Template (Modèle prêt à l'emploi)**
- Crée un template complet avec des sections à remplir
- Inclus des instructions détaillées pour chaque section
- Ajoute des exemples remplis pour illustrer
- Le template doit résoudre un problème concret et immédiat
- Inclus des tips et bonnes pratiques pour chaque section
- Exemple : "Template : Plan d'action 90 jours pour lancer ton activité IA"`;

    case "quiz":
      return `**Quiz (Auto-évaluation)**
- Crée un quiz de 10-15 questions avec des options de réponse
- Chaque question teste un aspect clé du sujet
- 3-4 profils de résultats basés sur les réponses
- Chaque profil inclut des recommandations personnalisées
- Le quiz doit révéler un gap que l'offre comble
- Exemple : "Quiz : Quel est ton niveau de maturité IA ? (et comment passer au suivant)"`;

    case "guide":
      return `**Guide complet (eBook court)**
- Structure en 5-8 chapitres progressifs
- Chaque chapitre : introduction, contenu, exemples, action à prendre
- Inclus des statistiques et données pour la crédibilité
- Le guide doit éduquer et créer le besoin pour l'offre
- Minimum 3000 mots de contenu substantiel
- Exemple : "Guide : Les 7 stratégies IA que les top consultants utilisent en 2024"`;
  }
}
