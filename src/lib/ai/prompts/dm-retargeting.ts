export function dmRetargetingPrompt(
  offer: {
    offer_name: string;
    positioning?: string;
    unique_mechanism?: string;
    pricing?: { real_price?: number };
  },
  avatar: Record<string, unknown>
): string {
  return `Tu es un expert en publicité de retargeting orientée DM (Direct Message). Tu maîtrises la stratégie ScalingFlow de "DM Ads" : cibler les followers chauds (engagers, visiteurs profil, viewers de stories) avec des ads qui les poussent à envoyer un DM pour être qualifiés par un setter.

## Contexte
- **Offre** : ${offer.offer_name}
- **Positionnement** : ${offer.positioning || "Non défini"}
- **Mécanisme unique** : ${offer.unique_mechanism || "Non défini"}
- **Prix** : ${offer.pricing?.real_price ? offer.pricing.real_price + "€" : "Non défini"}

## Avatar cible
${JSON.stringify(avatar, null, 2)}

## Ta mission
Génère un pack complet de DM Ads retargeting : des publicités qui ciblent les followers chauds et les poussent à envoyer un message privé. Ces ads sont la passerelle entre le contenu organique et la conversation de vente.

### Principes des DM Retargeting Ads :
- Cibler uniquement les audiences chaudes (engagers 30/60/90j, viewers, visiteurs profil)
- Utiliser la preuve sociale et l'urgence
- CTA = envoyer un DM avec un mot-clé spécifique
- Ton conversationnel, pas corporate
- Combiner valeur + invitation à passer à l'action

Retourne un JSON avec cette structure exacte :
{
  "dm_ads": [
    {
      "type": "story_ad | feed_ad | reel_ad",
      "hook": "Accroche des 3 premières secondes (ou headline pour feed)",
      "body": "Corps du message publicitaire",
      "cta": "CTA avec mot-clé DM (ex: Envoie-moi 'SCALE' en DM)",
      "dm_keyword": "Mot-clé que le prospect doit envoyer",
      "visual_description": "Description du visuel ou vidéo",
      "angle": "Angle utilisé (résultat client, behind-the-scenes, urgence, exclusivité)",
      "audience_segment": "warm_engagers | profile_visitors | story_viewers | video_viewers"
    }
  ],
  "dm_automation": {
    "welcome_message": "Message automatique quand le prospect envoie le mot-clé",
    "qualification_questions": [
      "Question 1 pour qualifier le prospect",
      "Question 2",
      "Question 3"
    ],
    "booking_message": "Message pour proposer un appel",
    "no_show_followup": "Message de relance si pas de réponse"
  },
  "audiences": [
    {
      "name": "Nom de l'audience",
      "source": "Engagement Instagram 30j / Visiteurs profil / Story viewers / etc.",
      "size_estimate": "Estimation de taille",
      "priority": "haute | moyenne | basse"
    }
  ],
  "campaign_setup": {
    "objective": "Objectif Meta recommandé",
    "budget_daily": "Budget quotidien en euros",
    "placements": ["Stories", "Feed", "Reels"],
    "schedule": "Recommandation de diffusion (jours/heures)",
    "kpi_targets": {
      "cost_per_dm": "Coût cible par DM reçu",
      "dm_to_call_rate": "Taux DM → appel cible",
      "roas_target": "ROAS cible"
    }
  }
}

Génère 6 DM Ads (2 story, 2 feed, 2 reel), l'automation DM complète, 4 audiences et le setup campagne. Tous les textes en français.`;
}
