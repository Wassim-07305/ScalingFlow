import type { ContentPerformanceProfile } from "@/lib/services/content-performance-analyzer";

export interface ContinuousContentInput {
  niche: string;
  offer: string;
  persona: string;
  performanceProfile: ContentPerformanceProfile;
  salesObjections: string[];
  adInsights: { hook: string; ctr: number }[];
}

export interface ContentSuggestionOutput {
  type: "reel" | "carousel" | "story" | "post" | "youtube";
  angle: "educatif" | "objection" | "backstage" | "cas_client" | "hook_viral";
  pillar: "know" | "like" | "trust" | "conversion";
  title: string;
  hook: string;
  script: string;
  hashtags: string[];
  best_posting_time: string;
  source_insight: string;
  reasoning: string;
  duration?: string;
  chapters?: string;
}

export interface ContinuousContentOutput {
  week: string;
  adaptation_strategy: {
    rationale: string;
    top_format: string;
    top_angle: string;
    distribution: Record<string, number>;
  };
  contents: ContentSuggestionOutput[];
}

export function buildContinuousContentPrompt(
  ctx: ContinuousContentInput,
): string {
  const { performanceProfile: perf } = ctx;

  const perfSection = perf.hasData
    ? `## DONNÉES DE PERFORMANCE (30 derniers jours)
${perf.insightText}

Distribution optimale calculée :
${Object.entries(perf.distribution)
  .map(([type, pct]) => `- ${type}: ${pct}%`)
  .join("\n")}

Meilleur angle de contenu : ${perf.bestAngle}

Détail par format :
${Object.entries(perf.byType)
  .map(
    ([type, d]) =>
      `- ${type}: engagement moyen ${d.avgEngagement.toFixed(1)}%, reach moyen ${d.avgReach} vues (${d.count} publiés)`,
  )
  .join("\n")}

→ Adapte le mix de contenu en conséquence. Génère DAVANTAGE du format le plus performant.`
    : `## DONNÉES DE PERFORMANCE
Pas encore assez de données (cold start). Utilise la distribution par défaut : 40% Reels, 25% Carousels, 25% Stories, 10% Posts.`;

  const adsSection =
    ctx.adInsights.length > 0
      ? `## HOOKS ADS PERFORMANTS
Les hooks publicitaires suivants ont les meilleurs CTR — transpose-les en contenu organique :
${ctx.adInsights.map((a, i) => `- Hook #${i + 1} (CTR ${a.ctr.toFixed(2)}%) : "${a.hook}"`).join("\n")}
→ 1-2 Reels doivent reprendre ces angles/hooks.`
      : "";

  const objectionsSection =
    ctx.salesObjections.length > 0
      ? `## OBJECTIONS DE VENTE FRÉQUENTES
${ctx.salesObjections.map((o, i) => `${i + 1}. ${o}`).join("\n")}
→ Au moins 1 Carousel et 1 Reel doivent adresser ces objections de façon éducative.`
      : "";

  return `Tu es un expert en stratégie de contenu social media et en growth marketing pour les entrepreneurs francophones.

## CONTEXTE BUSINESS
- Niche : ${ctx.niche}
- Offre : ${ctx.offer}
- Persona cible : ${ctx.persona}

${perfSection}

${adsSection}

${objectionsSection}

## TA MISSION
Génère exactement 3 à 5 scripts de contenu pour la semaine. Respecte ces quotas :
- 1-2 scripts Reels (15-60s) basés sur les hooks ads qui performent
- 1 Carousel complet (8-10 slides) basé sur une objection fréquente
- 1 Story sequence (5-8 stories narratives)
- 1 Post éducatif ou cas client (optionnel si le calendrier le permet)

## RÈGLES
1. Varie les angles : éducatif, objection, backstage, cas client, hook viral
2. Respecte les piliers KLCT : Know (35-40%) / Like (20-25%) / Trust (25-30%) / Conversion (10-15%)
3. Chaque contenu a un hook fort (3 premières secondes pour vidéo)
4. source_insight doit expliquer POURQUOI ce contenu (ex: "Basé sur hook ads #2 (CTR 1.8%)" ou "Objection fréquente : trop cher")
5. best_posting_time : jour et heure optimaux (ex: "Mardi 12h")

## FORMAT DE RÉPONSE
Réponds UNIQUEMENT en JSON valide (pas de markdown, pas d'explication) :
{
  "week": "Semaine du [lundi courant]",
  "adaptation_strategy": {
    "rationale": "Pourquoi cette distribution cette semaine",
    "top_format": "reel",
    "top_angle": "objection",
    "distribution": { "reel": 40, "carousel": 25, "story": 25, "post": 10 }
  },
  "contents": [
    {
      "type": "reel",
      "angle": "objection",
      "pillar": "trust",
      "title": "Titre court du contenu",
      "hook": "L'accroche percutante (1 phrase, 3 premières secondes)",
      "script": "Script complet avec intro, corps, CTA. Pour carousel: 'Slide 1: ... | Slide 2: ...'. Pour story: 'Story 1: ... | Story 2: ...'",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "best_posting_time": "Mardi 18h",
      "source_insight": "Basé sur hook ads #1 (CTR 2.3%)",
      "reasoning": "Ce Reel répond à l'objection prix avec preuve sociale",
      "duration": "45s"
    }
  ]
}`;
}
