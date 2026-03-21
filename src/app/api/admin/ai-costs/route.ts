import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, getPlanById, resolvePlanId } from "@/lib/stripe/plans";
import { INFRA_COSTS, COST_ALERTS, usdToEur } from "@/lib/admin/cost-config";

// ─── Helpers ────────────────────────────────────────────────────────────────

function startOfMonth(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString();
}

function startOfLastMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString();
}

function endOfLastMonth(): string {
  return startOfMonth(); // first of current month = end of last month
}

function startOfWeek(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff)).toISOString();
}

function startOfToday(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function toDateStr(iso: string): string {
  return iso.slice(0, 10);
}

// ─── Admin verification ─────────────────────────────────────────────────────

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return null;
  return user;
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const monthStart = startOfMonth();
    const lastMonthStart = startOfLastMonth();
    const lastMonthEnd = endOfLastMonth();
    const weekStart = startOfWeek();
    const todayStart = startOfToday();
    const thirtyDaysAgo = daysAgo(30);
    const sevenDaysAgo = daysAgo(7);

    // ─── Parallel data fetching ─────────────────────────────────────
    const [
      { data: allGensThisMonth },
      { data: allGensLastMonth },
      { data: allGensWeek },
      { data: allGensToday },
      { data: allGens30d },
      { data: activeProfiles },
      { count: totalGens },
      { data: allGensAllTime },
    ] = await Promise.all([
      // This month generations
      supabase
        .from("ai_generations")
        .select("user_id, generation_type, model, input_tokens, output_tokens, cost_usd, cached_tokens, is_cron, created_at")
        .gte("created_at", monthStart),
      // Last month
      supabase
        .from("ai_generations")
        .select("cost_usd")
        .gte("created_at", lastMonthStart)
        .lt("created_at", lastMonthEnd),
      // This week
      supabase
        .from("ai_generations")
        .select("cost_usd")
        .gte("created_at", weekStart),
      // Today
      supabase
        .from("ai_generations")
        .select("cost_usd")
        .gte("created_at", todayStart),
      // 30 days (for daily trend)
      supabase
        .from("ai_generations")
        .select("user_id, cost_usd, created_at")
        .gte("created_at", thirtyDaysAgo),
      // Active profiles for MRR
      supabase
        .from("profiles")
        .select("id, full_name, email, subscription_plan, subscription_status"),
      // Total generations all time
      supabase
        .from("ai_generations")
        .select("*", { count: "exact", head: true }),
      // All time cost
      supabase
        .from("ai_generations")
        .select("cost_usd"),
    ]);

    const gens = allGensThisMonth || [];
    const lastMonthGens = allGensLastMonth || [];
    const weekGens = allGensWeek || [];
    const todayGens = allGensToday || [];
    const trend30d = allGens30d || [];
    const profiles = activeProfiles || [];

    // ─── Overview ───────────────────────────────────────────────────
    const sumCost = (arr: { cost_usd: number | null }[]) =>
      arr.reduce((sum, g) => sum + (Number(g.cost_usd) || 0), 0);

    const costThisMonth = sumCost(gens);
    const costLastMonth = sumCost(lastMonthGens);
    const costThisWeek = sumCost(weekGens);
    const costToday = sumCost(todayGens);
    const totalCost = sumCost(allGensAllTime || []);

    const activeUsersThisMonth = new Set(
      gens.filter((g) => !g.is_cron).map((g) => g.user_id),
    ).size;

    const monthOverMonth = costLastMonth > 0
      ? Math.round(((costThisMonth - costLastMonth) / costLastMonth) * 100)
      : 0;

    const overview = {
      total_cost_usd: Math.round(totalCost * 100) / 100,
      cost_this_month: Math.round(costThisMonth * 100) / 100,
      cost_last_month: Math.round(costLastMonth * 100) / 100,
      cost_this_week: Math.round(costThisWeek * 100) / 100,
      cost_today: Math.round(costToday * 100) / 100,
      total_generations: totalGens || 0,
      generations_this_month: gens.length,
      avg_cost_per_generation: gens.length > 0 ? Math.round((costThisMonth / gens.length) * 10000) / 10000 : 0,
      avg_cost_per_active_user: activeUsersThisMonth > 0 ? Math.round((costThisMonth / activeUsersThisMonth) * 100) / 100 : 0,
      month_over_month_change: monthOverMonth,
    };

    // ─── Profitability ──────────────────────────────────────────────
    const activeSubscribers = profiles.filter((p) => p.subscription_status === "active");

    const mrr = activeSubscribers.reduce((sum, p) => {
      const plan = getPlanById(resolvePlanId(p.subscription_plan || "free"));
      return sum + (plan?.price || 0);
    }, 0);

    // Cost per plan
    const planCostMap = new Map<string, { users: Set<string>; cost: number }>();
    for (const g of gens) {
      if (g.is_cron) continue;
      const userProfile = profiles.find((p) => p.id === g.user_id);
      const planId = resolvePlanId(userProfile?.subscription_plan || "free");
      if (!planCostMap.has(planId)) planCostMap.set(planId, { users: new Set(), cost: 0 });
      const entry = planCostMap.get(planId)!;
      entry.users.add(g.user_id);
      entry.cost += Number(g.cost_usd) || 0;
    }

    const costPerPlan = PLANS.map((plan) => {
      const entry = planCostMap.get(plan.id);
      const activeUsers = entry?.users.size || 0;
      const totalAiCost = entry?.cost || 0;
      const avgCostPerUser = activeUsers > 0 ? totalAiCost / activeUsers : 0;
      const marginPerUser = plan.price - usdToEur(avgCostPerUser);
      return {
        plan_id: plan.id,
        plan_name: plan.name,
        plan_price: plan.price,
        active_users: activeUsers,
        total_ai_cost: Math.round(totalAiCost * 100) / 100,
        avg_cost_per_user: Math.round(avgCostPerUser * 10000) / 10000,
        margin_per_user: Math.round(marginPerUser * 100) / 100,
        margin_percent: plan.price > 0 ? Math.round((marginPerUser / plan.price) * 100) : 0,
      };
    });

    const grossMargin = mrr > 0
      ? Math.round(((mrr - usdToEur(costThisMonth) - INFRA_COSTS.total) / mrr) * 100)
      : 0;

    const profitability = {
      mrr,
      ai_cost: Math.round(costThisMonth * 100) / 100,
      infra_cost_estimate: INFRA_COSTS.total,
      gross_margin: grossMargin,
      cost_per_plan: costPerPlan,
    };

    // ─── By model ───────────────────────────────────────────────────
    const modelMap = new Map<string, { count: number; cost: number; inputTokens: number; outputTokens: number; cachedTokens: number }>();
    for (const g of gens) {
      const m = g.model || "sonnet";
      if (!modelMap.has(m)) modelMap.set(m, { count: 0, cost: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0 });
      const entry = modelMap.get(m)!;
      entry.count++;
      entry.cost += Number(g.cost_usd) || 0;
      entry.inputTokens += g.input_tokens || 0;
      entry.outputTokens += g.output_tokens || 0;
      entry.cachedTokens += g.cached_tokens || 0;
    }

    const byModel = Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      generations: data.count,
      total_cost: Math.round(data.cost * 100) / 100,
      avg_cost: data.count > 0 ? Math.round((data.cost / data.count) * 10000) / 10000 : 0,
      total_input_tokens: data.inputTokens,
      total_output_tokens: data.outputTokens,
      total_cached_tokens: data.cachedTokens,
      cache_hit_rate: data.inputTokens > 0
        ? Math.round((data.cachedTokens / data.inputTokens) * 100)
        : 0,
    }));

    // ─── By type ────────────────────────────────────────────────────
    const typeMap = new Map<string, { count: number; cost: number; models: Map<string, number> }>();
    for (const g of gens) {
      const t = g.generation_type;
      if (!typeMap.has(t)) typeMap.set(t, { count: 0, cost: 0, models: new Map() });
      const entry = typeMap.get(t)!;
      entry.count++;
      entry.cost += Number(g.cost_usd) || 0;
      entry.models.set(g.model, (entry.models.get(g.model) || 0) + 1);
    }

    const byType = Array.from(typeMap.entries())
      .map(([type, data]) => {
        let topModel = "sonnet";
        let topCount = 0;
        for (const [m, c] of data.models) {
          if (c > topCount) { topModel = m; topCount = c; }
        }
        return {
          generation_type: type,
          generations: data.count,
          total_cost: Math.round(data.cost * 100) / 100,
          avg_cost: data.count > 0 ? Math.round((data.cost / data.count) * 10000) / 10000 : 0,
          model_used: topModel,
        };
      })
      .sort((a, b) => b.total_cost - a.total_cost);

    // ─── Cron vs User ───────────────────────────────────────────────
    const userGens = gens.filter((g) => !g.is_cron);
    const cronGens = gens.filter((g) => g.is_cron);
    const userCost = sumCost(userGens);
    const cronCost = sumCost(cronGens);

    const cronVsUser = {
      user_generations: userGens.length,
      user_cost: Math.round(userCost * 100) / 100,
      cron_generations: cronGens.length,
      cron_cost: Math.round(cronCost * 100) / 100,
      cron_cost_percent: costThisMonth > 0 ? Math.round((cronCost / costThisMonth) * 100) : 0,
    };

    // ─── Top users ──────────────────────────────────────────────────
    const userCostMap = new Map<string, { count: number; cost: number }>();
    for (const g of userGens) {
      if (!userCostMap.has(g.user_id)) userCostMap.set(g.user_id, { count: 0, cost: 0 });
      const entry = userCostMap.get(g.user_id)!;
      entry.count++;
      entry.cost += Number(g.cost_usd) || 0;
    }

    const topUsers = Array.from(userCostMap.entries())
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 20)
      .map(([userId, data]) => {
        const p = profiles.find((pr) => pr.id === userId);
        const planId = resolvePlanId(p?.subscription_plan || "free");
        const plan = getPlanById(planId);
        const limit = plan?.limits.aiGenerationsPerMonth || 10;
        return {
          user_id: userId,
          user_name: p?.full_name || "Inconnu",
          user_email: p?.email || "",
          plan: planId,
          generations_this_month: data.count,
          cost_this_month: Math.round(data.cost * 100) / 100,
          limit,
          usage_percent: Math.round((data.count / limit) * 100),
        };
      });

    // ─── Daily trend ────────────────────────────────────────────────
    const dailyMap = new Map<string, { count: number; cost: number; users: Set<string> }>();
    for (const g of trend30d) {
      const date = toDateStr(g.created_at);
      if (!dailyMap.has(date)) dailyMap.set(date, { count: 0, cost: 0, users: new Set() });
      const entry = dailyMap.get(date)!;
      entry.count++;
      entry.cost += Number(g.cost_usd) || 0;
      entry.users.add(g.user_id);
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        generations: data.count,
        cost: Math.round(data.cost * 100) / 100,
        active_users: data.users.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ─── Cost alerts ────────────────────────────────────────────────
    const costAlerts: { type: string; message: string; severity: string; data: Record<string, unknown> }[] = [];

    // Budget threshold
    const aiCostPercent = mrr > 0 ? (usdToEur(costThisMonth) / mrr) * 100 : 0;
    if (aiCostPercent > COST_ALERTS.maxAICostPercentOfMRR) {
      costAlerts.push({
        type: "budget_threshold",
        message: `Le coût IA représente ${Math.round(aiCostPercent)}% du MRR (seuil : ${COST_ALERTS.maxAICostPercentOfMRR}%)`,
        severity: aiCostPercent > 50 ? "critical" : "warning",
        data: { ai_cost_percent: Math.round(aiCostPercent), mrr },
      });
    }

    // Cost spike
    const last7dCosts = dailyTrend.slice(-8, -1);
    const avgDaily7d = last7dCosts.length > 0
      ? last7dCosts.reduce((s, d) => s + d.cost, 0) / last7dCosts.length
      : 0;
    if (avgDaily7d > 0 && costToday > avgDaily7d * COST_ALERTS.costSpikeMultiplier) {
      costAlerts.push({
        type: "cost_spike",
        message: `Coût aujourd'hui ($${costToday.toFixed(2)}) est ${Math.round(costToday / avgDaily7d)}x la moyenne 7j ($${avgDaily7d.toFixed(2)})`,
        severity: "warning",
        data: { cost_today: costToday, avg_7d: avgDaily7d },
      });
    }

    // High cost users
    for (const u of topUsers) {
      const plan = getPlanById(u.plan);
      if (!plan || plan.price === 0) continue;
      const costEur = usdToEur(u.cost_this_month);
      const costPercent = (costEur / plan.price) * 100;
      if (costPercent > COST_ALERTS.maxUserCostPercentOfPlan) {
        costAlerts.push({
          type: "high_cost_user",
          message: `${u.user_name} coûte ${costEur.toFixed(2)}€ (${Math.round(costPercent)}% de son plan ${plan.name} à ${plan.price}€)`,
          severity: costPercent > 100 ? "critical" : "warning",
          data: { user_id: u.user_id, cost_eur: costEur, plan_price: plan.price },
        });
      }
    }

    // Margin warnings
    for (const pp of costPerPlan) {
      if (pp.plan_price > 0 && pp.active_users > 0 && pp.margin_percent < COST_ALERTS.minMarginPercent) {
        costAlerts.push({
          type: "margin_warning",
          message: `Le plan ${pp.plan_name} a une marge de ${pp.margin_percent}% (seuil : ${COST_ALERTS.minMarginPercent}%)`,
          severity: pp.margin_percent < 20 ? "critical" : "warning",
          data: { plan_id: pp.plan_id, margin: pp.margin_percent },
        });
      }
    }

    return NextResponse.json({
      overview,
      profitability,
      by_model: byModel,
      by_type: byType,
      cron_vs_user: cronVsUser,
      top_users: topUsers,
      daily_trend: dailyTrend,
      cost_alerts: costAlerts,
    });
  } catch (error) {
    console.error("[admin/ai-costs] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
