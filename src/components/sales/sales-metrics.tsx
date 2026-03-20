"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import {
  DollarSign,
  Clock,
  Target,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  Megaphone,
  TrendingUp,
  Route,
  Star,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { format, parseISO, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
interface CallLog {
  id: string;
  date: string; // YYYY-MM-DD
  duration: number; // minutes
  outcome: "closing" | "no-show" | "objection" | "rappel";
  revenue: number; // 0 if not closed
  objection: string;
  lead_source: string;
  campaign_name: string;
  creative_name: string;
}

const OUTCOMES = [
  { value: "closing", label: "Closing (vente)" },
  { value: "no-show", label: "No-show" },
  { value: "objection", label: "Objection" },
  { value: "rappel", label: "Rappel prévu" },
];

const LEAD_SOURCES = [
  { value: "", label: "Non spécifié" },
  { value: "Meta Ads", label: "Meta Ads" },
  { value: "Instagram Organique", label: "Instagram Organique" },
  { value: "YouTube", label: "YouTube" },
  { value: "Referral", label: "Referral" },
  { value: "DM Prospection", label: "DM Prospection" },
  { value: "Webinaire", label: "Webinaire" },
  { value: "Autre", label: "Autre" },
];

const COMMON_OBJECTIONS = [
  "Trop cher",
  "Pas le bon moment",
  "Besoin de réfléchir",
  "Doit en parler à quelqu'un",
  "Pas convaincu des résultats",
  "Déjà un prestataire",
  "Pas de budget",
  "Autre",
];

const SOURCE_COLORS: Record<string, string> = {
  "Meta Ads": "#3B82F6",
  "Instagram Organique": "#E879F9",
  YouTube: "#EF4444",
  Referral: "#34D399",
  "DM Prospection": "#F59E0B",
  Webinaire: "#8B5CF6",
  Autre: "#6B7280",
  "Non spécifié": "#374151",
};

// ─── localStorage helpers ────────────────────────────────────
const STORAGE_KEY = "scalingflow_call_logs";

function loadCallLogs(): CallLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migration: add source fields to old logs
    return parsed.map((l: Record<string, unknown>) => ({
      lead_source: "",
      campaign_name: "",
      creative_name: "",
      ...l,
    }));
  } catch {
    return [];
  }
}

function saveCallLogs(logs: CallLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

// ─── Demo data ───────────────────────────────────────────────
const DEMO_LOGS: CallLog[] = [
  {
    id: "c1",
    date: "2026-03-01",
    duration: 45,
    outcome: "closing",
    revenue: 2497,
    objection: "",
    lead_source: "Meta Ads",
    campaign_name: "Scale Mars 2026",
    creative_name: "Témoignage client",
  },
  {
    id: "c2",
    date: "2026-03-01",
    duration: 30,
    outcome: "objection",
    revenue: 0,
    objection: "Trop cher",
    lead_source: "Meta Ads",
    campaign_name: "Scale Mars 2026",
    creative_name: "Hook douleur",
  },
  {
    id: "c3",
    date: "2026-03-02",
    duration: 0,
    outcome: "no-show",
    revenue: 0,
    objection: "",
    lead_source: "Instagram Organique",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c4",
    date: "2026-03-03",
    duration: 50,
    outcome: "closing",
    revenue: 1997,
    objection: "",
    lead_source: "YouTube",
    campaign_name: "",
    creative_name: "VSL longue",
  },
  {
    id: "c5",
    date: "2026-03-03",
    duration: 35,
    outcome: "objection",
    revenue: 0,
    objection: "Besoin de réfléchir",
    lead_source: "DM Prospection",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c6",
    date: "2026-03-04",
    duration: 25,
    outcome: "objection",
    revenue: 0,
    objection: "Trop cher",
    lead_source: "Meta Ads",
    campaign_name: "Scale Mars 2026",
    creative_name: "Carrousel",
  },
  {
    id: "c7",
    date: "2026-03-04",
    duration: 40,
    outcome: "closing",
    revenue: 2497,
    objection: "",
    lead_source: "Referral",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c8",
    date: "2026-03-05",
    duration: 0,
    outcome: "no-show",
    revenue: 0,
    objection: "",
    lead_source: "Webinaire",
    campaign_name: "Webinar Scaling",
    creative_name: "",
  },
  {
    id: "c9",
    date: "2026-03-05",
    duration: 55,
    outcome: "closing",
    revenue: 2997,
    objection: "",
    lead_source: "Meta Ads",
    campaign_name: "Retargeting",
    creative_name: "Urgence",
  },
  {
    id: "c10",
    date: "2026-03-06",
    duration: 30,
    outcome: "objection",
    revenue: 0,
    objection: "Pas le bon moment",
    lead_source: "Instagram Organique",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c11",
    date: "2026-03-07",
    duration: 45,
    outcome: "closing",
    revenue: 1997,
    objection: "",
    lead_source: "DM Prospection",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c12",
    date: "2026-03-07",
    duration: 35,
    outcome: "objection",
    revenue: 0,
    objection: "Trop cher",
    lead_source: "Meta Ads",
    campaign_name: "Scale Mars 2026",
    creative_name: "Hook douleur",
  },
  {
    id: "c13",
    date: "2026-03-08",
    duration: 20,
    outcome: "rappel",
    revenue: 0,
    objection: "Doit en parler à quelqu'un",
    lead_source: "YouTube",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c14",
    date: "2026-03-09",
    duration: 50,
    outcome: "closing",
    revenue: 2497,
    objection: "",
    lead_source: "Webinaire",
    campaign_name: "Webinar Scaling",
    creative_name: "",
  },
  {
    id: "c15",
    date: "2026-03-10",
    duration: 40,
    outcome: "objection",
    revenue: 0,
    objection: "Besoin de réfléchir",
    lead_source: "Meta Ads",
    campaign_name: "Retargeting",
    creative_name: "Témoignage",
  },
  {
    id: "c16",
    date: "2026-03-10",
    duration: 45,
    outcome: "closing",
    revenue: 1997,
    objection: "",
    lead_source: "Referral",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c17",
    date: "2026-03-11",
    duration: 30,
    outcome: "objection",
    revenue: 0,
    objection: "Pas de budget",
    lead_source: "Instagram Organique",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c18",
    date: "2026-03-12",
    duration: 55,
    outcome: "closing",
    revenue: 2997,
    objection: "",
    lead_source: "Meta Ads",
    campaign_name: "Scale Mars 2026",
    creative_name: "Carrousel",
  },
  {
    id: "c19",
    date: "2026-03-13",
    duration: 0,
    outcome: "no-show",
    revenue: 0,
    objection: "",
    lead_source: "DM Prospection",
    campaign_name: "",
    creative_name: "",
  },
  {
    id: "c20",
    date: "2026-03-14",
    duration: 45,
    outcome: "closing",
    revenue: 2497,
    objection: "",
    lead_source: "Meta Ads",
    campaign_name: "Retargeting",
    creative_name: "Urgence",
  },
];

// ─── Formatting helpers ──────────────────────────────────────
function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Main component ──────────────────────────────────────────
export function SalesMetrics() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "sources">(
    "overview",
  );
  const [formData, setFormData] = useState<Omit<CallLog, "id">>({
    date: format(new Date(), "yyyy-MM-dd"),
    duration: 0,
    outcome: "closing",
    revenue: 0,
    objection: "",
    lead_source: "",
    campaign_name: "",
    creative_name: "",
  });

  useEffect(() => {
    const stored = loadCallLogs();
    if (stored.length > 0) {
      setLogs(stored);
      setIsDemo(false);
    } else {
      setLogs(DEMO_LOGS);
      setIsDemo(true);
    }
  }, []);

  // ─── Aggregated metrics ────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = logs.length;
    const closings = logs.filter((l) => l.outcome === "closing");
    const noShows = logs.filter((l) => l.outcome === "no-show");
    const callsWithDuration = logs.filter((l) => l.duration > 0);

    const closingRate = total > 0 ? (closings.length / total) * 100 : 0;
    const noShowRate = total > 0 ? (noShows.length / total) * 100 : 0;
    const totalRevenue = closings.reduce((s, l) => s + l.revenue, 0);
    const revenuePerCall = total > 0 ? totalRevenue / total : 0;
    const avgDuration =
      callsWithDuration.length > 0
        ? callsWithDuration.reduce((s, l) => s + l.duration, 0) /
          callsWithDuration.length
        : 0;

    // Top objections
    const objectionCounts: Record<string, number> = {};
    logs.forEach((l) => {
      if (l.objection && l.objection.trim()) {
        const key = l.objection.trim();
        objectionCounts[key] = (objectionCounts[key] || 0) + 1;
      }
    });
    const topObjections = Object.entries(objectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      total,
      closings: closings.length,
      closingRate,
      noShows: noShows.length,
      noShowRate,
      totalRevenue,
      revenuePerCall,
      avgDuration,
      topObjections,
    };
  }, [logs]);

  // ─── Source attribution analytics ──────────────────────────────
  const sourceAnalytics = useMemo(() => {
    const sources: Record<
      string,
      { calls: number; closings: number; revenue: number }
    > = {};

    logs.forEach((l) => {
      const src = l.lead_source || "Non spécifié";
      if (!sources[src]) sources[src] = { calls: 0, closings: 0, revenue: 0 };
      sources[src].calls += 1;
      if (l.outcome === "closing") {
        sources[src].closings += 1;
        sources[src].revenue += l.revenue;
      }
    });

    const tableData = Object.entries(sources)
      .map(([source, data]) => ({
        source,
        calls: data.calls,
        closingRate: data.calls > 0 ? (data.closings / data.calls) * 100 : 0,
        revenue: data.revenue,
        revenuePerCall: data.calls > 0 ? data.revenue / data.calls : 0,
        closings: data.closings,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Bar chart data (closing rates by source)
    const barChartData = tableData
      .filter((d) => d.calls >= 1)
      .map((d) => ({
        source: d.source,
        "Taux closing": parseFloat(d.closingRate.toFixed(1)),
        fill: SOURCE_COLORS[d.source] || "#6B7280",
      }));

    // Pie chart data (revenue distribution)
    const pieChartData = tableData
      .filter((d) => d.revenue > 0)
      .map((d) => ({
        name: d.source,
        value: d.revenue,
        fill: SOURCE_COLORS[d.source] || "#6B7280",
      }));

    return { tableData, barChartData, pieChartData };
  }, [logs]);

  // ─── Weekly closing rate trend ─────────────────────────────────
  const weeklyTrend = useMemo(() => {
    const weeks: Record<
      string,
      { total: number; closings: number; revenue: number }
    > = {};
    logs.forEach((l) => {
      const d = parseISO(l.date);
      const weekKey = format(startOfWeek(d, { weekStartsOn: 1 }), "dd MMM", {
        locale: fr,
      });
      if (!weeks[weekKey])
        weeks[weekKey] = { total: 0, closings: 0, revenue: 0 };
      weeks[weekKey].total += 1;
      if (l.outcome === "closing") {
        weeks[weekKey].closings += 1;
        weeks[weekKey].revenue += l.revenue;
      }
    });
    return Object.entries(weeks).map(([week, data]) => ({
      semaine: week,
      "Taux closing": parseFloat(
        (data.total > 0 ? (data.closings / data.total) * 100 : 0).toFixed(1),
      ),
      "Rev/call": parseFloat(
        (data.total > 0 ? data.revenue / data.total : 0).toFixed(0),
      ),
    }));
  }, [logs]);

  // ─── Objections chart data ─────────────────────────────────────
  const objectionsChartData = useMemo(() => {
    return metrics.topObjections.map((o) => ({
      name: o.name,
      count: o.count,
    }));
  }, [metrics.topObjections]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const newLog: CallLog = {
      id: `cl_${Date.now()}`,
      ...formData,
    };

    const updated = isDemo
      ? [newLog]
      : [...logs, newLog].sort((a, b) => a.date.localeCompare(b.date));
    setLogs(updated);
    setIsDemo(false);
    saveCallLogs(updated);
    setShowForm(false);
    toast.success("Appel enregistré");
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      duration: 0,
      outcome: "closing",
      revenue: 0,
      objection: "",
      lead_source: "",
      campaign_name: "",
      creative_name: "",
    });
  }, [logs, formData, isDemo]);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLogs(DEMO_LOGS);
    setIsDemo(true);
    toast.success("Données réinitialisées");
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers =
      "Date,Durée (min),Résultat,Revenue,Objection,Source,Campagne,Créative\n";
    const rows = logs
      .map(
        (l) =>
          `${l.date},${l.duration},${l.outcome},${l.revenue},"${l.objection}","${l.lead_source}","${l.campaign_name}","${l.creative_name}"`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scalingflow-calls-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }, [logs]);

  const kpis = [
    {
      label: "Taux de closing",
      value: `${metrics.closingRate.toFixed(1)}%`,
      sub: `${metrics.closings}/${metrics.total} appels`,
      icon: Target,
      color:
        metrics.closingRate >= 30
          ? "text-accent"
          : metrics.closingRate >= 15
            ? "text-warning"
            : "text-danger",
    },
    {
      label: "Revenue par call",
      value: fmtCurrency(metrics.revenuePerCall),
      sub: `${fmtCurrency(metrics.totalRevenue)} total`,
      icon: DollarSign,
      color: "text-text-primary",
    },
    {
      label: "Durée moyenne",
      value: `${metrics.avgDuration.toFixed(0)} min`,
      sub: `${metrics.total} appels au total`,
      icon: Clock,
      color: "text-text-primary",
    },
    {
      label: "Taux de no-show",
      value: `${metrics.noShowRate.toFixed(1)}%`,
      sub: `${metrics.noShows} no-shows`,
      icon: AlertTriangle,
      color:
        metrics.noShowRate <= 10
          ? "text-accent"
          : metrics.noShowRate <= 20
            ? "text-warning"
            : "text-danger",
    },
  ];

  // ─── Custom tooltip for Pie chart ──────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0];
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-text-primary">{data.name}</p>
        <p className="text-xs text-text-secondary">{fmtCurrency(data.value)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDemo && <Badge variant="yellow">Données de démonstration</Badge>}
          {/* Section toggle */}
          <div className="flex gap-1 bg-bg-tertiary rounded-lg p-0.5">
            <button
              onClick={() => setActiveSection("overview")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeSection === "overview"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              Vue d&apos;ensemble
            </button>
            <button
              onClick={() => setActiveSection("sources")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                activeSection === "sources"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <Megaphone className="h-3 w-3" />
              Par source
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <>
              <Button variant="ghost" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            </>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Logger un appel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs font-medium">
                {kpi.label}
              </span>
              <kpi.icon className="h-4 w-4 text-text-muted" />
            </div>
            <div className={cn("text-xl font-bold", kpi.color)}>
              {kpi.value}
            </div>
            <p className="text-xs text-text-muted mt-1">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      {/* ─── OVERVIEW SECTION ──────────────────────────────────── */}
      {activeSection === "overview" && (
        <>
          {/* Closing rate & Revenue/call trend */}
          {weeklyTrend.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Taux de closing par semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" />
                        <XAxis
                          dataKey="semaine"
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
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#141719",
                            border: "1px solid #2A2D31",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                          formatter={(value?: number) => [
                            `${value ?? 0}%`,
                            "Taux de closing",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="Taux closing"
                          stroke="#34D399"
                          strokeWidth={2}
                          dot={{ fill: "#34D399", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue par appel par semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" />
                        <XAxis
                          dataKey="semaine"
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
                          tickFormatter={(v: number) => `${v}\u20AC`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#141719",
                            border: "1px solid #2A2D31",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                          formatter={(value?: number) => [
                            `${fmtCurrency(value ?? 0)}`,
                            "Rev/call",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="Rev/call"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          dot={{ fill: "#F59E0B", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Objections */}
          {objectionsChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top objections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={objectionsChartData} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1C1F23"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={180}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#141719",
                          border: "1px solid #2A2D31",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                        formatter={(value?: number) => [
                          `${value ?? 0} fois`,
                          "Fréquence",
                        ]}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                        {objectionsChartData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={
                              idx === 0
                                ? "#EF4444"
                                : idx === 1
                                  ? "#F59E0B"
                                  : "#6B7280"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ─── SOURCE ATTRIBUTION SECTION ────────────────────────── */}
      {activeSection === "sources" && (
        <>
          {/* Charts: Closing rate by source + Revenue distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart: closing rate by source */}
            {sourceAnalytics.barChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Taux de closing par source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sourceAnalytics.barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" />
                        <XAxis
                          dataKey="source"
                          stroke="#6B7280"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          angle={-25}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          stroke="#6B7280"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#141719",
                            border: "1px solid #2A2D31",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                          formatter={(value?: number) => [
                            `${value ?? 0}%`,
                            "Taux de closing",
                          ]}
                        />
                        <Bar
                          dataKey="Taux closing"
                          radius={[6, 6, 0, 0]}
                          barSize={32}
                        >
                          {sourceAnalytics.barChartData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pie chart: revenue distribution */}
            {sourceAnalytics.pieChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-accent" />
                    Répartition du revenue par source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceAnalytics.pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          label={({
                            name,
                            percent,
                          }: {
                            name?: string;
                            percent?: number;
                          }) =>
                            `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {sourceAnalytics.pieChartData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-3 justify-center">
                    {sourceAnalytics.pieChartData.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="text-[10px] text-text-secondary">
                          {entry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Source attribution table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-accent" />
                Attribution par source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left text-text-secondary font-medium py-3 px-2">
                        Source
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Nb Calls
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Taux Closing
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Revenue
                      </th>
                      <th className="text-right text-text-secondary font-medium py-3 px-2">
                        Revenue/Call
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceAnalytics.tableData.map((row) => (
                      <tr
                        key={row.source}
                        className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  SOURCE_COLORS[row.source] || "#6B7280",
                              }}
                            />
                            <span className="text-text-primary font-medium">
                              {row.source}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {row.calls}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge
                            variant={
                              row.closingRate >= 40
                                ? "default"
                                : row.closingRate >= 20
                                  ? "yellow"
                                  : "muted"
                            }
                          >
                            {row.closingRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-text-primary">
                          {row.revenue > 0 ? fmtCurrency(row.revenue) : "-"}
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {row.revenuePerCall > 0
                            ? fmtCurrency(row.revenuePerCall)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-bg-tertiary/30 font-semibold">
                      <td className="py-3 px-2 text-text-primary">Total</td>
                      <td className="py-3 px-2 text-right text-text-primary">
                        {sourceAnalytics.tableData.reduce(
                          (s, r) => s + r.calls,
                          0,
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Badge variant="default">
                          {metrics.closingRate.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-text-primary">
                        {fmtCurrency(metrics.totalRevenue)}
                      </td>
                      <td className="py-3 px-2 text-right text-text-secondary">
                        {fmtCurrency(metrics.revenuePerCall)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Recent calls table */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers appels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left text-text-secondary font-medium py-3 px-2">
                    Date
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Durée
                  </th>
                  <th className="text-left text-text-secondary font-medium py-3 px-2">
                    Résultat
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Revenue
                  </th>
                  <th className="text-left text-text-secondary font-medium py-3 px-2">
                    Source
                  </th>
                  <th className="text-left text-text-secondary font-medium py-3 px-2">
                    Campagne
                  </th>
                  <th className="text-left text-text-secondary font-medium py-3 px-2">
                    Objection
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .slice()
                  .reverse()
                  .slice(0, 15)
                  .map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors"
                    >
                      <td className="py-3 px-2 text-text-primary">
                        {format(parseISO(l.date), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </td>
                      <td className="py-3 px-2 text-right text-text-secondary">
                        {l.duration > 0 ? `${l.duration} min` : "-"}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            l.outcome === "closing"
                              ? "default"
                              : l.outcome === "no-show"
                                ? "red"
                                : l.outcome === "rappel"
                                  ? "yellow"
                                  : "muted"
                          }
                        >
                          {l.outcome === "closing"
                            ? "Closing"
                            : l.outcome === "no-show"
                              ? "No-show"
                              : l.outcome === "rappel"
                                ? "Rappel"
                                : "Objection"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-text-primary">
                        {l.revenue > 0 ? fmtCurrency(l.revenue) : "-"}
                      </td>
                      <td className="py-3 px-2">
                        {l.lead_source ? (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  SOURCE_COLORS[l.lead_source] || "#6B7280",
                              }}
                            />
                            <span className="text-text-secondary text-xs">
                              {l.lead_source}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-text-muted text-xs">
                        {l.campaign_name || "-"}
                      </td>
                      <td className="py-3 px-2 text-text-muted text-xs">
                        {l.objection || "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Call Input Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Logger un appel de vente</DialogTitle>
            <DialogDescription>
              Enregistre chaque appel pour suivre ton taux de closing, revenue
              par call, objections et sources.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="call-date">Date</Label>
              <Input
                id="call-date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="call-duration">Durée (minutes)</Label>
              <Input
                id="call-duration"
                type="number"
                min={0}
                value={formData.duration || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    duration: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-text-muted mt-1">0 min = no-show</p>
            </div>
            <div>
              <Label htmlFor="call-outcome">Résultat</Label>
              <Select
                value={formData.outcome}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    outcome: v as CallLog["outcome"],
                  }))
                }
              >
                <SelectTrigger id="call-outcome">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.outcome === "closing" && (
              <div>
                <Label htmlFor="call-revenue">Revenue (\u20AC)</Label>
                <Input
                  id="call-revenue"
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
            )}
            {(formData.outcome === "objection" ||
              formData.outcome === "rappel") && (
              <div>
                <Label htmlFor="call-objection">Objection principale</Label>
                <Select
                  value={formData.objection || ""}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, objection: v }))
                  }
                >
                  <SelectTrigger id="call-objection">
                    <SelectValue placeholder="Sélectionner une objection" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_OBJECTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Source tracking fields */}
            <div className="pt-3 border-t border-border-default">
              <p className="text-xs font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5" />
                Attribution de la source
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="call-source">Source du lead</Label>
                  <Select
                    value={formData.lead_source}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, lead_source: v }))
                    }
                  >
                    <SelectTrigger id="call-source">
                      <SelectValue placeholder="Sélectionner une source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="call-campaign">
                    Nom de la campagne (optionnel)
                  </Label>
                  <Input
                    id="call-campaign"
                    type="text"
                    placeholder="Ex: Scale Mars 2026"
                    value={formData.campaign_name}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        campaign_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="call-creative">
                    Nom de la créative (optionnel)
                  </Label>
                  <Input
                    id="call-creative"
                    type="text"
                    placeholder="Ex: Témoignage client"
                    value={formData.creative_name}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        creative_name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Real call-source metrics from Supabase */}
      <RealCallSourceMetrics />
    </div>
  );
}

// ─── Real Call Source Metrics (Feature 2.2) ──────────────────────────────────

interface CallAssetMeta {
  source_channel?: string;
  source_campaign?: string;
  call_result?: string;
  journey_summary?: string;
}

interface RealSourceStat {
  channel: string;
  calls: number;
  closings: number;
  close_rate: number;
  revenue: number;
  journey_summary?: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  organic_social: "Réseaux sociaux",
  email: "Email",
  organic: "Organique",
  referral: "Référence",
  direct: "Direct",
};

function RealCallSourceMetrics() {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RealSourceStat[]>([]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;
    const supabase = createClient();
    setLoading(true);

    supabase
      .from("sales_assets")
      .select("id, metadata, lead_id")
      .eq("user_id", user.id)
      .eq("asset_type", "call_analysis")
      .not("lead_id", "is", null)
      .then(({ data }: { data: { id: string; metadata: unknown; lead_id: string | null }[] | null }) => {
        if (!data || data.length === 0) {
          setStats([]);
          return;
        }

        // Group by source_channel
        const byChannel: Record<string, { calls: number; closings: number; revenue: number }> = {};

        for (const row of data) {
          const meta = (row.metadata || {}) as CallAssetMeta;
          const channel = meta.source_channel || "direct";
          if (!byChannel[channel]) {
            byChannel[channel] = { calls: 0, closings: 0, revenue: 0 };
          }
          byChannel[channel].calls++;
          // Try to get call result from metadata
          const callResult = meta.call_result || "";
          if (callResult === "close") {
            byChannel[channel].closings++;
          }
        }

        const result: RealSourceStat[] = Object.entries(byChannel)
          .map(([channel, s]) => ({
            channel,
            calls: s.calls,
            closings: s.closings,
            close_rate:
              s.calls > 0 ? Math.round((s.closings / s.calls) * 100) : 0,
            revenue: s.revenue,
          }))
          .sort((a, b) => b.calls - a.calls);

        setStats(result);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des métriques par source…
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card className="border-dashed border-border-default">
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full bg-bg-tertiary">
            <Route className="h-6 w-6 text-text-muted" />
          </div>
          <div>
            <p className="font-medium text-text-primary text-sm mb-1">
              Métriques par source — données réelles
            </p>
            <p className="text-xs text-text-secondary max-w-sm">
              Analyse tes calls en les liant à des leads (onglet &quot;Analyse de Call&quot;) pour voir ton taux de closing par canal d&apos;acquisition.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Best source by close rate
  const bestSource = [...stats].sort((a, b) => b.close_rate - a.close_rate)[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="h-4 w-4 text-accent" />
            Performance par source (réelle)
          </CardTitle>
          {bestSource && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/15">
              <Star className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-accent font-medium">
                Meilleure source :{" "}
                {CHANNEL_LABELS[bestSource.channel] || bestSource.channel} (
                {bestSource.close_rate}%)
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-border-default text-xs">
                <th className="pb-3 pr-4 font-medium">Source</th>
                <th className="pb-3 px-4 font-medium text-right">Calls</th>
                <th className="pb-3 px-4 font-medium text-right">Closings</th>
                <th className="pb-3 pl-4 font-medium text-right">
                  Taux de closing
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/30">
              {stats.map((s) => (
                <tr key={s.channel}>
                  <td className="py-3 pr-4">
                    <span className="text-text-primary font-medium">
                      {CHANNEL_LABELS[s.channel] || s.channel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-text-secondary">
                    {s.calls}
                  </td>
                  <td className="py-3 px-4 text-right text-text-secondary">
                    {s.closings}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <span
                      className={cn(
                        "font-semibold",
                        s.close_rate >= 40
                          ? "text-emerald-400"
                          : s.close_rate >= 20
                            ? "text-yellow-400"
                            : "text-text-secondary",
                      )}
                    >
                      {s.close_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
