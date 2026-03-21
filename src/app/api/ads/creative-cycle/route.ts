import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

// ─── F71 Cycle créatif auto ──────────────────────────────────
// CRON hebdomadaire : analyse les créatives winners → génère de nouvelles variantes
// basées sur les patterns gagnants (hooks, angles, formats)

const anthropic = new Anthropic();

async function getAdminClient() {
  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createAdmin(url, serviceKey);
}

async function runCreativeCycle() {
  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Configuration manquante" },
      { status: 500 },
    );
  }

  // Récupérer les utilisateurs actifs avec des campagnes
  const { data: users } = await supabase
    .from("ad_campaigns")
    .select("user_id")
    .gte(
      "created_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  const uniqueUserIds = [
    ...new Set((users ?? []).map((u) => u.user_id as string)),
  ];
  let totalGenerated = 0;

  for (const userId of uniqueUserIds) {
    // Récupérer les créatives winners (ROAS > 1.5 ou CTR top 20%)
    const { data: campaigns } = await supabase
      .from("ad_campaigns")
      .select(
        "id, campaign_name, roas, ctr, daily_budget, ad_copy, hook, angle, audience_type",
      )
      .eq("user_id", userId)
      .gte("roas", 1.5)
      .order("roas", { ascending: false })
      .limit(10);

    if (!campaigns || campaigns.length === 0) continue;

    // Récupérer le profil pour le contexte IA
    const { data: profile } = await supabase
      .from("profiles")
      .select("niche, offer_name, target_audience")
      .eq("id", userId)
      .maybeSingle();

    // Analyser les patterns winners
    const winnerPatterns = campaigns.map((c) => ({
      name: c.campaign_name,
      roas: c.roas,
      ctr: c.ctr,
      hook: c.hook || "N/A",
      angle: c.angle || "N/A",
      audience: c.audience_type || "cold",
      copy: (c.ad_copy as string)?.slice(0, 200) || "",
    }));

    // Générer de nouvelles créatives basées sur les patterns
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: `Tu es un expert en publicité Meta Ads. Tu analyses les créatives gagnantes et tu génères de nouvelles variantes basées sur les patterns identifiés.

CONTEXTE BUSINESS :
- Niche : ${profile?.niche || "Non spécifié"}
- Offre : ${profile?.offer_name || "Non spécifié"}
- Cible : ${profile?.target_audience || "Non spécifié"}

Retourne EXACTEMENT un JSON valide sans markdown.`,
        messages: [
          {
            role: "user",
            content: `Voici les ${winnerPatterns.length} créatives les plus performantes de cette semaine :

${JSON.stringify(winnerPatterns, null, 2)}

Génère 5 nouvelles variantes créatives basées sur les patterns gagnants.
Pour chaque variante, identifie :
1. Le pattern winner répliqué
2. La nouvelle variation apportée
3. Le hook (phrase d'accroche)
4. L'angle (résultat, process, preuve, urgence, transformation)
5. L'audience cible (cold, warm, hot)
6. Le copy complet (150-250 caractères)
7. Le CTA

Format JSON :
{
  "analysis": {
    "top_patterns": ["pattern1", "pattern2"],
    "best_hooks_style": "description",
    "best_angles": ["angle1", "angle2"],
    "recommendation": "recommandation globale"
  },
  "new_creatives": [
    {
      "name": "Nom créative",
      "based_on_winner": "nom du winner",
      "variation": "ce qui change",
      "hook": "phrase d'accroche",
      "angle": "angle",
      "audience": "cold|warm|hot",
      "copy": "texte publicitaire complet",
      "cta": "CTA"
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
        // Essayer d'extraire le JSON du texte
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          continue;
        }
      }

      // Sauvegarder les nouvelles créatives
      const newCreatives = parsed.new_creatives || [];
      for (const creative of newCreatives) {
        await supabase.from("ad_creatives").insert({
          user_id: userId,
          creative_name: creative.name,
          hook: creative.hook,
          angle: creative.angle,
          audience_type: creative.audience,
          ad_copy: creative.copy,
          cta: creative.cta,
          source: "auto_cycle",
          based_on_winner: creative.based_on_winner,
          variation_description: creative.variation,
          status: "draft",
        });
        totalGenerated++;
      }

      // Sauvegarder l'analyse
      await supabase.from("ad_decisions").insert({
        user_id: userId,
        decision_type: "creative_cycle",
        reason: `Cycle créatif auto : ${newCreatives.length} nouvelles variantes générées à partir de ${campaigns.length} winners`,
        details: JSON.stringify(parsed.analysis),
        status: "applied",
        applied_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`Creative cycle failed for user ${userId}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Cycle créatif terminé : ${totalGenerated} nouvelles créatives générées pour ${uniqueUserIds.length} utilisateur(s).`,
    totalGenerated,
    usersProcessed: uniqueUserIds.length,
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

    return await runCreativeCycle();
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// POST: Manuel depuis le dashboard
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return await runCreativeCycle();
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
