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
import {
  DollarSign,
  Target,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
interface ROASEntry {
  id: string;
  week: string; // YYYY-Wxx or label
  adSpend: number;
  revenue: number;
  metaROAS: number; // ROAS reported by Meta
  campaign?: string;
}

// ─── localStorage helpers ────────────────────────────────────
const STORAGE_KEY = "scalingflow_roas_entries";

function loadEntries(): ROASEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: ROASEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Demo data ───────────────────────────────────────────────
// ─── Formatting helpers ──────────────────────────────────────
function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function roasColor(roas: number): string {
  if (roas >= 3) return "text-accent";
  if (roas >= 1.5) return "text-warning";
  return "text-danger";
}

function roasBadge(roas: number): "default" | "yellow" | "red" {
  if (roas >= 3) return "default";
  if (roas >= 1.5) return "yellow";
  return "red";
}

function roasLabel(roas: number): string {
  if (roas >= 3) return "Excellent";
  if (roas >= 1.5) return "Correct";
  return "Critique";
}

// ─── Main component ──────────────────────────────────────────
export function RealRoas() {
  const [entries, setEntries] = useState<ROASEntry[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    week: "",
    adSpend: 0,
    revenue: 0,
    metaROAS: 0,
    campaign: "",
  });

  useEffect(() => {
    const stored = loadEntries();
    if (stored.length > 0) {
      setEntries(stored);
    }
    setIsDemo(false);
  }, []);

  // ─── Aggregated stats ──────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSpend = entries.reduce((s, e) => s + e.adSpend, 0);
    const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0);
    const realROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const avgMetaROAS =
      entries.length > 0
        ? entries.reduce((s, e) => s + e.metaROAS, 0) / entries.length
        : 0;
    const gap = avgMetaROAS - realROAS;
    const gapPct =
      avgMetaROAS > 0 ? ((avgMetaROAS - realROAS) / avgMetaROAS) * 100 : 0;

    return { totalSpend, totalRevenue, realROAS, avgMetaROAS, gap, gapPct };
  }, [entries]);

  // ─── Comparison chart data ─────────────────────────────────────
  const comparisonData = useMemo(() => {
    return entries.map((e) => {
      const realROAS = e.adSpend > 0 ? e.revenue / e.adSpend : 0;
      return {
        week: e.week,
        "ROAS Réel": parseFloat(realROAS.toFixed(2)),
        "ROAS Meta": e.metaROAS,
      };
    });
  }, [entries]);

  // ─── Campaign breakdown ────────────────────────────────────────
  const campaignBreakdown = useMemo(() => {
    const groups: Record<
      string,
      { spend: number; revenue: number; metaROAS: number; count: number }
    > = {};
    entries.forEach((e) => {
      const key = e.campaign || "Sans campagne";
      if (!groups[key])
        groups[key] = { spend: 0, revenue: 0, metaROAS: 0, count: 0 };
      groups[key].spend += e.adSpend;
      groups[key].revenue += e.revenue;
      groups[key].metaROAS += e.metaROAS;
      groups[key].count += 1;
    });
    return Object.entries(groups).map(([name, data]) => ({
      name,
      spend: data.spend,
      revenue: data.revenue,
      realROAS: data.spend > 0 ? data.revenue / data.spend : 0,
      metaROAS: data.count > 0 ? data.metaROAS / data.count : 0,
    }));
  }, [entries]);

  // ─── ROAS trend chart ──────────────────────────────────────────
  const trendData = useMemo(() => {
    return entries.map((e) => ({
      week: e.week,
      ROAS: parseFloat((e.adSpend > 0 ? e.revenue / e.adSpend : 0).toFixed(2)),
    }));
  }, [entries]);

  // ─── Recommendations ──────────────────────────────────────────
  const recommendations = useMemo(() => {
    const tips: string[] = [];
    if (stats.realROAS < 1.5) {
      tips.push(
        "Ton ROAS réel est critique (<1.5x). Réduis tes dépenses publicitaires ou améliore ton offre et ton taux de closing.",
      );
      tips.push(
        "Concentre-toi sur les campagnes avec le meilleur ROAS et coupe celles qui sous-performent.",
      );
    } else if (stats.realROAS < 3) {
      tips.push(
        "Ton ROAS réel est correct mais peut être amélioré. Teste de nouvelles créatives et audiences.",
      );
      tips.push(
        "Analyse tes campagnes les plus rentables et alloue plus de budget dessus.",
      );
    } else {
      tips.push(
        "Excellent ROAS ! Envisage d'augmenter ton budget publicitaire progressivement pour scaler.",
      );
      tips.push(
        "Diversifie tes canaux d'acquisition pour ne pas dépendre d'une seule source.",
      );
    }
    if (stats.gapPct > 30) {
      tips.push(
        `Attention : l'écart entre le ROAS Meta et ton ROAS réel est de ${stats.gapPct.toFixed(0)}%. Meta surestime probablement tes conversions.`,
      );
    }
    return tips;
  }, [stats]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const newEntry: ROASEntry = {
      id: `r_${Date.now()}`,
      week: formData.week || `S${format(new Date(), "ww")}`,
      adSpend: formData.adSpend,
      revenue: formData.revenue,
      metaROAS: formData.metaROAS,
      campaign: formData.campaign || undefined,
    };

    const updated = isDemo ? [newEntry] : [...entries, newEntry];
    setEntries(updated);
    setIsDemo(false);
    saveEntries(updated);
    setShowForm(false);
    toast.success("Données ROAS enregistrées");
    setFormData({
      week: "",
      adSpend: 0,
      revenue: 0,
      metaROAS: 0,
      campaign: "",
    });
  }, [entries, formData, isDemo]);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEntries([]);
    setIsDemo(false);
    toast.success("Données réinitialisées");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDemo && <Badge variant="yellow">Données de démonstration</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter semaine
          </Button>
        </div>
      </div>

      {/* Main comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ROAS Réel */}
        <Card className="p-5 border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">
              ROAS Réel
            </span>
            <DollarSign className="h-4 w-4 text-text-muted" />
          </div>
          <div className={cn("text-3xl font-bold", roasColor(stats.realROAS))}>
            {stats.realROAS.toFixed(2)}x
          </div>
          <Badge variant={roasBadge(stats.realROAS)} className="mt-2">
            {roasLabel(stats.realROAS)}
          </Badge>
          <p className="text-xs text-text-muted mt-2">
            {fmtCurrency(stats.totalRevenue)} revenue /{" "}
            {fmtCurrency(stats.totalSpend)} dépensé
          </p>
        </Card>

        {/* ROAS Meta (estimé) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">
              ROAS Meta (estimé)
            </span>
            <Target className="h-4 w-4 text-text-muted" />
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {stats.avgMetaROAS.toFixed(2)}x
          </div>
          <Badge variant="muted" className="mt-2">
            Estimation Meta
          </Badge>
          <p className="text-xs text-text-muted mt-2">
            Moyenne pondérée des ROAS reportés par Meta
          </p>
        </Card>

        {/* Écart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">
              Écart Meta vs Réel
            </span>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div
            className={cn(
              "text-3xl font-bold",
              stats.gapPct > 30
                ? "text-danger"
                : stats.gapPct > 15
                  ? "text-warning"
                  : "text-accent",
            )}
          >
            {stats.gapPct > 0 ? "+" : ""}
            {stats.gapPct.toFixed(0)}%
          </div>
          <p className="text-xs text-text-muted mt-2">
            {stats.gapPct > 30
              ? "Meta surestime significativement tes conversions"
              : stats.gapPct > 15
                ? "Écart modéré entre Meta et la réalité"
                : "Écart faible — tes données sont cohérentes"}
          </p>
        </Card>
      </div>

      {/* ROAS Comparison Chart */}
      {comparisonData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>ROAS Réel vs ROAS Meta par semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" />
                  <XAxis
                    dataKey="week"
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
                    tickFormatter={(v: number) => `${v}x`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141719",
                      border: "1px solid #2A2D31",
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                    formatter={(value?: number, name?: string) => [
                      `${(value ?? 0).toFixed(2)}x`,
                      name ?? "",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="ROAS Réel"
                    fill="#34D399"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Bar
                    dataKey="ROAS Meta"
                    fill="#6B7280"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    opacity={0.5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ROAS Trend */}
      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendance ROAS réel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" />
                  <XAxis
                    dataKey="week"
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
                    tickFormatter={(v: number) => `${v}x`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141719",
                      border: "1px solid #2A2D31",
                      borderRadius: "8px",
                      color: "#F9FAFB",
                    }}
                    formatter={(value?: number) => [
                      `${(value ?? 0).toFixed(2)}x`,
                      "ROAS Réel",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="ROAS"
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

      {/* Campaign breakdown */}
      {campaignBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ROAS par campagne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left text-text-secondary font-medium py-3 px-2">
                      Campagne
                    </th>
                    <th className="text-right text-text-secondary font-medium py-3 px-2">
                      Dépense
                    </th>
                    <th className="text-right text-text-secondary font-medium py-3 px-2">
                      Revenue
                    </th>
                    <th className="text-right text-text-secondary font-medium py-3 px-2">
                      ROAS Réel
                    </th>
                    <th className="text-right text-text-secondary font-medium py-3 px-2">
                      ROAS Meta
                    </th>
                    <th className="text-right text-text-secondary font-medium py-3 px-2">
                      Écart
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaignBreakdown.map((c) => {
                    const gap = c.metaROAS - c.realROAS;
                    return (
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
                        <td className="py-3 px-2 text-right font-medium text-text-primary">
                          {fmtCurrency(c.revenue)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge variant={roasBadge(c.realROAS)}>
                            {c.realROAS.toFixed(2)}x
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {c.metaROAS.toFixed(2)}x
                        </td>
                        <td
                          className={cn(
                            "py-3 px-2 text-right text-xs font-medium",
                            gap > 1 ? "text-danger" : "text-text-muted",
                          )}
                        >
                          {gap > 0 ? "+" : ""}
                          {gap.toFixed(2)}x
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary/50"
              >
                {stats.realROAS >= 3 ? (
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-text-secondary">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Données ROAS hebdomadaires</DialogTitle>
            <DialogDescription>
              Compare ton ROAS réel (basé sur tes vraies ventes) avec le ROAS
              estimé par Meta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="roas-week">Semaine (ex : S10)</Label>
              <Input
                id="roas-week"
                placeholder={`S${format(new Date(), "ww")}`}
                value={formData.week}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, week: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="roas-spend">Dépense publicitaire (€)</Label>
              <Input
                id="roas-spend"
                type="number"
                min={0}
                step={0.01}
                value={formData.adSpend || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    adSpend: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="roas-revenue">Revenue réel (€)</Label>
              <Input
                id="roas-revenue"
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
            <div>
              <Label htmlFor="roas-meta">ROAS Meta (reporté par Meta)</Label>
              <Input
                id="roas-meta"
                type="number"
                min={0}
                step={0.01}
                value={formData.metaROAS || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    metaROAS: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="roas-campaign">Campagne (optionnel)</Label>
              <Input
                id="roas-campaign"
                placeholder="Ex : Scaling Mars"
                value={formData.campaign}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, campaign: e.target.value }))
                }
              />
            </div>

            {/* Preview */}
            {formData.adSpend > 0 && formData.revenue > 0 && (
              <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-default">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Aperçu
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-text-muted">ROAS Réel :</span>{" "}
                    <span
                      className={cn(
                        "font-medium",
                        roasColor(formData.revenue / formData.adSpend),
                      )}
                    >
                      {(formData.revenue / formData.adSpend).toFixed(2)}x
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">ROAS Meta :</span>{" "}
                    <span className="font-medium text-text-primary">
                      {formData.metaROAS.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={formData.adSpend <= 0 || formData.revenue <= 0}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
