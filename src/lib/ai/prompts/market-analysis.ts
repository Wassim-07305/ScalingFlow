export interface OnboardingData {
  skills: string[];
  experienceLevel: string;
  currentRevenue: number;
  targetRevenue: number;
  industries: string[];
  objectives: string[];
  budgetMonthly: number;
}

export interface VaultSkill {
  name?: string;
  category?: string;
  level: "debutant" | "intermediaire" | "avance" | "expert";
  details?: string;
}

export interface MarketAnalysisContext {
  // Donnees onboarding de base
  skills: string[];
  experienceLevel: string;
  currentRevenue: number;
  targetRevenue: number;
  industries: string[];
  objectives: string[];
  budgetMonthly: number;
  // Contexte enrichi Phase 1
  parcours?: "A1" | "A2" | "A3" | "B" | "C";
  country?: string;
  language?: string;
  vaultSkills?: VaultSkill[];
  expertiseAnswers?: Record<string, string>;
  situation?: string;
  // Champs CDC complementaires
  situationDetails?: Record<string, unknown>;
  hoursPerWeek?: number;
  deadline?: string;
  teamSize?: number;
  formations?: string[];
  firstName?: string;
  lastName?: string;
  phase1Answers?: Record<string, string>;
}

import { PARCOURS } from "@/lib/parcours";

const PARCOURS_CONTEXT: Record<string, string> = Object.fromEntries(
  Object.entries(PARCOURS).map(([key, def]) => [key, def.aiContext]),
);

function buildVaultContext(
  vaultSkills?: VaultSkill[],
  expertiseAnswers?: Record<string, string>,
): string {
  let context = "";

  if (vaultSkills && vaultSkills.length > 0) {
    context += "\n## COFFRE DE COMPETENCES (VAULT)\n";
    context += "L'utilisateur a les competences suivantes :\n";
    for (const skill of vaultSkills) {
      context += `- ${skill.name || skill.category || "Competence"} (niveau : ${skill.level})${skill.details ? ` — ${skill.details}` : ""}\n`;
    }
    context +=
      "\nUtilise ces competences pour identifier des marches ou il a un avantage competitif naturel.\n";
  }

  if (expertiseAnswers && Object.keys(expertiseAnswers).length > 0) {
    context += "\n## REPONSES D'EXPERTISE\n";
    context += "Voici les reponses de l'utilisateur sur son expertise :\n";
    for (const [question, answer] of Object.entries(expertiseAnswers)) {
      context += `- **${question}** : ${answer}\n`;
    }
    context +=
      "\nCes reponses revelent ses points forts et ses domaines d'expertise. Utilise-les pour affiner le positionnement recommande.\n";
  }

  return context;
}

export function marketAnalysisPrompt(data: MarketAnalysisContext): string {
  const parcoursContext = data.parcours
    ? PARCOURS_CONTEXT[data.parcours] || ""
    : "";
  const vaultContext = buildVaultContext(
    data.vaultSkills,
    data.expertiseAnswers,
  );
  const countryContext = data.country ? `\n- Pays cible : ${data.country}` : "";
  const languageContext = data.language
    ? `\n- Langue du client : ${data.language}`
    : "";
  const situationContext = data.situation
    ? `\n- Situation actuelle : ${data.situation}`
    : "";
  const hoursContext = data.hoursPerWeek
    ? `\n- Heures disponibles : ${data.hoursPerWeek}h/semaine`
    : "";
  const deadlineContext = data.deadline
    ? `\n- Deadline : ${data.deadline}`
    : "";
  const teamContext =
    data.teamSize != null
      ? `\n- Equipe : ${data.teamSize <= 1 ? "Seul" : data.teamSize + " personnes"}`
      : "";
  const formationsContext =
    data.formations && data.formations.length > 0
      ? `\n- Formations : ${data.formations.join(", ")}`
      : "";
  const situationDetailsContext =
    data.situationDetails && Object.keys(data.situationDetails).length > 0
      ? `\n- Details situation : ${Object.entries(data.situationDetails)
          .filter(([k, v]) => v && k !== "paying_clients")
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")}`
      : "";
  const payingClientsContext = data.situationDetails?.paying_clients
    ? (() => {
        const pc = data.situationDetails.paying_clients as Record<
          string,
          unknown
        >;
        if (!pc.has_paying_clients)
          return "\n- Clients payants : Non (premier business)";
        const parts = [`a deja eu des clients payants`];
        if (pc.clients_count) parts.push(`${pc.clients_count} clients`);
        if (pc.client_type) parts.push(`type: ${pc.client_type}`);
        if (pc.best_result) parts.push(`meilleur resultat: ${pc.best_result}`);
        return `\n- Clients payants : ${parts.join(", ")}`;
      })()
    : "";

  const phase1Context =
    data.phase1Answers && Object.keys(data.phase1Answers).length > 0
      ? "\n## REPONSES PHASE 1 (RECHERCHE DE MARCHE)\n" +
        Object.entries(data.phase1Answers)
          .map(([label, answer]) => `- **${label}** : ${answer}`)
          .join("\n") +
        "\n\nCes reponses revelent les motivations profondes, contraintes et vision de l'utilisateur. Utilise-les pour affiner la selection de marche et le positionnement.\n"
      : "";

  return `Tu es un expert en strategie marketing et business development specialise dans l'IA et l'automatisation pour les freelances et agences.

## CONTEXTE UTILISATEUR
- Competences : ${data.skills.join(", ")}
- Niveau d'experience : ${data.experienceLevel}
- Industries passees : ${data.industries.join(", ")}
- Revenu actuel : ${data.currentRevenue}EUR/mois
- Objectif : ${data.targetRevenue}EUR/mois
- Budget ads : ${data.budgetMonthly}EUR/mois${countryContext}${languageContext}${situationContext}${hoursContext}${deadlineContext}${teamContext}${formationsContext}${situationDetailsContext}${payingClientsContext}

${parcoursContext ? `## PARCOURS UTILISATEUR\n${parcoursContext}\n` : ""}${phase1Context}${vaultContext}

## TA MISSION
Analyse le marche et identifie les 3 meilleures opportunites de positionnement pour cet utilisateur.${data.country ? ` Concentre-toi sur le marche ${data.country}.` : ""}${data.language ? ` Redige ton analyse en ${data.language}.` : ""} Pour chaque opportunite :

1. **Marche cible** : industrie/niche specifique qui a besoin d'infrastructure IA
2. **Problemes specifiques** : 3-5 problemes concrets que cette niche rencontre
3. **Score de viabilite** (0-100) base sur : taille du marche, urgence du besoin, capacite a payer, niveau de concurrence, adequation avec les competences de l'utilisateur${data.vaultSkills ? " et son coffre de competences" : ""}
4. **Scoring composite** : 3 sous-scores individuels (0-100 chacun) :
   - **attractivite** : taille du marche, urgence du besoin, tendance de croissance
   - **concurrence** : niveau de saturation (100 = peu de concurrence, 0 = tres sature)
   - **potentiel** : capacite a payer, adequation competences, facilite d'entree
5. **Estimation budget client** : fourchette de budget mensuel que le client cible est pret a investir pour resoudre son probleme
6. **Positionnement recommande** : angle unique d'attaque${data.parcours ? " adapte au parcours " + data.parcours : ""}
7. **Avatar client** : persona detaille (nom, role, CA, problemes quotidiens, desirs, objections)
8. **Concurrents principaux** : 3-5 concurrents avec forces/faiblesses
9. **Signaux de demande** : indices concrets que ce marche est pret
10. **Niveau Schwartz** : quel est le niveau de sophistication du marche (1 a 5) selon Eugene Schwartz (Breakthrough Advertising) :
    - Niveau 1 : marche vierge — promesse directe, pas besoin de preuves
    - Niveau 2 : debut de concurrence — amplifier la promesse, ajouter des details
    - Niveau 3 : marche sature — mecanisme unique obligatoire
    - Niveau 4 : tres sature — empiler les mecanismes, preuves massives
    - Niveau 5 : hyper sature — identification (le prospect ne croit plus aux promesses, il achete une identite)
11. **Recommandation pricing Schwartz** : le pricing adapte au niveau de sophistication (Niveau 1-2 = pricing simple et direct, Niveau 3 = pricing avec value stack, Niveau 4-5 = pricing avec garanties massives et inversion totale du risque)
12. **Recommandation contenu social** : quel type de contenu fonctionne le mieux pour ce niveau de marche (Niveau 1-2 = contenu educatif et promesses directes, Niveau 3 = contenu mecanisme unique et preuves, Niveau 4-5 = contenu storytelling, polarisant, identitaire)
13. **Style VSL recommande** : le style de VSL adapte au marche (Niveau 1-2 = VSL courte et directe 5-10min, Niveau 3 = VSL mecanisme 15-20min, Niveau 4-5 = VSL storytelling longue 30-45min avec preuves massives)

## FORMAT DE REPONSE
Reponds en JSON structure :
{
  "markets": [
    {
      "name": "...",
      "description": "...",
      "problems": ["...", "..."],
      "viability_score": 85,
      "scoring_composite": { "attractivite": 80, "concurrence": 70, "potentiel": 90 },
      "estimated_client_budget": "500-2000 EUR/mois",
      "positioning": "...",
      "avatar": { "name": "...", "role": "...", "revenue": "...", "pain_points": ["..."], "desires": ["..."], "objections": ["..."] },
      "competitors": [{ "name": "...", "strengths": ["..."], "weaknesses": ["..."] }],
      "demand_signals": ["...", "..."],
      "why_good_fit": "...",
      "schwartz_level": 3,
      "schwartz_pricing_reco": "Pricing avec value stack et mecanisme unique obligatoire",
      "social_content_reco": "Contenu axe sur le mecanisme unique avec preuves tangibles",
      "vsl_style_reco": "VSL mecanisme 15-20min avec demonstration du process unique"
    }
  ],
  "recommended_market_index": 0,
  "reasoning": "..."
}`;
}
