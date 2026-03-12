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
  category: string;
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
}

import { PARCOURS } from "@/lib/parcours";

const PARCOURS_CONTEXT: Record<string, string> = Object.fromEntries(
  Object.entries(PARCOURS).map(([key, def]) => [key, def.aiContext])
);

function buildVaultContext(vaultSkills?: VaultSkill[], expertiseAnswers?: Record<string, string>): string {
  let context = "";

  if (vaultSkills && vaultSkills.length > 0) {
    context += "\n## COFFRE DE COMPETENCES (VAULT)\n";
    context += "L'utilisateur a les competences suivantes :\n";
    for (const skill of vaultSkills) {
      context += `- ${skill.category} (niveau : ${skill.level})${skill.details ? ` — ${skill.details}` : ""}\n`;
    }
    context += "\nUtilise ces competences pour identifier des marches ou il a un avantage competitif naturel.\n";
  }

  if (expertiseAnswers && Object.keys(expertiseAnswers).length > 0) {
    context += "\n## REPONSES D'EXPERTISE\n";
    context += "Voici les reponses de l'utilisateur sur son expertise :\n";
    for (const [question, answer] of Object.entries(expertiseAnswers)) {
      context += `- **${question}** : ${answer}\n`;
    }
    context += "\nCes reponses revelent ses points forts et ses domaines d'expertise. Utilise-les pour affiner le positionnement recommande.\n";
  }

  return context;
}

export function marketAnalysisPrompt(data: MarketAnalysisContext): string {
  const parcoursContext = data.parcours ? PARCOURS_CONTEXT[data.parcours] || "" : "";
  const vaultContext = buildVaultContext(data.vaultSkills, data.expertiseAnswers);
  const countryContext = data.country ? `\n- Pays cible : ${data.country}` : "";
  const languageContext = data.language ? `\n- Langue du client : ${data.language}` : "";
  const situationContext = data.situation ? `\n- Situation actuelle : ${data.situation}` : "";

  return `Tu es un expert en strategie marketing et business development specialise dans l'IA et l'automatisation pour les freelances et agences.

## CONTEXTE UTILISATEUR
- Competences : ${data.skills.join(", ")}
- Niveau d'experience : ${data.experienceLevel}
- Industries passees : ${data.industries.join(", ")}
- Revenu actuel : ${data.currentRevenue}EUR/mois
- Objectif : ${data.targetRevenue}EUR/mois
- Budget ads : ${data.budgetMonthly}EUR/mois${countryContext}${languageContext}${situationContext}

${parcoursContext ? `## PARCOURS UTILISATEUR\n${parcoursContext}\n` : ""}${vaultContext}

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
      "why_good_fit": "..."
    }
  ],
  "recommended_market_index": 0,
  "reasoning": "..."
}`;
}
