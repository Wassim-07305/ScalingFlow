import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, getPlanById, resolvePlanId } from "@/lib/stripe/plans";
import { INFRA_COSTS, usdToEur } from "@/lib/admin/cost-config";
import { monthlyAIReportEmail } from "@/lib/resend/templates";

/**
 * POST /api/cron/monthly-ai-report
 * Runs on the 1st of each month to aggregate and archive AI costs.
 * Sends a summary email to all admins.
 */
export async function POST() {
  try {
    const supabase = createAdminClient();

    // Last month boundaries
    const now = new Date();
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthLabel = `${lastMonthStart.getUTCFullYear()}-${String(lastMonthStart.getUTCMonth() + 1).padStart(2, "0")}`;

    // Fetch all generations from last month
    const { data: gens } = await supabase
      .from("ai_generations")
      .select("user_id, generation_type, model, cost_usd, is_cron, created_at")
      .gte("created_at", lastMonthStart.toISOString())
      .lt("created_at", lastMonthEnd.toISOString());

    const generations = gens || [];
    const userGens = generations.filter((g) => !g.is_cron);
    const totalCost = generations.reduce((s, g) => s + (Number(g.cost_usd) || 0), 0);

    // Active users
    const activeUserIds = new Set(userGens.map((g) => g.user_id));

    // MRR from active profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, subscription_plan, subscription_status");

    const activeProfiles = (profiles || []).filter((p) => p.subscription_status === "active");
    const mrr = activeProfiles.reduce((s, p) => {
      const plan = getPlanById(resolvePlanId(p.subscription_plan || "free"));
      return s + (plan?.price || 0);
    }, 0);

    const aiCostEur = usdToEur(totalCost);
    const grossMargin = mrr > 0
      ? Math.round(((mrr - aiCostEur - INFRA_COSTS.total) / mrr) * 100)
      : 0;

    // Previous month for comparison
    const prevMonthStart = new Date(Date.UTC(lastMonthStart.getUTCFullYear(), lastMonthStart.getUTCMonth() - 1, 1));
    const { data: prevGens } = await supabase
      .from("ai_generations")
      .select("cost_usd")
      .gte("created_at", prevMonthStart.toISOString())
      .lt("created_at", lastMonthStart.toISOString());

    const prevCost = (prevGens || []).reduce((s, g) => s + (Number(g.cost_usd) || 0), 0);
    const vsLastMonth = prevCost > 0
      ? Math.round(((totalCost - prevCost) / prevCost) * 100)
      : 0;

    // Top 5 users by cost
    const userCostMap = new Map<string, { cost: number; count: number }>();
    for (const g of userGens) {
      if (!userCostMap.has(g.user_id)) userCostMap.set(g.user_id, { cost: 0, count: 0 });
      const e = userCostMap.get(g.user_id)!;
      e.cost += Number(g.cost_usd) || 0;
      e.count++;
    }

    const topUsers = Array.from(userCostMap.entries())
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 5)
      .map(([uid, data]) => {
        const p = (profiles || []).find((pr) => pr.id === uid);
        return {
          name: p?.full_name || "Inconnu",
          plan: resolvePlanId(p?.subscription_plan || "free"),
          cost: Math.round(data.cost * 100) / 100,
          generations: data.count,
        };
      });

    // Alerts
    const alerts: { message: string; severity: string }[] = [];
    const aiPercent = mrr > 0 ? (aiCostEur / mrr) * 100 : 0;
    if (aiPercent > 30) {
      alerts.push({
        message: `Coût IA = ${Math.round(aiPercent)}% du MRR`,
        severity: aiPercent > 50 ? "critical" : "warning",
      });
    }
    if (grossMargin < 50) {
      alerts.push({
        message: `Marge brute de ${grossMargin}% (< 50%)`,
        severity: grossMargin < 20 ? "critical" : "warning",
      });
    }

    // Store report
    const reportData = {
      month: monthLabel,
      mrr,
      aiCostUsd: Math.round(totalCost * 100) / 100,
      aiCostEur: Math.round(aiCostEur * 100) / 100,
      grossMargin,
      totalGenerations: generations.length,
      activeUsers: activeUserIds.size,
      topUsers,
      alerts,
      vsLastMonth,
    };

    await supabase
      .from("monthly_reports")
      .upsert({ report_month: monthLabel, report_data: reportData }, { onConflict: "report_month" });

    // Send email to admins
    try {
      const { resend } = await import("@/lib/resend/client");
      if (resend) {
        const { data: admins } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", "admin");

        const email = monthlyAIReportEmail(reportData);

        for (const admin of admins || []) {
          if (admin.email) {
            await resend.emails
              .send({
                from: "ScalingFlow <noreply@scalingflow.com>",
                to: admin.email,
                subject: email.subject,
                html: email.html,
              })
              .catch(() => {});
          }
        }
      }
    } catch {
      // email failure non-blocking
    }

    return NextResponse.json({ ok: true, month: monthLabel, report: reportData });
  } catch (error) {
    console.error("[cron/monthly-ai-report] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
