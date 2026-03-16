import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Whitelabel Portal: Get shared org data for members ────────
// Returns: funnels, assets, analytics, reports from the org owner

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get user's org membership
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Pas membre d'une organisation" },
        { status: 404 },
      );
    }

    // Get org info
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 },
      );
    }

    // Get owner's data to share with members
    const ownerId = org.owner_id;

    // Fetch published funnels
    const { data: funnels } = await supabase
      .from("funnels")
      .select(
        "id, funnel_name, status, total_visits, total_optins, conversion_rate, created_at",
      )
      .eq("user_id", ownerId)
      .in("status", ["published", "active"])
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch validated assets
    const { data: assets } = await supabase
      .from("sales_assets")
      .select("id, asset_type, title, status, created_at")
      .eq("user_id", ownerId)
      .in("status", ["validated", "active"])
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch performance metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: metrics } = await supabase
      .from("daily_performance_metrics")
      .select("*")
      .eq("user_id", ownerId)
      .gte("date", thirtyDaysAgo.toISOString().slice(0, 10))
      .order("date", { ascending: true });

    // Fetch active ad campaigns
    const { data: campaigns } = await supabase
      .from("ad_campaigns")
      .select(
        "id, campaign_name, status, total_spend, total_clicks, total_conversions, roas, created_at",
      )
      .eq("user_id", ownerId)
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch brand identity
    const { data: brand } = await supabase
      .from("brand_identities")
      .select("selected_name, art_direction, brand_kit")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch content calendar (next 30 days)
    const { data: contentPieces } = await supabase
      .from("content_pieces")
      .select("id, content_type, title, scheduled_date, published")
      .eq("user_id", ownerId)
      .not("scheduled_date", "is", null)
      .order("scheduled_date", { ascending: true })
      .limit(30);

    // Aggregate metrics for summary
    const totalSpend = metrics?.reduce((s, m) => s + (m.spend || 0), 0) || 0;
    const totalLeads = metrics?.reduce((s, m) => s + (m.leads || 0), 0) || 0;
    const totalRevenue =
      metrics?.reduce((s, m) => s + (m.revenue || 0), 0) || 0;
    const totalClients =
      metrics?.reduce((s, m) => s + (m.clients || 0), 0) || 0;

    return NextResponse.json({
      organization: {
        name: org.brand_name || org.name,
        logo_url: org.logo_url,
        primary_color: org.primary_color,
        accent_color: org.accent_color,
      },
      role: membership.role,
      summary: {
        total_spend: totalSpend,
        total_leads: totalLeads,
        total_revenue: totalRevenue,
        total_clients: totalClients,
        active_funnels:
          funnels?.filter((f) => f.status === "published").length || 0,
        total_assets: assets?.length || 0,
        active_campaigns:
          campaigns?.filter((c) => c.status === "active").length || 0,
      },
      funnels: funnels || [],
      assets: assets || [],
      campaigns: campaigns || [],
      metrics: metrics || [],
      brand: brand || null,
      content: contentPieces || [],
    });
  } catch (err) {
    console.error("[whitelabel/portal] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement du portail" },
      { status: 500 },
    );
  }
}
