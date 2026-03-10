"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { EmptyState } from "@/components/shared/empty-state";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  BarChart3,
  Loader2,
  Target,
  Zap,
  RefreshCw,
} from "lucide-react";

interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgRoas: number;
  avgCtr: number;
  avgCpa: number;
  avgCpm: number;
  campaignCount: number;
  creativeCount: number;
}

export default function AnalyticsPage() {
  const { user, profile, loading: userLoading } = useUser();
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const hasMetaConfig = !!(profile?.meta_access_token && profile?.meta_ad_account_id);

  const handleSyncMeta = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/meta/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur de synchronisation");
      } else {
        toast.success(data.message || "Synchronisation reussie");
        // Recharger les metriques
        window.location.reload();
      }
    } catch {
      toast.error("Erreur lors de la synchronisation Meta Ads");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (userLoading || !user) return;

    const fetchMetrics = async () => {
      const supabase = createClient();

      const [campaignsRes, creativesRes] = await Promise.all([
        supabase
          .from("ad_campaigns")
          .select("total_spend, total_impressions, total_clicks, total_conversions, roas")
          .eq("user_id", user.id),
        supabase
          .from("ad_creatives")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const campaigns = campaignsRes.data ?? [];
      const creativeCount = creativesRes.count ?? 0;

      if (campaigns.length === 0) {
        setMetrics(null);
        setLoading(false);
        return;
      }

      const totalSpend = campaigns.reduce((s, c) => s + (c.total_spend ?? 0), 0);
      const totalImpressions = campaigns.reduce((s, c) => s + (c.total_impressions ?? 0), 0);
      const totalClicks = campaigns.reduce((s, c) => s + (c.total_clicks ?? 0), 0);
      const totalConversions = campaigns.reduce((s, c) => s + (c.total_conversions ?? 0), 0);

      const avgRoas = campaigns.length > 0
        ? campaigns.reduce((s, c) => s + (c.roas ?? 0), 0) / campaigns.length
        : 0;
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
      const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

      setMetrics({
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        avgRoas,
        avgCtr,
        avgCpa,
        avgCpm,
        campaignCount: campaigns.length,
        creativeCount,
      });
      setLoading(false);
    };

    fetchMetrics();
  }, [user, userLoading]);

  if (loading || userLoading) {
    return (
      <div>
        <PageHeader title="Analytics Ads" description="Analyse les performances de tes publicites." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div>
        <PageHeader title="Analytics Ads" description="Analyse les performances de tes publicites." />
        <EmptyState
          icon={BarChart3}
          title="Aucune donnee publicitaire"
          description="Cree des campagnes et des creatives pour voir tes analytics ici."
        />
      </div>
    );
  }

  const KPI_CARDS = [
    { label: "ROAS moyen", value: metrics.avgRoas, decimals: 1, suffix: "x", icon: TrendingUp, color: "text-accent" },
    { label: "CPA moyen", value: metrics.avgCpa, decimals: 2, suffix: " €", icon: DollarSign, color: "text-accent" },
    { label: "CTR moyen", value: metrics.avgCtr, decimals: 1, suffix: "%", icon: MousePointer, color: "text-info" },
    { label: "CPM moyen", value: metrics.avgCpm, decimals: 2, suffix: " €", icon: Eye, color: "text-accent" },
  ];

  return (
    <div>
      <PageHeader title="Analytics Ads" description="Analyse les performances de tes publicites.">
        {hasMetaConfig && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSyncMeta}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sync..." : "Sync Meta Ads"}
          </Button>
        )}
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-muted">{kpi.label}</p>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-text-primary">
                <AnimatedCounter value={kpi.value} />
                {kpi.suffix}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Totaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total depense</p>
                <p className="text-lg font-bold text-text-primary">
                  <AnimatedCounter value={metrics.totalSpend} /> €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center">
                <Eye className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Impressions</p>
                <p className="text-lg font-bold text-text-primary">
                  <AnimatedCounter value={metrics.totalImpressions} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Conversions</p>
                <p className="text-lg font-bold text-text-primary">
                  <AnimatedCounter value={metrics.totalConversions} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Campagnes / Creatives</p>
                <p className="text-lg font-bold text-text-primary">
                  {metrics.campaignCount} / {metrics.creativeCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta Ads sync status */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronisation Meta Ads</CardTitle>
        </CardHeader>
        <CardContent>
          {hasMetaConfig ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Ton compte Meta Ads est connecte. Clique sur &ldquo;Sync Meta Ads&rdquo; pour importer tes dernieres donnees.
              </p>
              <Button
                size="sm"
                onClick={handleSyncMeta}
                disabled={syncing}
                className="gap-2 shrink-0 ml-4"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                Synchroniser
              </Button>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              Connecte ton compte Meta Ads dans les{" "}
              <a href="/settings" className="text-accent hover:underline">parametres</a>{" "}
              pour synchroniser tes donnees publicitaires et voir tes performances reelles.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
