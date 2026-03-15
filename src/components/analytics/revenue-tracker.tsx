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
  TrendingUp,
  ShoppingCart,
  CalendarDays,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO, subDays, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
interface SaleEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  source: string;
  campaign: string;
  creative: string;
  audience: string;
}

type DateRange = "7" | "30" | "90" | "custom";

const SOURCES = [
  "Meta Ads",
  "Instagram",
  "YouTube",
  "Organique",
  "Referral",
  "Autre",
];

// ─── localStorage helpers ────────────────────────────────────
const STORAGE_KEY = "scalingflow_revenue_entries";

function loadEntries(): SaleEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: SaleEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Demo data ───────────────────────────────────────────────
const DEMO_ENTRIES: SaleEntry[] = [
  { id: "d1", date: "2026-03-01", amount: 997, source: "Meta Ads", campaign: "Scaling Mars", creative: "VSL Témoignage", audience: "Lookalike 1%" },
  { id: "d2", date: "2026-03-02", amount: 1497, source: "Meta Ads", campaign: "Scaling Mars", creative: "Carrousel Résultat", audience: "Intérêt Business" },
  { id: "d3", date: "2026-03-03", amount: 997, source: "Instagram", campaign: "DM Outreach", creative: "Story CTA", audience: "Followers engagés" },
  { id: "d4", date: "2026-03-04", amount: 2497, source: "YouTube", campaign: "Vidéo longue", creative: "Tuto Scaling", audience: "Abonnés" },
  { id: "d5", date: "2026-03-05", amount: 997, source: "Meta Ads", campaign: "Retargeting", creative: "Vidéo Objection", audience: "Visiteurs site" },
  { id: "d6", date: "2026-03-06", amount: 1497, source: "Referral", campaign: "Parrainage", creative: "-", audience: "Clients existants" },
  { id: "d7", date: "2026-03-07", amount: 997, source: "Meta Ads", campaign: "Scaling Mars", creative: "VSL Témoignage", audience: "Lookalike 1%" },
  { id: "d8", date: "2026-03-08", amount: 2497, source: "Meta Ads", campaign: "Scaling Mars", creative: "Carrousel Résultat", audience: "Intérêt Business" },
  { id: "d9", date: "2026-03-09", amount: 997, source: "Organique", campaign: "-", creative: "-", audience: "-" },
  { id: "d10", date: "2026-03-10", amount: 1497, source: "Meta Ads", campaign: "Retargeting", creative: "Vidéo Objection", audience: "Visiteurs site" },
  { id: "d11", date: "2026-03-11", amount: 997, source: "Instagram", campaign: "DM Outreach", creative: "Reel Hook", audience: "Followers engagés" },
  { id: "d12", date: "2026-03-12", amount: 2497, source: "Meta Ads", campaign: "Scaling Mars", creative: "VSL Témoignage", audience: "Lookalike 1%" },
  { id: "d13", date: "2026-03-13", amount: 997, source: "Meta Ads", campaign: "Scaling Mars", creative: "Carrousel Résultat", audience: "Lookalike 1%" },
  { id: "d14", date: "2026-03-14", amount: 1497, source: "YouTube", campaign: "Vidéo longue", creative: "Tuto Scaling", audience: "Abonnés" },
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
export function RevenueTracker() {
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: 0,
    source: "Meta Ads",
    campaign: "",
    creative: "",
    audience: "",
  });

  // Load on mount
  useEffect(() => {
    const stored = loadEntries();
    if (stored.length > 0) {
      setEntries(stored);
      setIsDemo(false);
    } else {
      setEntries(DEMO_ENTRIES);
      setIsDemo(true);
    }
  }, []);

  // Filter by date range
  const filteredEntries = useMemo(() => {
    if (dateRange === "custom") return entries;
    const days = parseInt(dateRange);
    const cutoff = subDays(new Date(), days);
    return entries.filter((e) => isAfter(parseISO(e.date), cutoff));
  }, [entries, dateRange]);

  // ─── Summary KPIs ─────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalRevenue = filteredEntries.reduce((s, e) => s + e.amount, 0);
    const nbVentes = filteredEntries.length;
    const panierMoyen = nbVentes > 0 ? totalRevenue / nbVentes : 0;

    // Calculate unique days
    const uniqueDays = new Set(filteredEntries.map((e) => e.date)).size;
    const revenueParJour = uniqueDays > 0 ? totalRevenue / uniqueDays : 0;

    return { totalRevenue, nbVentes, panierMoyen, revenueParJour };
  }, [filteredEntries]);

  // ─── Chart data (revenue per day) ─────────────────────────────
  const chartData = useMemo(() => {
    const byDay: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      byDay[e.date] = (byDay[e.date] || 0) + e.amount;
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: format(parseISO(date), "dd MMM", { locale: fr }),
        Revenu: revenue,
      }));
  }, [filteredEntries]);

  // ─── Table data (aggregated by source/campaign/creative/audience) ──
  const tableData = useMemo(() => {
    const groups: Record<
      string,
      { source: string; campaign: string; creative: string; audience: string; revenue: number; count: number }
    > = {};
    filteredEntries.forEach((e) => {
      const key = `${e.source}|${e.campaign}|${e.creative}|${e.audience}`;
      if (!groups[key]) {
        groups[key] = {
          source: e.source,
          campaign: e.campaign,
          creative: e.creative,
          audience: e.audience,
          revenue: 0,
          count: 0,
        };
      }
      groups[key].revenue += e.amount;
      groups[key].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.revenue - a.revenue);
  }, [filteredEntries]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const newEntry: SaleEntry = {
      id: `s_${Date.now()}`,
      date: formData.date,
      amount: formData.amount,
      source: formData.source,
      campaign: formData.campaign || "-",
      creative: formData.creative || "-",
      audience: formData.audience || "-",
    };

    const updated = isDemo ? [newEntry] : [...entries, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    setEntries(updated);
    setIsDemo(false);
    saveEntries(updated);
    setShowForm(false);
    toast.success("Vente enregistrée");
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
      source: "Meta Ads",
      campaign: "",
      creative: "",
      audience: "",
    });
  }, [entries, formData, isDemo]);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEntries(DEMO_ENTRIES);
    setIsDemo(true);
    toast.success("Données réinitialisées");
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = "Date,Montant,Source,Campagne,Créative,Audience\n";
    const rows = filteredEntries
      .map((e) => `${e.date},${e.amount},${e.source},"${e.campaign}","${e.creative}","${e.audience}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scalingflow-revenue-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }, [filteredEntries]);

  const kpis = [
    { label: "Revenue Total", value: fmtCurrency(summary.totalRevenue), icon: DollarSign },
    { label: "Nb Ventes", value: String(summary.nbVentes), icon: ShoppingCart },
    { label: "Panier Moyen", value: fmtCurrency(summary.panierMoyen), icon: TrendingUp },
    { label: "Revenue / Jour", value: fmtCurrency(summary.revenueParJour), icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isDemo && <Badge variant="yellow">Données de démonstration</Badge>}
          {/* Date range selector */}
          <div className="flex gap-1">
            {(["7", "30", "90"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  dateRange === range
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                )}
              >
                {range}j
              </button>
            ))}
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
            Ajouter une vente
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs font-medium">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-text-muted" />
            </div>
            <div className="text-xl font-bold text-text-primary">{kpi.value}</div>
          </Card>
        ))}
      </div>

      {/* Revenue per day chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue par jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                    tickFormatter={(v: number) => `${v}€`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141719",
                      border: "1px solid #2A2D31",
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                    formatter={(value?: number) => [`${fmtCurrency(value ?? 0)}`, "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="Revenu"
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
      )}

      {/* Attribution table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par source, campagne, créative et audience</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left text-text-secondary font-medium py-3 px-2">Source</th>
                  <th className="text-left text-text-secondary font-medium py-3 px-2">Campagne</th>
                  <th className="text-left text-text-secondary font-medium py-3 px-2">Créative</th>
                  <th className="text-left text-text-secondary font-medium py-3 px-2">Audience</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Revenue</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Nb Ventes</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Panier Moyen</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium text-text-primary">{row.source}</td>
                    <td className="py-3 px-2 text-text-secondary">{row.campaign}</td>
                    <td className="py-3 px-2 text-text-secondary">{row.creative}</td>
                    <td className="py-3 px-2 text-text-secondary">{row.audience}</td>
                    <td className="py-3 px-2 text-right font-medium text-text-primary">
                      {fmtCurrency(row.revenue)}
                    </td>
                    <td className="py-3 px-2 text-right text-text-secondary">{row.count}</td>
                    <td className="py-3 px-2 text-right text-text-secondary">
                      {fmtCurrency(row.count > 0 ? row.revenue / row.count : 0)}
                    </td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      Aucune vente sur cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sale Input Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enregistrer une vente</DialogTitle>
            <DialogDescription>
              Ajoute une vente avec son attribution (source, campagne, créative, audience) pour suivre ton revenue réel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="sale-date">Date</Label>
              <Input
                id="sale-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="sale-amount">Montant (€)</Label>
              <Input
                id="sale-amount"
                type="number"
                min={0}
                step={0.01}
                value={formData.amount || ""}
                onChange={(e) => setFormData((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="sale-source">Source / Canal</Label>
              <Select
                value={formData.source}
                onValueChange={(v) => setFormData((p) => ({ ...p, source: v }))}
              >
                <SelectTrigger id="sale-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="sale-campaign">Nom de campagne</Label>
              <Input
                id="sale-campaign"
                placeholder="Ex : Scaling Mars"
                value={formData.campaign}
                onChange={(e) => setFormData((p) => ({ ...p, campaign: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="sale-creative">Créative</Label>
              <Input
                id="sale-creative"
                placeholder="Ex : VSL Témoignage"
                value={formData.creative}
                onChange={(e) => setFormData((p) => ({ ...p, creative: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="sale-audience">Audience</Label>
              <Input
                id="sale-audience"
                placeholder="Ex : Lookalike 1%"
                value={formData.audience}
                onChange={(e) => setFormData((p) => ({ ...p, audience: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={formData.amount <= 0}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
