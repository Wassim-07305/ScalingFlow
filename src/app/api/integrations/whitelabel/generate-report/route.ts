import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── F79 — Whitelabel PDF Report Generation ──────────────────
// Génère un rapport hebdomadaire ou mensuel avec branding personnalisé

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { type } = await req.json();

    if (!type || !["weekly", "monthly", "campaign"].includes(type)) {
      return NextResponse.json(
        { error: "Type de rapport invalide (weekly, monthly, campaign)" },
        { status: 400 },
      );
    }

    // Déterminer la période
    const now = new Date();
    const periodDays = type === "weekly" ? 7 : type === "monthly" ? 30 : 14;
    const periodStart = new Date(
      now.getTime() - periodDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Récupérer le branding de l'org (si whitelabel)
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select(
        "organization_id, organizations(name, brand_name, logo_url, primary_color)",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const org = orgMember?.organizations as unknown as {
      name: string;
      brand_name?: string;
      logo_url?: string;
      primary_color?: string;
    } | null;

    const brandName = org?.brand_name || org?.name || "ScalingFlow";

    // Agréger les métriques de la période
    const [revenueResult, leadsResult, callsResult, contentResult, adsResult] =
      await Promise.all([
        // Revenus
        supabase
          .from("revenue_entries")
          .select("amount, source, created_at")
          .eq("user_id", user.id)
          .gte("created_at", periodStart),
        // Leads
        supabase
          .from("leads")
          .select("id, source, status, created_at")
          .eq("user_id", user.id)
          .gte("created_at", periodStart),
        // Appels de vente
        supabase
          .from("sales_call_logs")
          .select("id, call_result, revenue_generated, created_at")
          .eq("user_id", user.id)
          .gte("created_at", periodStart),
        // Contenu généré
        supabase
          .from("content_library")
          .select("id, content_type, engagement_score, created_at")
          .eq("user_id", user.id)
          .gte("created_at", periodStart),
        // Ads performance
        supabase
          .from("ad_creatives")
          .select("id, impressions, clicks, spend, conversions, ctr, status")
          .eq("user_id", user.id),
      ]);

    const revenues = revenueResult.data ?? [];
    const leads = leadsResult.data ?? [];
    const calls = callsResult.data ?? [];
    const contents = contentResult.data ?? [];
    const ads = adsResult.data ?? [];

    const totalRevenue = revenues.reduce(
      (s, r) => s + ((r.amount as number) || 0),
      0,
    );
    const totalLeads = leads.length;
    const totalCalls = calls.length;
    const closedCalls = calls.filter((c) => c.call_result === "closing").length;
    const callRevenue = calls.reduce(
      (s, c) => s + ((c.revenue_generated as number) || 0),
      0,
    );
    const conversionRate =
      totalCalls > 0 ? Math.round((closedCalls / totalCalls) * 100) : 0;
    const totalContent = contents.length;
    const avgEngagement =
      contents.length > 0
        ? contents.reduce(
            (s, c) => s + ((c.engagement_score as number) || 0),
            0,
          ) / contents.length
        : 0;
    const totalSpend = ads.reduce((s, a) => s + ((a.spend as number) || 0), 0);
    const totalImpressions = ads.reduce(
      (s, a) => s + ((a.impressions as number) || 0),
      0,
    );
    const totalClicks = ads.reduce(
      (s, a) => s + ((a.clicks as number) || 0),
      0,
    );
    const avgCTR =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const reportData = {
      period: {
        type,
        start: periodStart,
        end: now.toISOString(),
        days: periodDays,
      },
      branding: {
        brand_name: brandName,
        logo_url: org?.logo_url || null,
        primary_color: org?.primary_color || "#34D399",
      },
      summary: {
        total_revenue: totalRevenue,
        total_leads: totalLeads,
        total_calls: totalCalls,
        conversion_rate: conversionRate,
        call_revenue: callRevenue,
        total_content_pieces: totalContent,
        avg_engagement_score: Math.round(avgEngagement * 10) / 10,
      },
      ads_performance: {
        total_spend: totalSpend,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        avg_ctr: Math.round(avgCTR * 100) / 100,
        active_creatives: ads.filter((a) => a.status === "active").length,
      },
      content_breakdown: {
        reels: contents.filter((c) => c.content_type === "reel").length,
        carousels: contents.filter((c) => c.content_type === "carousel").length,
        stories: contents.filter((c) => c.content_type === "story_sequence")
          .length,
        youtube: contents.filter((c) => c.content_type === "youtube").length,
        posts: contents.filter((c) => c.content_type === "post").length,
      },
      revenue_sources: revenues.reduce(
        (acc, r) => {
          const source = (r.source as string) || "other";
          acc[source] = (acc[source] || 0) + ((r.amount as number) || 0);
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    // Sauvegarder le rapport
    await supabase.from("whitelabel_reports").insert({
      user_id: user.id,
      organization_id: orgMember?.organization_id || null,
      title: `Rapport ${type === "weekly" ? "hebdomadaire" : type === "monthly" ? "mensuel" : "campagne"} — ${brandName}`,
      type,
      data: reportData,
    });

    return NextResponse.json({
      success: true,
      report: reportData,
    });
  } catch (error) {
    console.error("[whitelabel/generate-report] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport" },
      { status: 500 },
    );
  }
}
