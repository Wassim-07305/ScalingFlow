import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { awardXP } from "@/lib/gamification/xp-engine";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { metrics } = await req.json();

    const prompt = `Tu es un expert en optimisation de campagnes publicitaires Meta Ads et en growth marketing.

## Metriques actuelles
${JSON.stringify(metrics, null, 2)}

## Ta mission
Analyse ces metriques et fournis des recommandations d'optimisation actionnables, classees par priorite et impact attendu.

Pour chaque metrique, compare avec les benchmarks suivants :
- CPM : 5-15 EUR (bon), 15-30 EUR (moyen), >30 EUR (eleve)
- CTR : >2% (bon), 1-2% (moyen), <1% (faible)
- CPC : <1 EUR (bon), 1-3 EUR (moyen), >3 EUR (eleve)
- CPL : <15 EUR (excellent), 15-30 EUR (bon), 30-50 EUR (moyen), >50 EUR (eleve)
- ROAS : >5x (excellent), 3-5x (bon), 2-3x (moyen), <2x (a optimiser)
- Taux lead-to-call : >30% (excellent), 20-30% (bon), <20% (a ameliorer)
- Taux call-to-client : >30% (excellent), 20-30% (bon), <20% (a ameliorer)

## Format de reponse
Reponds UNIQUEMENT en JSON valide :
{
  "overall_health": "Bon | Moyen | Critique",
  "health_score": 72,
  "summary": "Resume de la situation en 2-3 phrases",
  "recommendations": [
    {
      "title": "Titre de la recommandation",
      "description": "Description detaillee",
      "category": "Creatives | Audiences | Budget | Funnel | Pricing",
      "priority": "Haute | Moyenne | Basse",
      "expected_impact": "+20% ROAS estime",
      "action_steps": ["Étape 1", "Étape 2"],
      "metric_to_watch": "ROAS"
    }
  ],
  "quick_wins": ["Action rapide 1", "Action rapide 2"],
  "warnings": ["Alerte si applicable"]
}

Génère entre 4 et 8 recommandations, triées par impact décroissant. Sois concret et actionnable.`;

    const result = await generateJSON({
      prompt,
      maxTokens: 4096,
    });

    try {
      await awardXP(user.id, "generation.ads");
    } catch {
      // XP award is non-critical
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Optimize ads error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'optimisation" },
      { status: 500 },
    );
  }
}
