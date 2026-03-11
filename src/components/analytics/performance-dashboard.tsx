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

// ─── Demo data ───────────────────────────────────────────────
const DEMO_DATA: DailyMetric[] = [
  { date: "2026-02-19", spend: 150, impressions: 15000, clicks: 225, leads: 12, calls: 4, clients: 1, revenue: 997 },
  { date: "2026-02-20", spend: 175, impressions: 17500, clicks: 280, leads: 15, calls: 5, clients: 2, revenue: 1994 },
  { date: "2026-02-21", spend: 160, impressions: 16200, clicks: 259, leads: 14, calls: 4, clients: 1, revenue: 997 },
  { date: "2026-02-22", spend: 200, impressions: 20000, clicks: 340, leads: 18, calls: 6, clients: 2, revenue: 2497 },
  { date: "2026-02-23", spend: 180, impressions: 18500, clicks: 296, leads: 16, calls: 5, clients: 2, revenue: 1994 },
  { date: "2026-02-24", spend: 120, impressions: 12000, clicks: 180, leads: 9, calls: 3, clients: 1, revenue: 997 },
  { date: "2026-02-25", spend: 190, impressions: 19000, clicks: 323, leads: 17, calls: 6, clients: 2, revenue: 2497 },
  { date: "2026-02-26", spend: 210, impressions: 21000, clicks: 357, leads: 19, calls: 7, clients: 3, revenue: 2994 },
  { date: "2026-02-27", spend: 195, impressions: 19500, clicks: 312, leads: 16, calls: 5, clients: 2, revenue: 1994 },
  { date: "2026-02-28", spend: 220, impressions: 22000, clicks: 374, leads: 20, calls: 7, clients: 3, revenue: 3491 },
  { date: "2026-03-01", spend: 230, impressions: 23000, clicks: 391, leads: 22, calls: 8, clients: 3, revenue: 3491 },
  { date: "2026-03-02", spend: 215, impressions: 21500, clicks: 365, leads: 19, calls: 6, clients: 2, revenue: 2497 },
  { date: "2026-03-03", spend: 240, impressions: 24000, clicks: 408, leads: 23, calls: 8, clients: 3, revenue: 3491 },
  { date: "2026-03-04", spend: 250, impressions: 25000, clicks: 425, leads: 24, calls: 9, clients: 4, revenue: 3988 },
];

// ─── localStorage helpers ────────────────────────────────────
function getStorageKey(userId: string) {
  return `sf_analytics_metrics_${userId}`;
}

function loadMetrics(userId: string): DailyMetric[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) return JSON.parse(raw) as DailyMetric[];
  } catch {
    // ignore
  }
  return [];
}

function saveMetrics(userId: string, metrics: DailyMetric[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(metrics));
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
  const [isDemo, setIsDemo] = useState(true);
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
  const loadData = useCallback(() => {
    if (!user) return;
    const stored = loadMetrics(user.id);
    if (stored.length > 0) {
      setMetrics(stored);
      setIsDemo(false);
    } else {
      setMetrics(DEMO_DATA);
      setIsDemo(true);
    }
    setLastRefresh(new Date());
  }, [user]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // auto-refresh 5 min
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSaveMetric = useCallback(() => {
    if (!user) return;
    const updated = [...metrics.filter((m) => m.date !== formData.date), formData].sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    // If switching from demo, start fresh with only real data
    const finalMetrics = isDemo ? [formData] : updated;
    setMetrics(finalMetrics);
    setIsDemo(false);
    saveMetrics(user.id, finalMetrics);
    setShowForm(false);
    toast.success("Donnees enregistrees");
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
  }, [user, metrics, formData, isDemo]);

  const handleClearData = useCallback(() => {
    if (!user) return;
    localStorage.removeItem(getStorageKey(user.id));
    setMetrics(DEMO_DATA);
    setIsDemo(true);
    toast.success("Donnees reinitialisees");
  }, [user]);

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
      { spend: 0, impressions: 0, clicks: 0, leads: 0, calls: 0, clients: 0, revenue: 0 }
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
      { label: "Depense totale", value: fmtCurrency(totals.spend), trend: trendPct("spend"), icon: DollarSign },
      { label: "Leads", value: fmtNumber(totals.leads), trend: trendPct("leads"), icon: Users },
      { label: "CPL", value: fmtCurrency(cpl), trend: -trendPct("leads") + trendPct("spend"), icon: Target },
      { label: "Revenu", value: fmtCurrency(totals.revenue), trend: trendPct("revenue"), icon: DollarSign },
      { label: "CPA", value: fmtCurrency(cpa), trend: -trendPct("clients") + trendPct("spend"), icon: Target },
      { label: "ROAS", value: `${roas.toFixed(2)}x`, trend: trendPct("revenue") - trendPct("spend"), icon: TrendingUp },
    ];
  }, [metrics]);

  // ─── Chart data ─────────────────────────────────────────────
  const chartData = useMemo(() => {
    return metrics.map((m) => ({
      date: format(parseISO(m.date), "dd MMM", { locale: fr }),
      Revenu: m.revenue,
      Depense: m.spend,
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
      { impressions: 0, clicks: 0, leads: 0, calls: 0, clients: 0 }
    );

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const clickToLead = totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0;
    const leadToCall = totals.leads > 0 ? (totals.calls / totals.leads) * 100 : 0;
    const callToClient = totals.calls > 0 ? (totals.clients / totals.calls) * 100 : 0;

    return [
      { label: "Impressions", value: totals.impressions, rate: null, icon: Eye },
      { label: "Clics", value: totals.clicks, rate: ctr, icon: MousePointerClick },
      { label: "Leads", value: totals.leads, rate: clickToLead, icon: Users },
      { label: "Appels", value: totals.calls, rate: leadToCall, icon: Target },
      { label: "Clients", value: totals.clients, rate: callToClient, icon: DollarSign },
    ];
  }, [metrics]);

  // ─── Campaign breakdown (simulated per-week buckets) ───────
  const campaigns = useMemo(() => {
    if (metrics.length === 0) return [];
    // Group by week for a campaign-like view
    const weeks: Record<string, DailyMetric[]> = {};
    metrics.forEach((m) => {
      const d = parseISO(m.date);
      const weekStart = format(subDays(d, d.getDay()), "dd MMM", { locale: fr });
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
          {isDemo && (
            <Badge variant="yellow">Donnees de demonstration</Badge>
          )}
          <span className="text-[10px] text-text-muted">
            MAJ : {format(lastRefresh, "HH:mm", { locale: fr })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadData} title="Rafraichir">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {!isDemo && (
            <Button variant="ghost" size="sm" onClick={handleClearData}>
              <Trash2 className="h-4 w-4 mr-1" />
              Reinitialiser
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter donnees
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs font-medium">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-text-muted" />
            </div>
            <div className="text-xl font-bold text-text-primary">{kpi.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {kpi.trend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-accent" />
              ) : (
                <TrendingDown className="h-3 w-3 text-danger" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  kpi.trend >= 0 ? "text-accent" : "text-danger"
                )}
              >
                {fmtPercent(kpi.trend)}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue vs Spend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenu vs Depense publicitaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDepense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" />
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
                  tickFormatter={(v: number) => `${v}EUR`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141719",
                    border: "1px solid #2A2D31",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
                <Legend />
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
                  dataKey="Depense"
                  stroke="#F59E0B"
                  fillOpacity={1}
                  fill="url(#colorDepense)"
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
            {funnel.map((step, idx) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center min-w-[100px]">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center mb-2",
                      idx === 0 && "bg-info/12",
                      idx === 1 && "bg-accent-muted",
                      idx === 2 && "bg-warning/12",
                      idx === 3 && "bg-[rgba(139,92,246,0.12)]",
                      idx === 4 && "bg-accent/20"
                    )}
                  >
                    <step.icon
                      className={cn(
                        "h-6 w-6",
                        idx === 0 && "text-info",
                        idx === 1 && "text-accent",
                        idx === 2 && "text-warning",
                        idx === 3 && "text-[#A78BFA]",
                        idx === 4 && "text-accent"
                      )}
                    />
                  </div>
                  <span className="text-text-secondary text-xs font-medium">{step.label}</span>
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
                  <ArrowRight className="h-5 w-5 text-text-muted shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left text-text-secondary font-medium py-3 px-2">Periode</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Depense</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Leads</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">CPL</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Revenu</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.name} className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors">
                    <td className="py-3 px-2 font-medium text-text-primary">{c.name}</td>
                    <td className="py-3 px-2 text-right text-text-secondary">{fmtCurrency(c.spend)}</td>
                    <td className="py-3 px-2 text-right text-text-secondary">{c.leads}</td>
                    <td className="py-3 px-2 text-right text-text-secondary">{fmtCurrency(c.cpl)}</td>
                    <td className="py-3 px-2 text-right font-medium text-text-primary">{fmtCurrency(c.revenue)}</td>
                    <td className="py-3 px-2 text-right">
                      <Badge variant={c.roas >= 3 ? "default" : c.roas >= 2 ? "yellow" : "red"}>
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

      {/* Data Input Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter des metriques quotidiennes</DialogTitle>
            <DialogDescription>
              Saisissez vos donnees publicitaires du jour. Les KPI seront calcules automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="metric-date">Date</Label>
              <Input
                id="metric-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="metric-spend">Depense (EUR)</Label>
              <Input
                id="metric-spend"
                type="number"
                min={0}
                step={0.01}
                value={formData.spend || ""}
                onChange={(e) => setFormData((p) => ({ ...p, spend: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="metric-impressions">Impressions</Label>
              <Input
                id="metric-impressions"
                type="number"
                min={0}
                value={formData.impressions || ""}
                onChange={(e) => setFormData((p) => ({ ...p, impressions: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="metric-clicks">Clics</Label>
              <Input
                id="metric-clicks"
                type="number"
                min={0}
                value={formData.clicks || ""}
                onChange={(e) => setFormData((p) => ({ ...p, clicks: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="metric-leads">Leads</Label>
              <Input
                id="metric-leads"
                type="number"
                min={0}
                value={formData.leads || ""}
                onChange={(e) => setFormData((p) => ({ ...p, leads: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="metric-calls">Appels</Label>
              <Input
                id="metric-calls"
                type="number"
                min={0}
                value={formData.calls || ""}
                onChange={(e) => setFormData((p) => ({ ...p, calls: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="metric-clients">Clients</Label>
              <Input
                id="metric-clients"
                type="number"
                min={0}
                value={formData.clients || ""}
                onChange={(e) => setFormData((p) => ({ ...p, clients: parseInt(e.target.value) || 0 }))}
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
                onChange={(e) => setFormData((p) => ({ ...p, revenue: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveMetric}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export type for use in optimization
export type { DailyMetric as AnalyticsDailyMetric };
