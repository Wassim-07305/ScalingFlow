import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

// ─── F73 Contenu continu + F74 Adaptation intelligente ───────
// CRON hebdomadaire : génère 12+ pièces/semaine (3-5 Reels + 1-2 Carousels + 5-7 Stories + 1 YouTube)
// L'IA analyse les types de contenu qui performent le mieux et génère plus de ce format

const anthropic = new Anthropic();

async function getAdminClient() {
  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createAdmin(url, serviceKey);
}

async function runContentGeneration() {
  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Configuration manquante" },
      { status: 500 },
    );
  }

  // Récupérer les utilisateurs actifs
  const { data: activeProfiles } = await supabase
    .from("profiles")
    .select("id, niche, offer_name, target_audience")
    .eq("onboarding_completed", true);

  let totalGenerated = 0;
  const results: { userId: string; count: number }[] = [];

  for (const profile of activeProfiles ?? []) {
    // F74 : Analyser les performances par type de contenu
    const { data: contentPerf } = await supabase
      .from("content_library")
      .select("content_type, engagement_score, views, likes, shares")
      .eq("user_id", profile.id)
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("engagement_score", { ascending: false });

    // Calculer les performances moyennes par type
    const perfByType: Record<
      string,
      { count: number; avgEngagement: number; totalViews: number }
    > = {};
    for (const item of contentPerf ?? []) {
      const type = (item.content_type as string) || "reel";
      if (!perfByType[type])
        perfByType[type] = { count: 0, avgEngagement: 0, totalViews: 0 };
      perfByType[type].count++;
      perfByType[type].avgEngagement += (item.engagement_score as number) || 0;
      perfByType[type].totalViews += (item.views as number) || 0;
    }

    // Calculer les moyennes
    for (const type in perfByType) {
      if (perfByType[type].count > 0) {
        perfByType[type].avgEngagement /= perfByType[type].count;
      }
    }

    // Récupérer les objections de vente récentes (F75 : contenu depuis data vente)
    const { data: recentCalls } = await supabase
      .from("sales_calls")
      .select("objections, key_moments")
      .eq("user_id", profile.id)
      .gte(
        "created_at",
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .limit(5);

    const objections = (recentCalls ?? [])
      .map((c) => c.objections)
      .filter(Boolean)
      .flat()
      .slice(0, 10);

    // F74 : Déterminer la distribution intelligente
    const topTypes = Object.entries(perfByType)
      .sort(([, a], [, b]) => b.avgEngagement - a.avgEngagement)
      .map(([type, data]) => ({ type, ...data }));

    const adaptationContext =
      topTypes.length > 0
        ? `Les formats les plus performants sont : ${topTypes.map((t) => `${t.type} (engagement moyen: ${t.avgEngagement.toFixed(1)}, ${t.count} publiés)`).join(", ")}.`
        : "Pas encore de données de performance. Génère un mix équilibré.";

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: `Tu es un expert en création de contenu social media. Tu crées du contenu hebdomadaire optimisé basé sur les données de performance.

BUSINESS :
- Niche : ${profile.niche || "Non spécifié"}
- Offre : ${profile.offer_name || "Non spécifié"}
- Audience : ${profile.target_audience || "Non spécifié"}

ADAPTATION INTELLIGENTE :
${adaptationContext}
${objections.length > 0 ? `\nOBJECTIONS RÉCENTES EN APPEL DE VENTE (transforme-les en contenu) :\n${objections.join("\n")}` : ""}

Retourne EXACTEMENT un JSON valide sans markdown.`,
        messages: [
          {
            role: "user",
            content: `Génère le contenu COMPLET de la semaine. Tu DOIS respecter ces quotas MINIMUM :

QUOTAS OBLIGATOIRES PAR SEMAINE :
- 3-5 scripts de Reels (15-60 secondes, avec hook + script + CTA)
- 1-2 Carousels complets (7-10 slides avec texte par slide)
- 5-7 séquences de Stories quotidiennes (story_sequence : 5-8 slides narratives)
- 1 script YouTube (8-15 min, avec titre SEO, description, chapitres)

TOTAL MINIMUM : 12 pièces de contenu.

RÈGLES D'ADAPTATION :
- Si un format performe bien → génère 2-3 contenus SUPPLÉMENTAIRES de ce format
- Si des objections de vente existent → transforme-les en contenu éducatif (Reels ou Carousels)
- Chaque contenu doit avoir un rôle dans le funnel social (Know 35-40% / Like 20-25% / Trust 25-30% / Conversion 10-15%)
- Varie les hooks par niveau : curiosité, contrarian, storytelling, direct, choc

Format JSON :
{
  "adaptation_strategy": {
    "rationale": "Pourquoi cette distribution de contenu",
    "top_performing_format": "reel|carousel|story_sequence|youtube",
    "distribution": { "know": 5, "like": 3, "trust": 3, "conversion": 1 },
    "objections_addressed": ["objection transformée en contenu"]
  },
  "contents": [
    {
      "type": "reel|carousel|story_sequence|youtube|post",
      "pillar": "know|like|trust|conversion",
      "title": "Titre court",
      "hook": "Phrase d'accroche (3 premières secondes pour Reel/YouTube)",
      "script": "Script complet ou texte. Pour carousel: slide 1: ... | slide 2: ... Pour YouTube: intro, chapitre 1, chapitre 2... Pour story_sequence: story 1:... story 2:...",
      "hashtags": "#tag1 #tag2",
      "best_posting_time": "Mardi 12h",
      "duration": "30s|60s|10min (pour video)",
      "seo_title": "Titre SEO (YouTube uniquement)",
      "thumbnail_idea": "Idée de miniature (YouTube uniquement)",
      "chapters": "00:00 Intro | 02:00 Chapitre 1 | ... (YouTube uniquement)",
      "reasoning": "Pourquoi ce contenu maintenant",
      "based_on_performance": true,
      "addresses_objection": "objection ciblée ou null"
    }
  ]
}`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        else continue;
      }

      const contents = parsed.contents || [];
      let userCount = 0;

      for (const content of contents) {
        await supabase.from("content_library").insert({
          user_id: profile.id,
          content_type: content.type,
          pillar: content.pillar,
          title: content.title,
          hook: content.hook,
          content: content.script,
          hashtags: content.hashtags,
          best_posting_time: content.best_posting_time,
          reasoning: content.reasoning,
          source: content.addresses_objection
            ? "auto_objection"
            : "auto_weekly",
          based_on_performance: content.based_on_performance || false,
          status: "draft",
        });
        userCount++;
        totalGenerated++;
      }

      // Sauvegarder la stratégie d'adaptation
      if (parsed.adaptation_strategy) {
        await supabase.from("content_adaptations").insert({
          user_id: profile.id,
          strategy: parsed.adaptation_strategy,
          contents_generated: userCount,
          week_of: new Date().toISOString(),
        });
      }

      results.push({ userId: profile.id, count: userCount });
    } catch (err) {
      console.warn(`Content generation failed for user ${profile.id}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Contenu hebdomadaire généré : ${totalGenerated} pièces pour ${results.length} utilisateur(s).`,
    totalGenerated,
    results,
  });
}

// GET: Vercel CRON (hebdomadaire)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return await runContentGeneration();
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// POST: Manuel
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return await runContentGeneration();
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
