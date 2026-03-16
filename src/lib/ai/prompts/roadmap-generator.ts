export interface RoadmapTask {
  title: string;
  description: string;
  task_type: "action" | "video" | "review" | "launch";
  related_module: string;
  estimated_minutes: number;
  task_order: number;
  phase: "hook" | "build" | "deliver" | "scale";
}

export interface RoadmapResult {
  tasks: RoadmapTask[];
  total_estimated_hours: number;
  recommended_pace: string;
}

export function buildRoadmapPrompt(data: {
  parcours: string;
  situation: string;
  skills: string[];
  experienceLevel: string;
  objectives: string[];
  hoursPerWeek: number;
  deadline: string;
  hasOffer: boolean;
  hasFunnel: boolean;
  hasAds: boolean;
  hasContent: boolean;
}): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: `Tu es un coach business expert qui crée des roadmaps personnalisées pour les entrepreneurs et freelances. Tu connais parfaitement le processus de lancement d'un business en ligne : analyse de marché, création d'offre, funnel de vente, publicités, contenu organique, vente.

Tu dois créer une liste de tâches ordonnées, réalistes et actionables. Chaque tâche doit être suffisamment spécifique pour être exécutable en une session de travail.

IMPORTANT : Réponds UNIQUEMENT en JSON valide.`,

    userPrompt: `Crée une roadmap personnalisée pour cet utilisateur :

## Profil
- Parcours : ${data.parcours || "Non défini"}
- Situation : ${data.situation || "Non définie"}
- Compétences : ${data.skills.join(", ") || "Non renseignées"}
- Niveau : ${data.experienceLevel || "Non défini"}
- Objectifs : ${data.objectives.join(", ") || "Non définis"}
- Heures/semaine disponibles : ${data.hoursPerWeek || "Non défini"}
- Deadline : ${data.deadline || "Non définie"}

## Avancement actuel
- Offre créée : ${data.hasOffer ? "Oui" : "Non"}
- Funnel créé : ${data.hasFunnel ? "Oui" : "Non"}
- Publicités créées : ${data.hasAds ? "Oui" : "Non"}
- Contenu créé : ${data.hasContent ? "Oui" : "Non"}

## Règles
- Génère entre 15 et 25 tâches
- Ordonne-les par priorité et dépendance
- Chaque tâche doit avoir un type : "action" (faire quelque chose), "video" (regarder une formation), "review" (analyser/optimiser), "launch" (mettre en ligne)
- Chaque tâche doit avoir un related_module parmi : "vault", "market", "offer", "brand", "funnel", "ads", "content", "sales", "launch", "scale"
- Chaque tâche doit avoir une phase parmi : "hook" (marketer), "build" (créer offre/funnel), "deliver" (livrer aux clients), "scale" (optimiser/scaler)
- Estime le temps en minutes (15-120 min par tâche)
- Adapte les tâches au niveau de l'utilisateur et à son avancement

Réponds en JSON :
{
  "tasks": [
    {
      "title": "Titre court de la tâche",
      "description": "Description détaillée de ce qu'il faut faire",
      "task_type": "action",
      "related_module": "market",
      "estimated_minutes": 30,
      "task_order": 1,
      "phase": "hook"
    }
  ],
  "total_estimated_hours": 20,
  "recommended_pace": "4 tâches par semaine"
}`,
  };
}
