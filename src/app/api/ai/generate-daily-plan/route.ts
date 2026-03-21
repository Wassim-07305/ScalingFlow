import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration } from "@/lib/ai/model-router";
import Anthropic from "@anthropic-ai/sdk";

// ─── F83 Roadmap personnalisée — Générateur de plan quotidien IA ───
// Génère 3-5 actions/jour basées sur le profil, la progression, et les données business

const anthropic = new Anthropic();

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const date = body.date || new Date().toISOString().split("T")[0];

    // Collecter le contexte utilisateur
    const [
      profileRes,
      offersRes,
      funnelsRes,
      campaignsRes,
      contentRes,
      callsRes,
      milestonesRes,
      alertsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "niche, offer_name, target_audience, xp_points, level, streak_days, onboarding_completed, revenue_target",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("funnels")
        .select("id, status", { count: "exact" })
        .eq("user_id", user.id),
      supabase
        .from("ad_campaigns")
        .select("id, roas, status", { count: "exact" })
        .eq("user_id", user.id),
      supabase
        .from("content_library")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ),
      supabase
        .from("sales_call_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_milestones")
        .select("milestone_id, completed")
        .eq("user_id", user.id),
      supabase
        .from("smart_alerts")
        .select("alert_type, title, severity")
        .eq("user_id", user.id)
        .eq("read", false)
        .limit(5),
    ]);

    const profile = profileRes.data;
    const completedMilestones = (milestonesRes.data ?? []).filter(
      (m) => m.completed,
    ).length;
    const activeAlerts = alertsRes.data ?? [];
    const publishedFunnels = (funnelsRes.data ?? []).filter(
      (f) => (f as Record<string, unknown>).status === "published",
    ).length;
    const activeCampaigns = (campaignsRes.data ?? []).filter(
      (c) => (c as Record<string, unknown>).status === "active",
    ).length;

    const context = {
      niche: profile?.niche || "Non défini",
      offer: profile?.offer_name || "Pas encore d'offre",
      audience: profile?.target_audience || "Non défini",
      level: profile?.level ?? 1,
      xp: profile?.xp_points ?? 0,
      streak: profile?.streak_days ?? 0,
      revenueTarget: profile?.revenue_target || "5000",
      offers: offersRes.count ?? 0,
      funnels: (funnelsRes.data ?? []).length,
      publishedFunnels,
      campaigns: (campaignsRes.data ?? []).length,
      activeCampaigns,
      weeklyContent: contentRes.count ?? 0,
      calls: callsRes.count ?? 0,
      milestonesCompleted: completedMilestones,
      totalMilestones: 8,
      alerts: activeAlerts.map((a) => `${a.severity}: ${a.title}`),
    };

    const aiModel = getModelForGeneration("daily_plan");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `Tu es le coach IA de ScalingFlow. Tu génères un plan d'action quotidien personnalisé de 3-5 actions basé sur la situation actuelle de l'utilisateur.

PRINCIPES :
- Chaque action doit être réalisable en 5-20 minutes
- Priorise les actions qui débloquent le prochain palier
- Si l'utilisateur a des alertes actives, adresse-les en priorité
- Adapte la difficulté au niveau de l'utilisateur
- Le message de motivation doit être personnalisé et encourageant

Retourne EXACTEMENT un JSON valide sans markdown.`,
      messages: [
        {
          role: "user",
          content: `Contexte utilisateur :
${JSON.stringify(context, null, 2)}

Date : ${date}

Génère le plan du jour au format JSON :
{
  "motivation_message": "Message motivant personnalisé (1-2 phrases)",
  "focus_theme": "Thème du jour (ex: Optimisation, Création, Prospection)",
  "actions": [
    {
      "title": "Titre action courte",
      "description": "Description concrète avec détails",
      "duration_minutes": 15,
      "priority": "high|medium|low",
      "category": "Analytics|Créatives|Contenu|Prospection|Funnel|Offre|Vente",
      "action_url": "/analytics|/ads|/content|/sales|/funnel|/offer|/market",
      "xp_reward": 10
    }
  ],
  "total_xp": 80
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
      else {
        return NextResponse.json(
          { error: "Erreur de parsing IA" },
          { status: 500 },
        );
      }
    }

    // Ajouter des IDs aux actions
    const actions = (parsed.actions || []).map(
      (a: Record<string, unknown>, i: number) => ({
        ...a,
        id: `action-${date}-${i}`,
        completed: false,
      }),
    );

    const plan = {
      date,
      motivation_message: parsed.motivation_message || "",
      focus_theme: parsed.focus_theme || "",
      actions,
      total_xp:
        parsed.total_xp ||
        actions.reduce(
          (s: number, a: { xp_reward?: number }) => s + (a.xp_reward || 10),
          0,
        ),
    };

    // Sauvegarder le plan
    const { data: savedPlan } = await supabase
      .from("daily_plans")
      .upsert(
        {
          user_id: user.id,
          date,
          motivation_message: plan.motivation_message,
          focus_theme: plan.focus_theme,
          actions: plan.actions,
          total_xp: plan.total_xp,
        },
        { onConflict: "user_id,date" },
      )
      .select()
      .maybeSingle();

    incrementAIUsage(user.id, { generationType: "daily_plan", model: aiModel }).catch(() => {});

    return NextResponse.json({
      success: true,
      plan: { ...plan, id: savedPlan?.id },
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
