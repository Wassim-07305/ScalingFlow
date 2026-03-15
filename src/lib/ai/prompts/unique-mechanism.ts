export interface UniqueMechanismContext {
  niche: string;
  offer_name: string;
  main_problem: string;
  target_avatar: string;
  existing_mechanism?: string;
  skills: string[];
}

export function uniqueMechanismPrompt(ctx: UniqueMechanismContext): string {
  return `Tu es un expert en création de mécanismes uniques (Dan Kennedy / Alex Hormozi). Le mécanisme unique est le "COMMENT" propriétaire qui rend la promesse crédible sans avoir besoin de preuves massives. C'est ce qui différencie une offre quelconque d'une offre irrésistible.

## CONTEXTE
- Niche : ${ctx.niche}
- Offre : ${ctx.offer_name}
- Problème principal : ${ctx.main_problem}
- Avatar cible : ${ctx.target_avatar}
- Compétences : ${ctx.skills.join(", ")}
${ctx.existing_mechanism ? `- Mécanisme actuel : ${ctx.existing_mechanism}` : ""}

## GÉNÈRE 3 MÉCANISMES UNIQUES DIFFÉRENTS

Pour chaque mécanisme, fournis :

1. **name** : Nom propriétaire accrocheur (ex: "Système APEX", "Méthode 3C", "Framework SCALE")
2. **tagline** : Une phrase qui résume le mécanisme en 10 mots max
3. **problem** : Le problème spécifique que le prospect vit (douleur aiguë)
4. **root_cause** : La VRAIE cause que personne ne mentionne (l'insight disruptif)
5. **solution** : Comment ton mécanisme résout le problème (le "comment" unique, 3-5 étapes)
6. **evidence** : 3 preuves/données qui rendent le mécanisme crédible
7. **uniqueness** : Pourquoi SEUL ton mécanisme peut fonctionner (barrière à l'entrée)
8. **elevator_pitch** : Pitch de 30 secondes intégrant le mécanisme
9. **score** : Score de différenciation /100

## FORMAT DE RÉPONSE (JSON)
{
  "mechanisms": [
    {
      "name": "...",
      "tagline": "...",
      "problem": "...",
      "root_cause": "...",
      "solution": ["étape 1", "étape 2", "étape 3"],
      "evidence": ["preuve 1", "preuve 2", "preuve 3"],
      "uniqueness": "...",
      "elevator_pitch": "...",
      "score": 85
    }
  ],
  "recommendation": "Explication de pourquoi le mécanisme recommandé est le meilleur pour ce marché",
  "recommended_index": 0
}`;
}
