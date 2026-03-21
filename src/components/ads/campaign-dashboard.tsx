"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import {
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Loader2,
  Megaphone,
  Link as LinkIcon,
  Lock,
  Users,
  Target,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface AdCampaign {
  id: string;
  campaign_name: string;
  status: "draft" | "active" | "paused" | "completed";
  daily_budget: number | null;
  total_budget: number | null;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  roas: number;
  attributed_revenue?: number;
}

function getStatusLabel(status: AdCampaign["status"]): string {
  switch (status) {
    case "active":
      return "Actif";
    case "paused":
      return "Pause";
    case "draft":
      return "Brouillon";
    case "completed":
      return "Terminé";
  }
}

function getStatusVariant(
  status: AdCampaign["status"],
): "cyan" | "muted" | "yellow" | "default" {
  switch (status) {
    case "active":
      return "cyan";
    case "paused":
      return "muted";
    case "draft":
      return "yellow";
    case "completed":
      return "default";
  }
}

interface CampaignDashboardProps {
  className?: string;
}

export function CampaignDashboard({ className }: CampaignDashboardProps) {
  const { user, loading: userLoading } = useUser();
  const [campaigns, setCampaigns] = React.useState<AdCampaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [metaConnected, setMetaConnected] = React.useState(false);
  const supabase = useMemo(() => createClient(), []);

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCampaigns = async () => {
      setLoading(true);

      // Check if Meta is connected
      const { data: profile } = await supabase
        .from("profiles")
        .select("meta_access_token")
        .eq("id", user.id)
        .maybeSingle();
      setMetaConnected(!!profile?.meta_access_token);

      const [{ data, error }, { data: attributions }] = await Promise.all([
        supabase
          .from("ad_campaigns")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payment_attributions")
          .select("utm_campaign, amount")
          .eq("user_id", user.id),
      ]);

      if (error) {
        toast.error("Impossible de charger les campagnes");
        setLoading(false);
        return;
      }

      // Aggregate attributed revenue by utm_campaign name
      const revenueByUTMCampaign = new Map<string, number>();
      for (const attr of attributions ?? []) {
        if (attr.utm_campaign) {
          revenueByUTMCampaign.set(
            attr.utm_campaign,
            (revenueByUTMCampaign.get(attr.utm_campaign) ?? 0) + (attr.amount ?? 0),
          );
        }
      }

      // Match campaigns by name (case-insensitive) to utm_campaign
      const enriched = (data ?? []).map((c: (typeof data)[number]) => ({
        ...c,
        attributed_revenue:
          revenueByUTMCampaign.get(c.campaign_name) ??
          revenueByUTMCampaign.get(c.campaign_name?.toLowerCase()) ??
          0,
      }));

      setCampaigns(enriched);
      setLoading(false);
    };

    fetchCampaigns();
  }, [user, userLoading, supabase]);

  if (loading || userLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      </div>
    );
  }

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/meta/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      toast.success("Campagnes synchronisées depuis Meta");
      // Re-fetch campaigns
      const { data } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      setCampaigns(data ?? []);
    } catch {
      toast.error("Erreur lors de la synchronisation Meta");
    } finally {
      setSyncing(false);
    }
  };

  // ─── Mode Simulation (no real campaigns) ───
  const isSimulation = campaigns.length === 0;

  const MOCK_CAMPAIGNS: AdCampaign[] = [
    {
      id: "sim-1",
      campaign_name: "Coaching Business — Cold Audience",
      status: "active",
      daily_budget: 50,
      total_budget: 1500,
      total_spend: 847,
      total_impressions: 124300,
      total_clicks: 2486,
      total_conversions: 47,
      roas: 3.2,
    },
    {
      id: "sim-2",
      campaign_name: "Retargeting — Visiteurs site web",
      status: "active",
      daily_budget: 30,
      total_budget: 900,
      total_spend: 412,
      total_impressions: 38200,
      total_clicks: 1147,
      total_conversions: 31,
      roas: 4.8,
    },
    {
      id: "sim-3",
      campaign_name: "Lookalike — Clients existants",
      status: "paused",
      daily_budget: 40,
      total_budget: 1200,
      total_spend: 623,
      total_impressions: 89400,
      total_clicks: 1788,
      total_conversions: 22,
      roas: 2.1,
    },
  ];

  const displayCampaigns = isSimulation ? MOCK_CAMPAIGNS : campaigns;

  const totalSpent = displayCampaigns.reduce((s, c) => s + c.total_spend, 0);
  const totalConversions = displayCampaigns.reduce(
    (s, c) => s + c.total_conversions,
    0,
  );
  const totalClicks = displayCampaigns.reduce((s, c) => s + c.total_clicks, 0);
  const totalImpressions = displayCampaigns.reduce(
    (s, c) => s + c.total_impressions,
    0,
  );
  const avgCPM =
    totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
  const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgCPL = totalConversions > 0 ? totalSpent / totalConversions : 0;
  const avgROAS =
    totalSpent > 0
      ? displayCampaigns.reduce((s, c) => s + c.roas * c.total_spend, 0) /
        totalSpent
      : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Simulation banner or sync button */}
      {isSimulation && !metaConnected && (
        <div className="flex items-center justify-between rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
              <Eye className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Mode simulation
              </p>
              <p className="text-xs text-text-muted">
                Les données ci-dessous sont simulées. Connecte ton compte Meta pour voir tes vraies performances.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => window.location.href = "/api/integrations/meta/connect"}>
            <LinkIcon className="h-3.5 w-3.5" />
            Connecter Meta
          </Button>
        </div>
      )}
      {metaConnected && (
        <div className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
              <Megaphone className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Meta Ads connecté
              </p>
              <p className="text-xs text-text-muted">
                {isSimulation ? "Synchronise tes campagnes pour voir tes vraies performances." : `${campaigns.length} campagne${campaigns.length > 1 ? "s" : ""} importée${campaigns.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            {syncing ? "Synchronisation..." : "Synchroniser"}
          </Button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label: "Dépense totale",
            value: `${totalSpent.toLocaleString("fr-FR")} €`,
            icon: DollarSign,
            color: "text-accent",
          },
          {
            label: "CPM",
            value: `${avgCPM.toFixed(2)} €`,
            icon: Eye,
            color: "text-info",
          },
          {
            label: "CPC",
            value: `${avgCPC.toFixed(2)} €`,
            icon: MousePointer,
            color: "text-violet-400",
          },
          {
            label: "CPL",
            value: `${avgCPL.toFixed(2)} €`,
            icon: Target,
            color: "text-cyan-400",
          },
          {
            label: "ROAS",
            value: `${avgROAS.toFixed(1)}x`,
            icon: TrendingUp,
            color: "text-emerald-400",
          },
          {
            label: "Reach",
            value: totalImpressions.toLocaleString("fr-FR"),
            icon: Users,
            color: "text-blue-400",
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-text-muted">{kpi.label}</p>
                  <p className={cn("text-lg font-bold", kpi.color)}>
                    {kpi.value}
                  </p>
                </div>
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campagnes {isSimulation ? "(simulées)" : ""}</CardTitle>
            {isSimulation && (
              <Badge variant="muted" className="text-[10px] gap-1">
                <Lock className="h-3 w-3" />
                Données de démonstration
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayCampaigns.map((campaign) => {
              const budget =
                campaign.total_budget ?? campaign.daily_budget ?? 0;
              const ctr =
                campaign.total_clicks > 0 && campaign.total_impressions > 0
                  ? (campaign.total_clicks / campaign.total_impressions) * 100
                  : 0;
              const cpa =
                campaign.total_conversions > 0
                  ? campaign.total_spend / campaign.total_conversions
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary border border-border-default"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusVariant(campaign.status)}>
                      {getStatusLabel(campaign.status)}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {campaign.campaign_name}
                      </p>
                      <p className="text-xs text-text-muted">
                        Budget: {budget}€ &middot; Dépense:{" "}
                        {campaign.total_spend}€
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-text-muted">CTR</p>
                      <p className="text-sm font-medium text-info">
                        {ctr.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">CPA</p>
                      <p className="text-sm font-medium text-accent">
                        {cpa.toFixed(2)}€
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Conv.</p>
                      <p className="text-sm font-medium text-accent">
                        {campaign.total_conversions}
                      </p>
                    </div>
                    {!isSimulation && (
                      <div>
                        <p className="text-xs text-text-muted">Rev. attribué</p>
                        <p className="text-sm font-medium text-emerald-400">
                          {campaign.attributed_revenue
                            ? `${campaign.attributed_revenue.toFixed(2)}€`
                            : "—"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
