import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanById, resolvePlanId } from "@/lib/stripe/plans";

function startOfMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { userId } = await params;
    const monthStart = startOfMonth();
    const thirtyDaysAgo = daysAgo(30);

    const [
      { data: profile },
      { data: gensThisMonth },
      { data: gensAllTime },
      { data: recentGens },
      { data: gens30d },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, subscription_plan, subscription_status, created_at")
        .eq("id", userId)
        .single(),
      supabase
        .from("ai_generations")
        .select("generation_type, model, cost_usd, input_tokens, output_tokens, cached_tokens, is_cron, created_at")
        .eq("user_id", userId)
        .eq("is_cron", false)
        .gte("created_at", monthStart),
      supabase
        .from("ai_generations")
        .select("cost_usd")
        .eq("user_id", userId),
      supabase
        .from("ai_generations")
        .select("id, generation_type, model, input_tokens, output_tokens, cost_usd, cached_tokens, is_cron, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("ai_generations")
        .select("cost_usd, created_at")
        .eq("user_id", userId)
        .eq("is_cron", false)
        .gte("created_at", thirtyDaysAgo),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const planId = resolvePlanId(profile.subscription_plan || "free");
    const plan = getPlanById(planId);
    const limit = plan?.limits.aiGenerationsPerMonth || 10;

    const monthGens = gensThisMonth || [];
    const costThisMonth = monthGens.reduce((s, g) => s + (Number(g.cost_usd) || 0), 0);
    const costAllTime = (gensAllTime || []).reduce((s, g) => s + (Number(g.cost_usd) || 0), 0);

    // By type
    const typeMap = new Map<string, { count: number; cost: number }>();
    for (const g of monthGens) {
      if (!typeMap.has(g.generation_type)) typeMap.set(g.generation_type, { count: 0, cost: 0 });
      const e = typeMap.get(g.generation_type)!;
      e.count++;
      e.cost += Number(g.cost_usd) || 0;
    }

    // By model
    const modelMap = new Map<string, { count: number; cost: number }>();
    for (const g of monthGens) {
      const m = g.model || "sonnet";
      if (!modelMap.has(m)) modelMap.set(m, { count: 0, cost: 0 });
      const e = modelMap.get(m)!;
      e.count++;
      e.cost += Number(g.cost_usd) || 0;
    }

    // Daily usage
    const dailyMap = new Map<string, { count: number; cost: number }>();
    for (const g of gens30d || []) {
      const date = g.created_at.slice(0, 10);
      if (!dailyMap.has(date)) dailyMap.set(date, { count: 0, cost: 0 });
      const e = dailyMap.get(date)!;
      e.count++;
      e.cost += Number(g.cost_usd) || 0;
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        plan: planId,
        subscription_status: profile.subscription_status,
        created_at: profile.created_at,
      },
      usage: {
        generations_this_month: monthGens.length,
        limit,
        cost_this_month: Math.round(costThisMonth * 100) / 100,
        cost_all_time: Math.round(costAllTime * 100) / 100,
        avg_cost_per_generation: monthGens.length > 0
          ? Math.round((costThisMonth / monthGens.length) * 10000) / 10000
          : 0,
      },
      by_type: Array.from(typeMap.entries()).map(([type, d]) => ({
        type,
        count: d.count,
        cost: Math.round(d.cost * 100) / 100,
      })),
      by_model: Array.from(modelMap.entries()).map(([model, d]) => ({
        model,
        count: d.count,
        cost: Math.round(d.cost * 100) / 100,
      })),
      daily_usage: Array.from(dailyMap.entries())
        .map(([date, d]) => ({ date, count: d.count, cost: Math.round(d.cost * 100) / 100 }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recent_generations: (recentGens || []).map((g) => ({
        id: g.id,
        type: g.generation_type,
        model: g.model,
        input_tokens: g.input_tokens,
        output_tokens: g.output_tokens,
        cost_usd: Number(g.cost_usd) || 0,
        cached_tokens: g.cached_tokens,
        is_cron: g.is_cron,
        created_at: g.created_at,
      })),
    });
  } catch (error) {
    console.error("[admin/ai-costs/userId] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
