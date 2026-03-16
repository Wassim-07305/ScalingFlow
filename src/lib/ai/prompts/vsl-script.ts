export function vslScriptPrompt(
  offer: Record<string, unknown>,
  avatar: Record<string, unknown>,
  structure: "dsl" | "education" | "case_study" = "dsl",
): string {
  const structureInstructions = getStructureInstructions(structure);

  return `Tu es un expert en écriture de scripts VSL (Video Sales Letter) pour les freelances et consultants spécialisés en IA et automatisation.

## Contexte de l'offre
${JSON.stringify(offer, null, 2)}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Rédige un script VSL complet en 7 étapes (structure : ${structureLabels[structure]}) qui convertit les prospects en clients. Chaque section doit être rédigée mot pour mot, prête à être lue devant la caméra.

### Les 7 étapes du script :

${structureInstructions}

## Directives de style
- Ton conversationnel et direct, tutoiement
- Phrases courtes et percutantes
- Langage simple, pas de jargon inutile
- Transitions fluides entre les sections
- Adapté au marché francophone

## Directives de montage
Pour CHAQUE section, tu dois fournir des indications de montage vidéo professionnelles :
- **b_roll_instructions** : 2-3 suggestions visuelles concrètes de B-roll à intercaler (ex: "B-roll: personne stressée devant laptop", "B-roll: graphiques qui montent")
- **title_card** : texte court à afficher en overlay/titre à l'écran pendant cette section (ex: "Le problème #1 des freelances")
- **transition** : type de transition vers la section suivante — "cut" (coupe franche), "fade" (fondu), "zoom" (zoom avant/arrière), "swipe" (balayage)
- **music_cue** : ambiance musicale recommandée (ex: "musique tension basse", "musique inspirante crescendo", "silence dramatique", "musique épique")
- **duration_seconds** : durée estimée de la section en secondes

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "structure": "${structure}",
  "version": "15min",
  "total_duration": 900,
  "sections": [
    {
      "step": 1,
      "name": "Nom de la section",
      "duration": "Durée estimée (ex: 30 secondes)",
      "duration_seconds": 30,
      "script": "Le texte complet du script pour cette section...",
      "b_roll_instructions": ["B-roll: suggestion visuelle 1", "B-roll: suggestion visuelle 2"],
      "title_card": "Texte overlay à afficher",
      "transition": "cut",
      "music_cue": "ambiance musicale recommandée"
    },
    {
      "step": 2,
      "name": "...",
      "duration": "...",
      "duration_seconds": 0,
      "script": "...",
      "b_roll_instructions": ["..."],
      "title_card": "...",
      "transition": "fade",
      "music_cue": "..."
    },
    {
      "step": 3,
      "name": "...",
      "duration": "...",
      "duration_seconds": 0,
      "script": "...",
      "b_roll_instructions": ["..."],
      "title_card": "...",
      "transition": "cut",
      "music_cue": "..."
    },
    {
      "step": 4,
      "name": "...",
      "duration": "...",
      "duration_seconds": 0,
      "script": "...",
      "b_roll_instructions": ["..."],
      "title_card": "...",
      "transition": "fade",
      "music_cue": "..."
    },
    {
      "step": 5,
      "name": "...",
      "duration": "...",
      "duration_seconds": 0,
      "script": "...",
      "b_roll_instructions": ["..."],
      "title_card": "...",
      "transition": "zoom",
      "music_cue": "..."
    },
    {
      "step": 6,
      "name": "...",
      "duration": "...",
      "duration_seconds": 0,
      "script": "...",
      "b_roll_instructions": ["..."],
      "title_card": "...",
      "transition": "fade",
      "music_cue": "..."
    },
    {
      "step": 7,
      "name": "...",
      "duration": "...",
      "duration_seconds": 0,
      "script": "...",
      "b_roll_instructions": ["..."],
      "title_card": "...",
      "transition": "fade",
      "music_cue": "..."
    }
  ],
  "full_script": "Le script complet assemblé, prêt à être lu..."
}

IMPORTANT : La somme des duration_seconds de toutes les sections doit correspondre approximativement à total_duration. Adapte la longueur des scripts en conséquence.`;
}

const structureLabels: Record<"dsl" | "education" | "case_study", string> = {
  dsl: "Direct Sales Letter",
  education: "Éducation",
  case_study: "Étude de cas",
};

function getStructureInstructions(
  structure: "dsl" | "education" | "case_study",
): string {
  switch (structure) {
    case "dsl":
      return `1. **Hook (Accroche)** — 30 secondes max
   - Capte l'attention immédiatement avec une promesse forte ou une question provocante
   - Donne envie de regarder la suite

2. **Problem (Problème)** — 2 minutes
   - Identifie le problème principal de l'avatar
   - Montre que tu comprends sa situation actuelle
   - Décris les conséquences de ne rien faire

3. **Agitation (Agitation)** — 2 minutes
   - Amplifie la douleur émotionnelle
   - Explique pourquoi les solutions classiques échouent
   - Crée un sentiment d'urgence

4. **Credibility (Crédibilité)** — 1 minute
   - Établis ton autorité et ton expertise
   - Partage des résultats concrets obtenus
   - Mentionne des preuves sociales

5. **Solution (Solution)** — 3 minutes
   - Présente le mécanisme unique de ton offre
   - Explique comment ça fonctionne étape par étape
   - Montre les résultats attendus

6. **Offer (Offre)** — 2 minutes
   - Détaille ce qui est inclus
   - Empile la valeur de chaque composant
   - Justifie le prix par rapport à la valeur

7. **Close (Conclusion)** — 1 minute
   - Résume la transformation promise
   - Crée l'urgence finale
   - Appel à l'action clair et direct`;

    case "education":
      return `1. **Hook (Accroche)** — 30 secondes max
   - Commence par une statistique surprenante ou un fait peu connu
   - Promets au spectateur qu'il va apprendre quelque chose de nouveau
   - Crée la curiosité intellectuelle

2. **Teaching Moment (Moment d'apprentissage)** — 3 minutes
   - Enseigne un concept ou une idée qui change la perspective
   - Utilise des analogies simples et mémorables
   - Donne de la valeur gratuite — montre ton expertise
   - Le spectateur doit avoir un "aha moment"

3. **Framework (Cadre de référence)** — 2 minutes
   - Présente ton framework ou ta méthode en 3-5 étapes
   - Donne les grandes lignes de chaque étape
   - Montre pourquoi cette approche est unique et supérieure
   - Utilise des noms accrocheurs pour chaque étape

4. **Case Study (Exemple concret)** — 2 minutes
   - Raconte l'histoire d'un client ou d'un cas réel
   - Montre comment le framework a été appliqué concrètement
   - Inclus des chiffres et des résultats mesurables
   - Rends l'histoire relatable pour l'avatar

5. **Reveal (Révélation)** — 2 minutes
   - Révèle la pièce manquante — ce que la plupart des gens ne font pas
   - Explique pourquoi le framework seul ne suffit pas sans accompagnement
   - Crée le besoin naturel d'aller plus loin
   - Transition naturelle vers l'offre

6. **Offer (Offre)** — 2 minutes
   - Présente l'offre comme la suite logique de l'apprentissage
   - Détaille ce qui est inclus avec la valeur de chaque composant
   - Positionne l'offre comme un raccourci pour appliquer le framework
   - Justifie le prix par le ROI attendu

7. **Close (Conclusion)** — 1 minute
   - Résume ce que le spectateur a appris
   - Rappelle la transformation possible
   - Appel à l'action clair et sans pression — "Si ça résonne avec toi..."`;

    case "case_study":
      return `1. **Hook (Accroche)** — 30 secondes max
   - Commence par le résultat final ("Il y a 6 mois, [client] a fait X...")
   - Utilise un chiffre marquant ou une transformation impressionnante
   - Donne envie de savoir comment c'est arrivé

2. **Before Story (Avant — La situation de départ)** — 2 minutes
   - Décris la situation difficile du client avant la transformation
   - Détaille les frustrations, les échecs passés, les doutes
   - Le spectateur doit se reconnaître dans cette histoire
   - Rends le client humain et relatable

3. **Turning Point (Le point de bascule)** — 2 minutes
   - Raconte le moment où le client a décidé de changer
   - Décris ce qui l'a poussé à agir (le déclic)
   - Explique comment il t'a trouvé / comment la connexion s'est faite
   - Montre que ce n'était pas une décision facile

4. **The Method (La méthode appliquée)** — 3 minutes
   - Détaille les étapes concrètes de la transformation
   - Explique ce qui a été mis en place semaine après semaine
   - Mentionne les obstacles rencontrés et comment ils ont été surmontés
   - Montre la méthodologie de manière transparente

5. **Results (Les résultats obtenus)** — 2 minutes
   - Présente les résultats quantitatifs (CA, leads, conversions, temps gagné)
   - Ajoute les résultats qualitatifs (confiance, liberté, clarté)
   - Compare avant/après de manière claire
   - Utilise des timeframes précis

6. **Invitation (L'invitation)** — 1 minute 30
   - Explique que cette transformation est accessible à d'autres
   - Présente brièvement l'offre qui a rendu tout ça possible
   - Détaille les composants principaux et la valeur
   - Positionne l'offre comme un investissement, pas une dépense

7. **Close (Conclusion)** — 1 minute
   - Reviens sur le résultat du client une dernière fois
   - Pose la question : "Est-ce que tu veux la même chose ?"
   - Appel à l'action simple et direct
   - Crée un sentiment d'urgence naturel`;
  }
}
