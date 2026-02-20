export function vslScriptPrompt(
  offer: Record<string, unknown>,
  avatar: Record<string, unknown>
): string {
  return `Tu es un expert en écriture de scripts VSL (Video Sales Letter) pour les freelances et consultants spécialisés en IA et automatisation.

## Contexte de l'offre
${JSON.stringify(offer, null, 2)}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Rédige un script VSL complet en 7 étapes qui convertit les prospects en clients. Chaque section doit être rédigée mot pour mot, prête à être lue devant la caméra.

### Les 7 étapes du script :

1. **Hook (Accroche)** — 30 secondes max
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
   - Appel à l'action clair et direct

## Directives de style
- Ton conversationnel et direct, tutoiement
- Phrases courtes et percutantes
- Langage simple, pas de jargon inutile
- Transitions fluides entre les sections
- Adapté au marché francophone

## Format de réponse
Réponds UNIQUEMENT en JSON valide avec la structure suivante :
{
  "sections": [
    {
      "step": 1,
      "name": "Hook",
      "duration": "30 secondes",
      "script": "Le texte complet du script pour cette section..."
    },
    {
      "step": 2,
      "name": "Problem",
      "duration": "2 minutes",
      "script": "..."
    },
    {
      "step": 3,
      "name": "Agitation",
      "duration": "2 minutes",
      "script": "..."
    },
    {
      "step": 4,
      "name": "Credibility",
      "duration": "1 minute",
      "script": "..."
    },
    {
      "step": 5,
      "name": "Solution",
      "duration": "3 minutes",
      "script": "..."
    },
    {
      "step": 6,
      "name": "Offer",
      "duration": "2 minutes",
      "script": "..."
    },
    {
      "step": 7,
      "name": "Close",
      "duration": "1 minute",
      "script": "..."
    }
  ],
  "full_script": "Le script complet assemblé, prêt à être lu..."
}`;
}
