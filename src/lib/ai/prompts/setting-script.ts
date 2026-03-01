export interface SettingScriptResult {
  opening: { script: string; notes: string };
  qualification: { questions: { question: string; ideal_answer: string; red_flag: string }[] };
  presentation: { script: string; notes: string };
  objection_handling: { objection: string; response: string }[];
  closing: { script: string; transition_to_call: string };
  follow_up: { sms_template: string; email_template: string };
}

export function settingScriptPrompt(
  offer: Record<string, unknown>,
  avatar: Record<string, unknown>
): string {
  return `Tu es un expert en vente par téléphone et en setting (prise de rendez-vous qualifiés) pour les freelances et consultants spécialisés en IA et automatisation.

## Contexte de l'offre
${JSON.stringify(offer, null, 2)}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Crée un script complet de setting (appel de qualification / prise de rendez-vous) de 10-15 minutes, conçu pour qualifier les prospects et les amener à réserver un appel de closing.

### Structure du script :

**1. Opening (Ouverture) — 2 minutes**
- Script d'accroche pour les premières secondes
- Comment se présenter de manière professionnelle et chaleureuse
- Cadrer l'appel ("Je t'appelle parce que...")
- Obtenir la permission de poser des questions
- Notes sur le ton et l'attitude à adopter

**2. Qualification (Questions de qualification) — 5 minutes**
- 6-8 questions stratégiques pour qualifier le prospect
- Pour chaque question : la question exacte, la réponse idéale, et le red flag
- Questions sur : la situation actuelle, les objectifs, le budget, le timing, l'autorité de décision
- L'ordre des questions est important — du général au spécifique

**3. Presentation (Mini-présentation) — 3 minutes**
- Script pour présenter brièvement l'offre (pas un pitch complet)
- Comment relier l'offre aux réponses du prospect
- Créer de la curiosité pour l'appel de closing
- Notes sur ce qu'il faut dire et surtout ce qu'il ne faut PAS dire

**4. Objection Handling (Gestion des objections) — 3 minutes**
- Les 6-8 objections les plus fréquentes et leurs réponses
- "Je n'ai pas le temps", "C'est trop cher", "Je dois réfléchir", etc.
- Formulations exactes à utiliser pour chaque objection
- Techniques de reframe et de pivot

**5. Closing (Transition vers le closing call) — 2 minutes**
- Script pour proposer le rendez-vous de closing
- Comment présenter l'appel de closing ("Ce n'est pas un appel de vente, c'est...")
- Technique pour fixer le rendez-vous immédiatement
- Phrase de transition naturelle

**6. Follow-up (Suivi post-appel)**
- Template de SMS de confirmation à envoyer juste après l'appel
- Template d'email de rappel à envoyer 24h avant le rendez-vous

## Directives de style
- Ton naturel et conversationnel, tutoiement
- Phrases courtes et faciles à lire à voix haute
- Scripts mot pour mot, prêts à être utilisés
- Focus sur l'écoute active — pas de pitch agressif
- Adapté au marché francophone (freelances/consultants IA)

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "opening": {
    "script": "Le script complet d'ouverture...",
    "notes": "Notes et conseils pour le setter"
  },
  "qualification": {
    "questions": [
      {
        "question": "La question exacte à poser",
        "ideal_answer": "Ce que tu veux entendre comme réponse",
        "red_flag": "Ce qui indique que le prospect n'est pas qualifié"
      }
    ]
  },
  "presentation": {
    "script": "Le script de mini-présentation...",
    "notes": "Notes et conseils"
  },
  "objection_handling": [
    {
      "objection": "L'objection du prospect",
      "response": "La réponse exacte à donner"
    }
  ],
  "closing": {
    "script": "Le script de closing et prise de rendez-vous...",
    "transition_to_call": "La phrase de transition vers l'appel de closing"
  },
  "follow_up": {
    "sms_template": "Template SMS de confirmation...",
    "email_template": "Template email de rappel..."
  }
}`;
}
