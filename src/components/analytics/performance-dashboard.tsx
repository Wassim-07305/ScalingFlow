"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Plus,
  ArrowRight,
  Eye,
  MousePointerClick,
  Trash2,
  RefreshCw,
  Download,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
export interface DailyMetric {
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  calls: number;
  clients: number;
  revenue: number;
}

interface KPI {
  label: string;
  value: string;
  trend: number; // percentage
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
}

// ─── Supabase helpers ────────────────────────────────────────
async function loadMetricsFromDB(userId: string): Promise<DailyMetric[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_performance_metrics")
    .select("date, spend, impressions, clicks, leads, calls, clients, revenue")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (!data || data.length === 0) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row: any) => ({
    date:
      typeof row.date === "string"
        ? row.date
        : new Date(row.date).toISOString().split("T")[0],
    spend: Number(row.spend),
    impressions: row.impressions,
    clicks: row.clicks,
    leads: row.leads,
    calls: row.calls,
    clients: row.clients,
    revenue: Number(row.revenue),
  }));
}

async function upsertMetricToDB(userId: string, metric: DailyMetric) {
  const supabase = createClient();
  await supabase.from("daily_performance_metrics").upsert(
    {
      user_id: userId,
      date: metric.date,
      spend: metric.spend,
      impressions: metric.impressions,
      clicks: metric.clicks,
      leads: metric.leads,
      calls: metric.calls,
      clients: metric.clients,
      revenue: metric.revenue,
    },
    { onConflict: "user_id,date" },
  );
}

async function clearMetricsFromDB(userId: string) {
  const supabase = createClient();
  await supabase
    .from("daily_performance_metrics")
    .delete()
    .eq("user_id", userId);
}

function exportMetricsToCSV(metrics: DailyMetric[]) {
  const headers =
    "Date,Dépense,Impressions,Clics,Leads,Appels,Clients,Revenu,CPL,CPA,ROAS\n";
  const rows = metrics
    .map((m) => {
      const cpl = m.leads > 0 ? (m.spend / m.leads).toFixed(2) : "0";
      const cpa = m.clients > 0 ? (m.spend / m.clients).toFixed(2) : "0";
      const roas = m.spend > 0 ? (m.revenue / m.spend).toFixed(2) : "0";
      return `${m.date},${m.spend},${m.impressions},${m.clicks},${m.leads},${m.calls},${m.clients},${m.revenue},${cpl},${cpa},${roas}`;
    })
    .join("\n");
  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scalingflow-metrics-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Formatting helpers ──────────────────────────────────────
function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function fmtPercent(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

// ─── Main component ──────────────────────────────────────────
export function PerformanceDashboard() {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DailyMetric>({
    date: format(new Date(), "yyyy-MM-dd"),
    spend: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
    calls: 0,
    clients: 0,
    revenue: 0,
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load metrics on mount + auto-refresh every 5 min
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await loadMetricsFromDB(user.id);
      setMetrics(rows);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // auto-refresh 5 min
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSaveMetric = useCallback(async () => {
    if (!user) return;
    const updated = [
      ...metrics.filter((m) => m.date !== formData.date),
      formData,
    ].sort((a, b) => a.date.localeCompare(b.date));
    setMetrics(updated);
    await upsertMetricToDB(user.id, formData);
    setShowForm(false);
    toast.success("Données enregistrées");
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      spend: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      calls: 0,
      clients: 0,
      revenue: 0,
    });
  }, [user, metrics, formData]);

  const handleClearData = useCallback(async () => {
    if (!user) return;
    await clearMetricsFromDB(user.id);
    setMetrics([]);
    toast.success("Données réinitialisées");
  }, [user]);

  // Sync Meta Ads data then reload
  const handleSyncMeta = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/meta/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la synchronisation Meta");
        return;
      }
      toast.success(data.message || "Synchronisation terminée");
      await loadData();
    } catch {
      toast.error("Impossible de contacter le serveur");
    } finally {
      setSyncing(false);
    }
  }, [loadData]);

  // ─── KPIs aggregation ───────────────────────────────────────
  const kpis = useMemo<KPI[]>(() => {
    if (metrics.length === 0) return [];

    const totals = metrics.reduce(
      (acc, m) => ({
        spend: acc.spend + m.spend,
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        leads: acc.leads + m.leads,
        calls: acc.calls + m.calls,
        clients: acc.clients + m.clients,
        revenue: acc.revenue + m.revenue,
      }),
      {
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        calls: 0,
        clients: 0,
        revenue: 0,
      },
    );

    // Compare first half to second half for trends
    const mid = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, mid);
    const secondHalf = metrics.slice(mid);

    const sum = (arr: DailyMetric[], key: keyof DailyMetric) =>
      arr.reduce((s, m) => s + (m[key] as number), 0);

    const trendPct = (key: keyof DailyMetric) => {
      const first = sum(firstHalf, key) || 1;
      const second = sum(secondHalf, key);
      return ((second - first) / first) * 100;
    };

    const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
    const cpa = totals.clients > 0 ? totals.spend / totals.clients : 0;
    const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

    return [
      {
        label: "Dépense totale",
        value: fmtCurrency(totals.spend),
        trend: trendPct("spend"),
        icon: DollarSign,
      },
      {
        label: "Leads",
        value: fmtNumber(totals.leads),
        trend: trendPct("leads"),
        icon: Users,
      },
      {
        label: "CPL",
        value: fmtCurrency(cpl),
        trend: -trendPct("leads") + trendPct("spend"),
        icon: Target,
      },
      {
        label: "Revenu",
        value: fmtCurrency(totals.revenue),
        trend: trendPct("revenue"),
        icon: DollarSign,
      },
      {
        label: "CPA",
        value: fmtCurrency(cpa),
        trend: -trendPct("clients") + trendPct("spend"),
        icon: Target,
      },
      {
        label: "ROAS",
        value: `${roas.toFixed(2)}x`,
        trend: trendPct("revenue") - trendPct("spend"),
        icon: TrendingUp,
      },
    ];
  }, [metrics]);

  // ─── Chart data ─────────────────────────────────────────────
  const chartData = useMemo(() => {
    return metrics.map((m) => ({
      date: format(parseISO(m.date), "dd MMM", { locale: fr }),
      Revenu: m.revenue,
      Dépense: m.spend,
    }));
  }, [metrics]);

  // ─── Funnel data ────────────────────────────────────────────
  const funnel = useMemo(() => {
    const totals = metrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        leads: acc.leads + m.leads,
        calls: acc.calls + m.calls,
        clients: acc.clients + m.clients,
      }),
      { impressions: 0, clicks: 0, leads: 0, calls: 0, clients: 0 },
    );

    const ctr =
      totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const clickToLead =
      totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0;
    const leadToCall =
      totals.leads > 0 ? (totals.calls / totals.leads) * 100 : 0;
    const callToClient =
      totals.calls > 0 ? (totals.clients / totals.calls) * 100 : 0;

    return [
      {
        label: "Impressions",
        value: totals.impressions,
        rate: null,
        icon: Eye,
      },
      {
        label: "Clics",
        value: totals.clicks,
        rate: ctr,
        icon: MousePointerClick,
      },
      { label: "Leads", value: totals.leads, rate: clickToLead, icon: Users },
      { label: "Appels", value: totals.calls, rate: leadToCall, icon: Target },
      {
        label: "Clients",
        value: totals.clients,
        rate: callToClient,
        icon: DollarSign,
      },
    ];
  }, [metrics]);

  // ─── Campaign breakdown (simulated per-week buckets) ───────
  const campaigns = useMemo(() => {
    if (metrics.length === 0) return [];
    // Group by week for a campaign-like view
    const weeks: Record<string, DailyMetric[]> = {};
    metrics.forEach((m) => {
      const d = parseISO(m.date);
      const weekStart = format(subDays(d, d.getDay()), "dd MMM", {
        locale: fr,
      });
      if (!weeks[weekStart]) weeks[weekStart] = [];
      weeks[weekStart].push(m);
    });

    return Object.entries(weeks).map(([week, days]) => {
      const spend = days.reduce((s, d) => s + d.spend, 0);
      const leads = days.reduce((s, d) => s + d.leads, 0);
      const revenue = days.reduce((s, d) => s + d.revenue, 0);
      const clients = days.reduce((s, d) => s + d.clients, 0);
      return {
        name: `Semaine du ${week}`,
        spend,
        leads,
        cpl: leads > 0 ? spend / leads : 0,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        clients,
      };
    });
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {metrics.length > 0 && (
            <span className="text-[10px] text-text-muted">
              MAJ : {format(lastRefresh, "HH:mm", { locale: fr })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSyncMeta}
            disabled={syncing}
            title="Synchroniser Meta Ads"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          {metrics.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportMetricsToCSV(metrics)}
                title="Exporter CSV"
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearData}>
                <Trash2 className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            </>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter données
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && metrics.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-text-secondary text-sm">
              Chargement des données...
            </p>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && metrics.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-bg-tertiary/80 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-text-muted" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-text-primary">
                Aucune donnée disponible
              </h3>
              <p className="text-text-secondary text-sm max-w-md">
                Connectez Meta Ads dans les Paramètres pour voir vos données en
                temps réel, ou ajoutez vos métriques manuellement.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSyncMeta}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Synchroniser Meta
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter données
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi, idx) => (
            <Card
              key={kpi.label}
              className="group relative overflow-hidden p-4 transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-xs font-medium">
                    {kpi.label}
                  </span>
                  <div className="h-8 w-8 rounded-lg bg-bg-tertiary/80 flex items-center justify-center">
                    <kpi.icon className="h-4 w-4 text-text-muted" />
                  </div>
                </div>
                <div className="text-xl font-bold text-text-primary">
                  {kpi.value}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-accent" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      kpi.trend >= 0 ? "text-accent" : "text-danger",
                    )}
                  >
                    {fmtPercent(kpi.trend)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {metrics.length > 0 && (
        <>
          {/* Revenue vs Spend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenu vs Dépense publicitaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorRevenu"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#34D399"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#34D399"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorDépense"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#F59E0B"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#F59E0B"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#6B7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#6B7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v} \u20AC`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#141719",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        color: "#F9FAFB",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        padding: "12px 16px",
                      }}
                      labelStyle={{
                        color: "#9CA3AF",
                        fontSize: 11,
                        marginBottom: 4,
                      }}
                      itemStyle={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "2px 0",
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [
                        `${Number(value).toLocaleString("fr-FR")} \u20AC`,
                        undefined,
                      ]}
                      cursor={{
                        stroke: "rgba(52,211,153,0.2)",
                        strokeWidth: 1,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 8 }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-text-secondary text-xs ml-1">
                          {value}
                        </span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="Revenu"
                      stroke="#34D399"
                      fillOpacity={1}
                      fill="url(#colorRevenu)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Dépense"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#colorDépense)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Funnel de conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {funnel.map((step, idx) => {
                  const funnelColors = [
                    {
                      bg: "bg-info/12",
                      text: "text-info",
                      ring: "ring-info/20",
                    },
                    {
                      bg: "bg-accent/12",
                      text: "text-accent",
                      ring: "ring-accent/20",
                    },
                    {
                      bg: "bg-warning/12",
                      text: "text-warning",
                      ring: "ring-warning/20",
                    },
                    {
                      bg: "bg-[rgba(139,92,246,0.12)]",
                      text: "text-[#A78BFA]",
                      ring: "ring-[rgba(139,92,246,0.2)]",
                    },
                    {
                      bg: "bg-accent/20",
                      text: "text-accent",
                      ring: "ring-accent/30",
                    },
                  ];
                  const c = funnelColors[idx];
                  return (
                    <React.Fragment key={step.label}>
                      <div className="flex flex-col items-center min-w-[100px] group">
                        <div
                          className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ring-1 transition-all duration-300 group-hover:scale-105",
                            c.bg,
                            c.ring,
                          )}
                        >
                          <step.icon className={cn("h-6 w-6", c.text)} />
                        </div>
                        <span className="text-text-secondary text-xs font-medium">
                          {step.label}
                        </span>
                        <span className="text-text-primary text-lg font-bold">
                          {fmtNumber(step.value)}
                        </span>
                        {step.rate !== null && (
                          <Badge variant="muted" className="mt-1 text-[10px]">
                            {step.rate.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      {idx < funnel.length - 1 && (
                        <div className="flex flex-col items-center shrink-0 gap-0.5">
                          <ArrowRight className="h-4 w-4 text-text-muted/60" />
                          {funnel[idx + 1].rate !== null && (
                            <span className="text-[9px] text-text-muted/50 font-medium">
                              {funnel[idx + 1].rate!.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance par période</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left text-text-secondary font-medium py-3 px-2">
                        Période
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Dépense
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Leads
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        CPL
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Revenu
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        ROAS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr
                        key={c.name}
                        className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium text-text-primary">
                          {c.name}
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {fmtCurrency(c.spend)}
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {c.leads}
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {fmtCurrency(c.cpl)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-text-primary">
                          {fmtCurrency(c.revenue)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge
                            variant={
                              c.roas >= 3
                                ? "default"
                                : c.roas >= 2
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {c.roas.toFixed(2)}x
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Data Input Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter des métriques quotidiennes</DialogTitle>
            <DialogDescription>
              Saisis tes données publicitaires du jour. Les KPI seront calculés
              automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="metric-date">Date</Label>
              <Input
                id="metric-date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="metric-spend">Dépense (EUR)</Label>
              <Input
                id="metric-spend"
                type="number"
                min={0}
                step={0.01}
                value={formData.spend || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    spend: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="metric-impressions">Impressions</Label>
              <Input
                id="metric-impressions"
                type="number"
                min={0}
                value={formData.impressions || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    impressions: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="metric-clicks">Clics</Label>
              <Input
                id="metric-clicks"
                type="number"
                min={0}
                value={formData.clicks || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    clicks: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="metric-leads">Leads</Label>
              <Input
                id="metric-leads"
                type="number"
                min={0}
                value={formData.leads || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    leads: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="metric-calls">Appels</Label>
              <Input
                id="metric-calls"
                type="number"
                min={0}
                value={formData.calls || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    calls: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="metric-clients">Clients</Label>
              <Input
                id="metric-clients"
                type="number"
                min={0}
                value={formData.clients || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    clients: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="metric-revenue">Revenu (EUR)</Label>
              <Input
                id="metric-revenue"
                type="number"
                min={0}
                step={0.01}
                value={formData.revenue || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    revenue: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveMetric}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export type for use in optimization
export type { DailyMetric as AnalyticsDailyMetric };
