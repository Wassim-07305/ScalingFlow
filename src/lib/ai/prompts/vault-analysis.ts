export interface VaultData {
  firstName: string;
  situation: string;
  situationDetails: Record<string, unknown>;
  skills: string[];
  vaultSkills: { name: string; level: string; details?: string }[];
  expertiseAnswers: Record<string, string>;
  parcours: string;
  experienceLevel: string;
  currentRevenue: number;
  targetRevenue: number;
  industries: string[];
  objectives: string[];
  hoursPerWeek: number;
  formations: string[];
}

export interface VaultAnalysis {
  radar: {
    marketing: number;
    vente: number;
    copywriting: number;
    tech: number;
    design: number;
    strategie: number;
  };
  score_avantage_competitif: number;
  forces_principales: string[];
  faiblesses: string[];
  suggestions_productisation: {
    titre: string;
    description: string;
    potentiel: "faible" | "moyen" | "fort";
  }[];
  recommandation_funnel: "vsl" | "social" | "hybride";
  recommandation_funnel_raison: string;
  parcours_recommande: "A1" | "A2" | "A3" | "B" | "C";
  parcours_raison: string;
  prochaines_etapes: string[];
}

export function buildVaultAnalysisPrompt(data: VaultData) {
  const systemPrompt = `Tu es un expert en strategie business et coaching d'entrepreneurs. Analyse le profil complet de cet utilisateur et genere une cartographie detaillee de ses competences, son avantage competitif, et des recommandations actionables.

## REGLES D'ANALYSE

### Radar de competences (0-100 chaque)
Evalue les 6 dimensions suivantes en croisant les competences declarees, le niveau d'expertise, le parcours et les reponses qualitatives :
- **marketing** : connaissance du marche, acquisition, positionnement, branding, content marketing, SEO/SEA
- **vente** : closing, negociation, relation client, sales process, upsell/cross-sell
- **copywriting** : redaction persuasive, storytelling, emails, pages de vente, hooks
- **tech** : competences techniques, automatisation, IA, no-code/low-code, developpement
- **design** : UX/UI, identite visuelle, creation de contenus visuels, branding visuel
- **strategie** : vision business, planification, analyse de marche, pricing, positionnement strategique

### Score d'avantage competitif (0-100)
Calcule un score global base sur :
- Unicite de la combinaison de competences
- Adequation competences/objectifs
- Experience dans les industries ciblees
- Ecart entre revenu actuel et objectif (ambition vs realisme)
- Nombre d'heures disponibles par semaine

### Forces principales
Identifie les 3 forces majeures qui differencient cet utilisateur sur le marche. Sois specifique et actionable.

### Faiblesses
Identifie les 3 faiblesses ou lacunes principales qui freinent la progression. Sois constructif.

### Suggestions de productisation
Propose 3 a 5 idees concretes de produits/services que l'utilisateur pourrait vendre, basees sur ses competences et son marche. Pour chaque suggestion, evalue le potentiel ("faible", "moyen", "fort").

### Recommandation funnel
Recommande le type de funnel le plus adapte :
- **vsl** : Video Sales Letter — ideal pour les offres high-ticket, quand l'utilisateur a de bonnes competences en storytelling/video
- **social** : Funnel social media — ideal pour les createurs de contenu, quand l'utilisateur est a l'aise avec la creation de contenu regulier
- **hybride** : Mix des deux — quand l'utilisateur a des competences equilibrees
Justifie ton choix en 2-3 phrases.

### Parcours recommande
Recommande un des parcours suivants :
- **A1** : Parcours Freelance — pour ceux qui veulent vendre leurs competences en freelance/consulting
- **A2** : Parcours Agence — pour ceux qui veulent creer et scaler une agence
- **A3** : Parcours SaaS/Produit — pour ceux qui veulent creer un produit digital
- **B** : Parcours Formateur — pour ceux qui veulent monetiser via la formation/coaching
- **C** : Parcours E-commerce — pour ceux qui veulent vendre des produits physiques ou digitaux en e-commerce
Justifie ton choix en 2-3 phrases.

### Prochaines etapes
Liste exactement 5 actions concretes et sequentielles que l'utilisateur devrait entreprendre dans les 30 prochains jours.

## FORMAT DE REPONSE
Reponds UNIQUEMENT en JSON valide correspondant exactement a cette structure :
{
  "radar": { "marketing": number, "vente": number, "copywriting": number, "tech": number, "design": number, "strategie": number },
  "score_avantage_competitif": number,
  "forces_principales": [string, string, string],
  "faiblesses": [string, string, string],
  "suggestions_productisation": [{ "titre": string, "description": string, "potentiel": "faible" | "moyen" | "fort" }],
  "recommandation_funnel": "vsl" | "social" | "hybride",
  "recommandation_funnel_raison": string,
  "parcours_recommande": "A1" | "A2" | "A3" | "B" | "C",
  "parcours_raison": string,
  "prochaines_etapes": [string, string, string, string, string]
}`;

  const skillsFormatted = data.vaultSkills
    .map(
      (s) =>
        `- ${s.name} (niveau: ${s.level})${s.details ? ` — ${s.details}` : ""}`
    )
    .join("\n");

  const expertiseFormatted = Object.entries(data.expertiseAnswers)
    .map(([question, answer]) => `- ${question}: ${answer}`)
    .join("\n");

  const situationDetailsFormatted = Object.entries(data.situationDetails)
    .map(([key, value]) => `- ${key}: ${String(value)}`)
    .join("\n");

  const userPrompt = `## PROFIL COMPLET DE L'UTILISATEUR

### Identite
- Prenom : ${data.firstName}
- Situation actuelle : ${data.situation}
${situationDetailsFormatted ? `- Details situation :\n${situationDetailsFormatted}` : ""}

### Competences generales
${data.skills.length > 0 ? data.skills.join(", ") : "Non renseignees"}

### Competences detaillees (Vault)
${skillsFormatted || "Aucune competence detaillee"}

### Expertise (reponses qualitatives)
${expertiseFormatted || "Aucune reponse d'expertise"}

### Parcours professionnel
${data.parcours || "Non renseigne"}

### Niveau d'experience
${data.experienceLevel}

### Situation financiere
- Revenu actuel : ${data.currentRevenue} EUR/mois
- Objectif de revenu : ${data.targetRevenue} EUR/mois
- Ecart : ${data.targetRevenue - data.currentRevenue} EUR/mois

### Industries/niches ciblees
${data.industries.length > 0 ? data.industries.join(", ") : "Non renseignees"}

### Objectifs business
${data.objectives.length > 0 ? data.objectives.join(", ") : "Non renseignes"}

### Disponibilite
${data.hoursPerWeek} heures/semaine

### Formations suivies
${data.formations.length > 0 ? data.formations.join(", ") : "Aucune formation declaree"}

---

Analyse ce profil en detail et genere la cartographie complete avec radar, score, forces, faiblesses, suggestions de productisation, recommandation funnel, parcours recommande, et prochaines etapes.`;

  return { systemPrompt, userPrompt };
}
