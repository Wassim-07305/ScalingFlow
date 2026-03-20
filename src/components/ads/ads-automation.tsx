"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Scissors,
  ArrowUpRight,
  Settings2,
  Sparkles,
  BarChart3,
  Target,
  DollarSign,
  Layers,
  ShieldAlert,
  RotateCcw,
  Plus,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────

interface CreativeKPI {
  id: string;
  name: string;
  campaignName: string;
  status: "performant" | "a_surveiller" | "sous_performant";
  cpm: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  spend: number;
  conversions: number;
  impressions: number;
  frequency: number;
  anomalies: string[];
  trend: "up" | "down" | "stable";
}

interface Decision {
  id: string;
  timestamp: string;
  actionType: "couper" | "scaler" | "realloquer" | "fatigue" | "rollback";
  creativeName: string;
  reason: string;
  status: "applique" | "en_attente" | "annule";
  details: string;
}

interface ThresholdConfig {
  cpaMax: number;
  roasMin: number;
  ctrMin: number;
  frequenceMax: number;
  budgetScaleIncrement: number;
}

interface CreativeCycle {
  week: number;
  startDate: string;
  endDate: string;
  winnersCount: number;
  losersCount: number;
  newCreatives: number;
  status: "en_cours" | "termine" | "planifie";
}

interface WinnerPattern {
  element: string;
  category: string;
  score: number;
}

interface ScalingTier {
  id: number;
  label: string;
  budgetMin: number;
  budgetMax: number;
  scalePercent: number;
  roasRequired: number;
  active: boolean;
}

interface BudgetHistory {
  date: string;
  budget: number;
  roas: number;
  tier: number;
}

// ─── Default thresholds ─────────────────────────────────────

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  cpaMax: 30,
  roasMin: 2,
  ctrMin: 1,
  frequenceMax: 2.5,
  budgetScaleIncrement: 20,
};

// ─── Mock Data ──────────────────────────────────────────────

const MOCK_CREATIVES: CreativeKPI[] = [
  {
    id: "cr_001",
    name: "Hook Douleur v3",
    campaignName: "Acquisition Cold",
    status: "performant",
    cpm: 8.5,
    ctr: 2.8,
    cpc: 0.31,
    cpa: 18.5,
    roas: 4.2,
    spend: 342,
    conversions: 18,
    impressions: 40235,
    frequency: 1.4,
    anomalies: [],
    trend: "up",
  },
  {
    id: "cr_002",
    name: "Témoignage Client A",
    campaignName: "Acquisition Cold",
    status: "performant",
    cpm: 9.2,
    ctr: 2.1,
    cpc: 0.44,
    cpa: 22.0,
    roas: 3.5,
    spend: 286,
    conversions: 13,
    impressions: 31087,
    frequency: 1.6,
    anomalies: [],
    trend: "stable",
  },
  {
    id: "cr_003",
    name: "Carrousel Résultats",
    campaignName: "Retargeting Chaud",
    status: "a_surveiller",
    cpm: 12.4,
    ctr: 1.2,
    cpc: 1.03,
    cpa: 35.0,
    roas: 1.8,
    spend: 210,
    conversions: 6,
    impressions: 16935,
    frequency: 2.3,
    anomalies: ["CPM en hausse", "CTR en baisse"],
    trend: "down",
  },
  {
    id: "cr_004",
    name: "UGC Transformation",
    campaignName: "Acquisition Lookalike",
    status: "a_surveiller",
    cpm: 11.0,
    ctr: 1.5,
    cpc: 0.73,
    cpa: 28.0,
    roas: 2.1,
    spend: 196,
    conversions: 7,
    impressions: 17818,
    frequency: 2.8,
    anomalies: ["Fatigue créative"],
    trend: "down",
  },
  {
    id: "cr_005",
    name: "Before/After Static",
    campaignName: "Retargeting Chaud",
    status: "sous_performant",
    cpm: 15.3,
    ctr: 0.6,
    cpc: 2.55,
    cpa: 52.0,
    roas: 0.8,
    spend: 156,
    conversions: 3,
    impressions: 10196,
    frequency: 3.2,
    anomalies: ["Fatigue créative", "CPM en hausse", "CTR en baisse"],
    trend: "down",
  },
  {
    id: "cr_006",
    name: "Hook Question v1",
    campaignName: "Acquisition Cold",
    status: "sous_performant",
    cpm: 14.1,
    ctr: 0.7,
    cpc: 2.01,
    cpa: 48.0,
    roas: 1.1,
    spend: 144,
    conversions: 3,
    impressions: 10213,
    frequency: 1.9,
    anomalies: ["CPA en hausse"],
    trend: "down",
  },
];

const MOCK_DECISIONS: Decision[] = [
  {
    id: "dec_001",
    timestamp: "2026-03-15T14:30:00",
    actionType: "couper",
    creativeName: "Before/After Static",
    reason: "CPA 52€ > seuil 30€ — ROAS 0.8x insuffisant",
    status: "en_attente",
    details: "Budget quotidien de 22€ à réallouer",
  },
  {
    id: "dec_002",
    timestamp: "2026-03-15T14:30:00",
    actionType: "scaler",
    creativeName: "Hook Douleur v3",
    reason: "ROAS 4.2x — Performance exceptionnelle",
    status: "en_attente",
    details: "Augmenter le budget de 48€/j à 58€/j (+20%)",
  },
  {
    id: "dec_003",
    timestamp: "2026-03-15T14:30:00",
    actionType: "realloquer",
    creativeName: "Acquisition Cold → Retargeting Chaud",
    reason:
      "Retargeting sous-performant — réallocation depuis la campagne la plus performante",
    status: "en_attente",
    details:
      "Réalloquer 30€ du budget Before/After Static vers Témoignage Client A",
  },
  {
    id: "dec_004",
    timestamp: "2026-03-15T14:30:00",
    actionType: "fatigue",
    creativeName: "UGC Transformation",
    reason: "Fréquence 2.8 > seuil 2.5 — Fatigue créative détectée",
    status: "en_attente",
    details: "Préparer de nouvelles variations basées sur le même angle",
  },
  {
    id: "dec_005",
    timestamp: "2026-03-15T08:00:00",
    actionType: "couper",
    creativeName: "Hook Question v1",
    reason: "CPA 48€ > seuil 30€ après 3 jours de test",
    status: "applique",
    details: "Creative mise en pause, budget réalloué",
  },
  {
    id: "dec_006",
    timestamp: "2026-03-14T14:30:00",
    actionType: "scaler",
    creativeName: "Hook Douleur v3",
    reason: "ROAS stable à 3.8x — passage au palier suivant",
    status: "applique",
    details: "Budget passé de 40€/j à 48€/j",
  },
];

const MOCK_CYCLES: CreativeCycle[] = [
  {
    week: 12,
    startDate: "2026-03-16",
    endDate: "2026-03-22",
    winnersCount: 0,
    losersCount: 0,
    newCreatives: 5,
    status: "planifie",
  },
  {
    week: 11,
    startDate: "2026-03-09",
    endDate: "2026-03-15",
    winnersCount: 2,
    losersCount: 2,
    newCreatives: 4,
    status: "en_cours",
  },
  {
    week: 10,
    startDate: "2026-03-02",
    endDate: "2026-03-08",
    winnersCount: 3,
    losersCount: 1,
    newCreatives: 6,
    status: "termine",
  },
  {
    week: 9,
    startDate: "2026-02-23",
    endDate: "2026-03-01",
    winnersCount: 2,
    losersCount: 3,
    newCreatives: 5,
    status: "termine",
  },
];

const MOCK_WINNER_PATTERNS: WinnerPattern[] = [
  {
    element: "Hook émotionnel (douleur/frustration)",
    category: "Hook",
    score: 92,
  },
  { element: "Témoignage client réel", category: "Format", score: 88 },
  {
    element: "Chiffres concrets dans le titre",
    category: "Copywriting",
    score: 85,
  },
  { element: "CTA urgence (places limitées)", category: "CTA", score: 82 },
  { element: "Format vidéo < 30 secondes", category: "Format", score: 78 },
  {
    element: "Angle transformation (avant/après)",
    category: "Angle",
    score: 75,
  },
];

const SCALING_TIERS: ScalingTier[] = [
  {
    id: 1,
    label: "Palier 1 — Démarrage",
    budgetMin: 0,
    budgetMax: 50,
    scalePercent: 20,
    roasRequired: 2.0,
    active: true,
  },
  {
    id: 2,
    label: "Palier 2 — Croissance",
    budgetMin: 50,
    budgetMax: 200,
    scalePercent: 15,
    roasRequired: 2.5,
    active: false,
  },
  {
    id: 3,
    label: "Palier 3 — Accélération",
    budgetMin: 200,
    budgetMax: 500,
    scalePercent: 10,
    roasRequired: 3.0,
    active: false,
  },
  {
    id: 4,
    label: "Palier 4 — Volume",
    budgetMin: 500,
    budgetMax: 99999,
    scalePercent: 5,
    roasRequired: 3.5,
    active: false,
  },
];

const MOCK_BUDGET_HISTORY: BudgetHistory[] = [
  { date: "01 Mar", budget: 20, roas: 1.8, tier: 1 },
  { date: "03 Mar", budget: 24, roas: 2.3, tier: 1 },
  { date: "05 Mar", budget: 29, roas: 2.5, tier: 1 },
  { date: "07 Mar", budget: 35, roas: 2.8, tier: 1 },
  { date: "09 Mar", budget: 42, roas: 3.1, tier: 1 },
  { date: "11 Mar", budget: 50, roas: 2.7, tier: 2 },
  { date: "12 Mar", budget: 42, roas: 1.9, tier: 1 },
  { date: "13 Mar", budget: 42, roas: 2.4, tier: 1 },
  { date: "14 Mar", budget: 48, roas: 3.2, tier: 1 },
  { date: "15 Mar", budget: 48, roas: 4.2, tier: 1 },
];

// ─── Helper functions ───────────────────────────────────────

function getStatusConfig(status: CreativeKPI["status"]) {
  switch (status) {
    case "performant":
      return {
        label: "Performant",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        dot: "bg-emerald-400",
      };
    case "a_surveiller":
      return {
        label: "À surveiller",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        dot: "bg-yellow-400",
      };
    case "sous_performant":
      return {
        label: "Sous-performant",
        color: "text-red-400",
        bg: "bg-red-500/10",
        dot: "bg-red-400",
      };
  }
}

function getActionIcon(type: Decision["actionType"]) {
  switch (type) {
    case "couper":
      return Scissors;
    case "scaler":
      return TrendingUp;
    case "realloquer":
      return ArrowUpRight;
    case "fatigue":
      return RefreshCw;
    case "rollback":
      return RotateCcw;
  }
}

function getActionLabel(type: Decision["actionType"]) {
  switch (type) {
    case "couper":
      return "Couper";
    case "scaler":
      return "Scaler";
    case "realloquer":
      return "Réalloquer";
    case "fatigue":
      return "Fatigue";
    case "rollback":
      return "Rollback";
  }
}

function getActionBadgeVariant(
  type: Decision["actionType"],
): "red" | "default" | "blue" | "yellow" | "purple" {
  switch (type) {
    case "couper":
      return "red";
    case "scaler":
      return "default";
    case "realloquer":
      return "blue";
    case "fatigue":
      return "yellow";
    case "rollback":
      return "purple";
  }
}

function getDecisionStatusLabel(status: Decision["status"]) {
  switch (status) {
    case "applique":
      return "Appliqué";
    case "en_attente":
      return "En attente";
    case "annule":
      return "Annulé";
  }
}

function getDecisionStatusBadge(
  status: Decision["status"],
): "default" | "yellow" | "muted" {
  switch (status) {
    case "applique":
      return "default";
    case "en_attente":
      return "yellow";
    case "annule":
      return "muted";
  }
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Tab 1: Monitoring (#69) ────────────────────────────────

function MonitoringTab() {
  const [lastCheck] = useState(new Date().toLocaleString("fr-FR"));
  const [creatives, setCreatives] = useState<CreativeKPI[]>(MOCK_CREATIVES);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    campaignName: "",
    cpm: "",
    ctr: "",
    cpc: "",
    cpa: "",
    roas: "",
    spend: "",
    conversions: "",
    impressions: "",
    frequency: "",
  });

  const thresholds = useMemo(() => {
    try {
      const saved = localStorage.getItem("sf_ads_thresholds");
      return saved
        ? (JSON.parse(saved) as ThresholdConfig)
        : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  }, []);

  const summary = useMemo(() => {
    const performant = creatives.filter(
      (c) => c.status === "performant",
    ).length;
    const surveiller = creatives.filter(
      (c) => c.status === "a_surveiller",
    ).length;
    const sousPerformant = creatives.filter(
      (c) => c.status === "sous_performant",
    ).length;
    const totalSpend = creatives.reduce((s, c) => s + c.spend, 0);
    const totalConversions = creatives.reduce((s, c) => s + c.conversions, 0);
    const avgRoas =
      creatives.reduce((s, c) => s + c.roas, 0) / (creatives.length || 1);
    return {
      performant,
      surveiller,
      sousPerformant,
      totalSpend,
      totalConversions,
      avgRoas,
    };
  }, [creatives]);

  const handleAddCreative = () => {
    const ctr = parseFloat(formData.ctr) || 0;
    const cpa = parseFloat(formData.cpa) || 0;
    const roas = parseFloat(formData.roas) || 0;
    const frequency = parseFloat(formData.frequency) || 0;

    let status: CreativeKPI["status"] = "performant";
    const anomalies: string[] = [];

    if (
      cpa > thresholds.cpaMax ||
      roas < thresholds.roasMin ||
      ctr < thresholds.ctrMin
    ) {
      status = "sous_performant";
    } else if (
      cpa > thresholds.cpaMax * 0.8 ||
      roas < thresholds.roasMin * 1.2 ||
      frequency > thresholds.frequenceMax * 0.8
    ) {
      status = "a_surveiller";
    }

    if (frequency > thresholds.frequenceMax) anomalies.push("Fatigue créative");
    if (ctr < thresholds.ctrMin) anomalies.push("CTR en baisse");
    if (cpa > thresholds.cpaMax) anomalies.push("CPA en hausse");

    const newCreative: CreativeKPI = {
      id: `cr_custom_${Date.now()}`,
      name: formData.name || "Creative sans nom",
      campaignName: formData.campaignName || "Campagne test",
      status,
      cpm: parseFloat(formData.cpm) || 0,
      ctr,
      cpc: parseFloat(formData.cpc) || 0,
      cpa,
      roas,
      spend: parseFloat(formData.spend) || 0,
      conversions: parseInt(formData.conversions) || 0,
      impressions: parseInt(formData.impressions) || 0,
      frequency,
      anomalies,
      trend: roas > thresholds.roasMin ? "up" : roas < 1 ? "down" : "stable",
    };

    setCreatives((prev) => [newCreative, ...prev]);
    setFormData({
      name: "",
      campaignName: "",
      cpm: "",
      ctr: "",
      cpc: "",
      cpa: "",
      roas: "",
      spend: "",
      conversions: "",
      impressions: "",
      frequency: "",
    });
    setShowForm(false);
    toast.success("Creative ajoutée au monitoring");
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Performantes",
            value: summary.performant,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "À surveiller",
            value: summary.surveiller,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
          },
          {
            label: "Sous-perf.",
            value: summary.sousPerformant,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
          {
            label: "Dépense tot.",
            value: `${summary.totalSpend.toFixed(0)}€`,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Conversions",
            value: summary.totalConversions,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            label: "ROAS moy.",
            value: `${summary.avgRoas.toFixed(2)}x`,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              "p-3 rounded-xl border border-border-default",
              item.bg,
            )}
          >
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              {item.label}
            </p>
            <p className={cn("text-xl font-bold mt-1", item.color)}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Auto-refresh indicator + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          Dernier check : {lastCheck}
          <span className="text-text-muted/50">•</span>
          Prochain dans 6h
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Ajouter une creative
        </Button>
      </div>

      {/* Manual input form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" />
              Ajouter une creative manuellement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="col-span-2">
                <Label className="text-xs text-text-muted">
                  Nom de la creative
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Hook Douleur v4"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-text-muted">Campagne</Label>
                <Input
                  value={formData.campaignName}
                  onChange={(e) =>
                    setFormData({ ...formData, campaignName: e.target.value })
                  }
                  placeholder="Ex: Acquisition Cold"
                />
              </div>
              {[
                { key: "cpm" as const, label: "CPM (€)", placeholder: "8.50" },
                { key: "ctr" as const, label: "CTR (%)", placeholder: "2.1" },
                { key: "cpc" as const, label: "CPC (€)", placeholder: "0.40" },
                { key: "cpa" as const, label: "CPA (€)", placeholder: "22" },
                { key: "roas" as const, label: "ROAS (x)", placeholder: "3.5" },
                {
                  key: "spend" as const,
                  label: "Dépense (€)",
                  placeholder: "250",
                },
                {
                  key: "conversions" as const,
                  label: "Conversions",
                  placeholder: "12",
                },
                {
                  key: "impressions" as const,
                  label: "Impressions",
                  placeholder: "30000",
                },
                {
                  key: "frequency" as const,
                  label: "Fréquence",
                  placeholder: "1.5",
                },
              ].map((field) => (
                <div key={field.key}>
                  <Label className="text-xs text-text-muted">
                    {field.label}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData[field.key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.key]: e.target.value })
                    }
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCreative} size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules engine display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-accent" />
            Règles de classification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-bg-tertiary border border-border-default">
              <span className="text-text-muted">CTR min</span>
              <p className="font-semibold text-text-primary">
                {thresholds.ctrMin}%
              </p>
              <p className="text-[10px] text-red-400">{"< seuil = rouge"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-bg-tertiary border border-border-default">
              <span className="text-text-muted">CPA max</span>
              <p className="font-semibold text-text-primary">
                {thresholds.cpaMax}€
              </p>
              <p className="text-[10px] text-red-400">{"> seuil = rouge"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-bg-tertiary border border-border-default">
              <span className="text-text-muted">ROAS min</span>
              <p className="font-semibold text-text-primary">
                {thresholds.roasMin}x
              </p>
              <p className="text-[10px] text-red-400">{"< seuil = rouge"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-bg-tertiary border border-border-default">
              <span className="text-text-muted">Fréquence max</span>
              <p className="font-semibold text-text-primary">
                {thresholds.frequenceMax}
              </p>
              <p className="text-[10px] text-yellow-400">
                {"> seuil = fatigue"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creatives table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Créatives actives ({creatives.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {creatives.map((creative) => {
              const cfg = getStatusConfig(creative.status);
              return (
                <div
                  key={creative.id}
                  className="rounded-xl border border-border-default bg-bg-tertiary p-4"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)}
                      />
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {creative.name}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {creative.campaignName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          creative.status === "performant"
                            ? "default"
                            : creative.status === "a_surveiller"
                              ? "yellow"
                              : "red"
                        }
                      >
                        {cfg.label}
                      </Badge>
                      {creative.trend === "up" && (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      {creative.trend === "down" && (
                        <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      )}
                      {creative.trend === "stable" && (
                        <Activity className="h-3.5 w-3.5 text-text-muted" />
                      )}
                    </div>
                  </div>

                  {/* KPIs grid */}
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-2">
                    {[
                      {
                        label: "CPM",
                        value: `${creative.cpm.toFixed(2)}€`,
                        warn: creative.cpm > 12,
                      },
                      {
                        label: "CTR",
                        value: `${creative.ctr.toFixed(2)}%`,
                        warn: creative.ctr < thresholds.ctrMin,
                      },
                      {
                        label: "CPC",
                        value: `${creative.cpc.toFixed(2)}€`,
                        warn: creative.cpc > 1.5,
                      },
                      {
                        label: "CPA",
                        value: `${creative.cpa.toFixed(0)}€`,
                        warn: creative.cpa > thresholds.cpaMax,
                      },
                      {
                        label: "ROAS",
                        value: `${creative.roas.toFixed(1)}x`,
                        warn: creative.roas < thresholds.roasMin,
                      },
                      {
                        label: "Dépense",
                        value: `${creative.spend.toFixed(0)}€`,
                        warn: false,
                      },
                      {
                        label: "Conv.",
                        value: `${creative.conversions}`,
                        warn: false,
                      },
                    ].map((kpi) => (
                      <div key={kpi.label} className="text-center">
                        <p className="text-[9px] text-text-muted uppercase">
                          {kpi.label}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            kpi.warn ? "text-red-400" : "text-text-primary",
                          )}
                        >
                          {kpi.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Anomaly badges */}
                  {creative.anomalies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {creative.anomalies.map((anomaly) => (
                        <span
                          key={anomaly}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {anomaly}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 2: Décisions Auto (#70) ────────────────────────────

function DecisionsAutoTab() {
  const [decisions, setDecisions] = useState<Decision[]>(MOCK_DECISIONS);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(() => {
    try {
      const saved = localStorage.getItem("sf_ads_thresholds");
      return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  });
  const [showConfig, setShowConfig] = useState(false);

  const saveThresholds = useCallback((newThresholds: ThresholdConfig) => {
    setThresholds(newThresholds);
    localStorage.setItem("sf_ads_thresholds", JSON.stringify(newThresholds));
    toast.success("Seuils enregistrés");
  }, []);

  const handleApplyAll = () => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.status === "en_attente" ? { ...d, status: "applique" as const } : d,
      ),
    );
    toast.success("Toutes les recommandations ont été appliquées");
  };

  const handleCancelDecision = (id: string) => {
    setDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "annule" as const } : d)),
    );
  };

  const handleApplyDecision = (id: string) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "applique" as const } : d,
      ),
    );
    toast.success("Décision appliquée");
  };

  const pendingCount = decisions.filter(
    (d) => d.status === "en_attente",
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-text-secondary">
              {pendingCount} décision{pendingCount !== 1 ? "s" : ""} en attente
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-text-secondary">
              {decisions.filter((d) => d.status === "applique").length}{" "}
              appliquée
              {decisions.filter((d) => d.status === "applique").length !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings2 className="h-3.5 w-3.5 mr-1" />
            Configurer les seuils
          </Button>
          {pendingCount > 0 && (
            <Button size="sm" onClick={handleApplyAll}>
              <Zap className="h-3.5 w-3.5 mr-1" />
              Appliquer les recommandations ({pendingCount})
            </Button>
          )}
        </div>
      </div>

      {/* Configuration panel */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-accent" />
              Configuration des seuils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <Label className="text-xs text-text-muted">CPA max (€)</Label>
                <Input
                  type="number"
                  value={thresholds.cpaMax}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      cpaMax: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-text-muted">ROAS min</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={thresholds.roasMin}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      roasMin: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-text-muted">CTR min (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={thresholds.ctrMin}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      ctrMin: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-text-muted">Fréquence max</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={thresholds.frequenceMax}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      frequenceMax: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-text-muted">Scale (%)</Label>
                <Input
                  type="number"
                  value={thresholds.budgetScaleIncrement}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      budgetScaleIncrement: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                saveThresholds(thresholds);
                setShowConfig(false);
              }}
            >
              Enregistrer les seuils
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Decisions log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Journal des décisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {decisions.map((decision) => {
              const ActionIcon = getActionIcon(decision.actionType);
              return (
                <div
                  key={decision.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    decision.status === "en_attente"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : decision.status === "applique"
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-border-default bg-bg-tertiary opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={cn(
                          "p-2 rounded-lg mt-0.5",
                          decision.actionType === "couper"
                            ? "bg-red-500/10"
                            : decision.actionType === "scaler"
                              ? "bg-emerald-500/10"
                              : decision.actionType === "realloquer"
                                ? "bg-blue-500/10"
                                : decision.actionType === "fatigue"
                                  ? "bg-yellow-500/10"
                                  : "bg-purple-500/10",
                        )}
                      >
                        <ActionIcon
                          className={cn(
                            "h-4 w-4",
                            decision.actionType === "couper"
                              ? "text-red-400"
                              : decision.actionType === "scaler"
                                ? "text-emerald-400"
                                : decision.actionType === "realloquer"
                                  ? "text-blue-400"
                                  : decision.actionType === "fatigue"
                                    ? "text-yellow-400"
                                    : "text-purple-400",
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge
                            variant={getActionBadgeVariant(decision.actionType)}
                          >
                            {getActionLabel(decision.actionType)}
                          </Badge>
                          <span className="text-sm font-semibold text-text-primary">
                            {decision.creativeName}
                          </span>
                          <Badge
                            variant={getDecisionStatusBadge(decision.status)}
                          >
                            {getDecisionStatusLabel(decision.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary">
                          {decision.reason}
                        </p>
                        <p className="text-[10px] text-text-muted mt-1">
                          {decision.details}
                        </p>
                        <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTimestamp(decision.timestamp)}
                        </p>
                      </div>
                    </div>
                    {decision.status === "en_attente" && (
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApplyDecision(decision.id)}
                          className="h-7 px-2 text-emerald-400 hover:text-emerald-300"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelDecision(decision.id)}
                          className="h-7 px-2 text-red-400 hover:text-red-300"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
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

// ─── Tab 3: Cycle Créatif (#71) ─────────────────────────────

function CycleCreatifTab() {
  const [cycles] = useState<CreativeCycle[]>(MOCK_CYCLES);
  const [patterns] = useState<WinnerPattern[]>(MOCK_WINNER_PATTERNS);
  const [generating, setGenerating] = useState(false);
  const [generatedCreatives, setGeneratedCreatives] = useState<string | null>(
    null,
  );

  const winners = MOCK_CREATIVES.filter((c) => c.status === "performant");

  const handleGenerateCreatives = async () => {
    setGenerating(true);
    try {
      const winnerInfo = winners
        .map(
          (w) => `- ${w.name}: ROAS ${w.roas}x, CTR ${w.ctr}%, CPA ${w.cpa}€`,
        )
        .join("\n");
      const patternInfo = patterns
        .map((p) => `- ${p.element} (${p.category}, score: ${p.score}/100)`)
        .join("\n");

      const res = await fetch("/api/ai/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "creative_variations",
          context: `Génère 5 nouvelles variations de créatives publicitaires basées sur les patterns gagnants suivants.

CRÉATIVES GAGNANTES :
${winnerInfo}

PATTERNS IDENTIFIÉS :
${patternInfo}

Génère des variations innovantes qui reprennent ces patterns gagnants avec de nouveaux angles et hooks. Format: pour chaque creative, donne un nom, le hook, le body copy, le CTA, et l'angle utilisé.`,
        }),
      });

      if (res.ok) {
        const reader = res.body?.getReader();
        if (reader) {
          let result = "";
          const decoder = new TextDecoder();
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
            setGeneratedCreatives(result);
          }
        } else {
          const data = await res.json();
          setGeneratedCreatives(
            data.content || data.text || JSON.stringify(data),
          );
        }
        toast.success("Nouvelles créatives générées !");
      } else {
        // Fallback demo content
        setGeneratedCreatives("");
        toast.error("Erreur lors de la génération des créatives");
      }
    } catch {
      setGeneratedCreatives("");
      toast.error("Erreur lors de la génération des créatives");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cycle tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            Cycle créatif hebdomadaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {cycles.map((cycle, i) => (
              <div key={cycle.week} className="flex items-center shrink-0">
                <div
                  className={cn(
                    "p-3 rounded-xl border min-w-[140px]",
                    cycle.status === "en_cours"
                      ? "border-accent bg-accent/10"
                      : cycle.status === "termine"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border-default bg-bg-tertiary",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-text-primary">
                      Semaine {cycle.week}
                    </span>
                    <Badge
                      variant={
                        cycle.status === "en_cours"
                          ? "default"
                          : cycle.status === "termine"
                            ? "default"
                            : "muted"
                      }
                      className="text-[9px] px-1.5"
                    >
                      {cycle.status === "en_cours"
                        ? "En cours"
                        : cycle.status === "termine"
                          ? "Terminé"
                          : "Planifié"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-text-muted">
                    {cycle.startDate} → {cycle.endDate}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="text-emerald-400">
                      {cycle.winnersCount} gagnantes
                    </span>
                    <span className="text-red-400">
                      {cycle.losersCount} coupées
                    </span>
                    <span className="text-blue-400">
                      {cycle.newCreatives} nouvelles
                    </span>
                  </div>
                </div>
                {i < cycles.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-text-muted mx-1 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current winners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Créatives gagnantes cette semaine ({winners.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {winners.length > 0 ? (
            <div className="space-y-2">
              {winners.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {w.name}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {w.campaignName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-400 font-semibold">
                      ROAS {w.roas}x
                    </span>
                    <span className="text-text-secondary">CTR {w.ctr}%</span>
                    <span className="text-text-secondary">CPA {w.cpa}€</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-4">
              Aucune creative gagnante cette semaine.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Winner patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Patterns gagnants identifiés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {patterns.map((pattern) => (
              <div
                key={pattern.element}
                className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="muted" className="text-[10px]">
                    {pattern.category}
                  </Badge>
                  <span className="text-sm text-text-primary">
                    {pattern.element}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${pattern.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-accent w-8 text-right">
                    {pattern.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate new creatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Générer de nouvelles créatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generatedCreatives ? (
            <div>
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="text-sm text-text-secondary whitespace-pre-wrap rounded-xl bg-bg-tertiary border border-border-default p-4">
                  {generatedCreatives}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateCreatives}
                  disabled={generating}
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5 mr-1",
                      generating && "animate-spin",
                    )}
                  />
                  Regénérer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setGeneratedCreatives(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-text-muted mb-4">
                Génère de nouvelles variations basées sur les patterns gagnants
                de tes meilleures créatives.
              </p>
              <Button onClick={handleGenerateCreatives} disabled={generating}>
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Générer nouvelles créatives
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 4: Scaling (#72) ───────────────────────────────────

function ScalingTab() {
  const [tiers] = useState<ScalingTier[]>(SCALING_TIERS);
  const [budgetHistory] = useState<BudgetHistory[]>(MOCK_BUDGET_HISTORY);

  const currentBudget = budgetHistory[budgetHistory.length - 1]?.budget ?? 0;
  const currentRoas = budgetHistory[budgetHistory.length - 1]?.roas ?? 0;
  const currentTier =
    tiers.find(
      (t) => currentBudget >= t.budgetMin && currentBudget < t.budgetMax,
    ) || tiers[0];

  // Find if rollback happened
  const rollbackIndex = budgetHistory.findIndex(
    (h, i) => i > 0 && h.budget < budgetHistory[i - 1].budget,
  );

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Budget actuel</p>
                <p className="text-2xl font-bold text-accent">
                  {currentBudget}€
                  <span className="text-sm text-text-muted">/jour</span>
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">ROAS actuel</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {currentRoas}x
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Palier actuel</p>
                <p className="text-lg font-bold text-text-primary">
                  {currentTier.label}
                </p>
              </div>
              <Layers className="h-5 w-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scaling tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Règles de scaling progressif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tiers.map((tier) => {
              const isCurrent = tier.id === currentTier.id;
              const isPassed = currentBudget >= tier.budgetMax;
              const meetsRoas = currentRoas >= tier.roasRequired;

              return (
                <div
                  key={tier.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    isCurrent
                      ? "border-accent bg-accent/10"
                      : isPassed
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-border-default bg-bg-tertiary",
                  )}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          isCurrent
                            ? "bg-accent text-white"
                            : isPassed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-bg-secondary text-text-muted",
                        )}
                      >
                        {tier.id}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isCurrent ? "text-accent" : "text-text-primary",
                          )}
                        >
                          {tier.label}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          Budget : {tier.budgetMin}€ —{" "}
                          {tier.budgetMax === 99999
                            ? "\u221E"
                            : `${tier.budgetMax}€`}
                          /jour
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-text-muted">Scale</p>
                        <p className="text-sm font-semibold text-text-primary">
                          +{tier.scalePercent}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">ROAS requis</p>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isCurrent && meetsRoas
                              ? "text-emerald-400"
                              : isCurrent && !meetsRoas
                                ? "text-red-400"
                                : "text-text-primary",
                          )}
                        >
                          {tier.roasRequired}x
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge variant={meetsRoas ? "default" : "yellow"}>
                          {meetsRoas ? "Éligible" : "ROAS insuffisant"}
                        </Badge>
                      )}
                      {isPassed && (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Validé
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isCurrent && meetsRoas && (
                    <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <p className="text-xs text-accent flex items-center gap-1.5">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Recommandation : augmenter le budget de {currentBudget}€
                        à{" "}
                        {Math.round(
                          currentBudget * (1 + tier.scalePercent / 100),
                        )}
                        €/jour (+{tier.scalePercent}%)
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rollback rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-accent" />
            Règles de rollback automatique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                rule: "Si le ROAS baisse de plus de 30% en 48h",
                action: "Rollback au budget précédent",
                severity: "red",
              },
              {
                rule: "Si le CPA dépasse 2x le seuil pendant 24h",
                action: "Réduction de 25% du budget",
                severity: "yellow",
              },
              {
                rule: "Si le CTR passe sous 0.5% après un scale",
                action: "Pause et analyse avant reprise",
                severity: "yellow",
              },
              {
                rule: "Si les dépenses dépassent le plafond journalier de 10%",
                action: "Alerte + cap automatique",
                severity: "blue",
              },
            ].map((item) => (
              <div
                key={item.rule}
                className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-default"
              >
                <ShieldAlert
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    item.severity === "red"
                      ? "text-red-400"
                      : item.severity === "yellow"
                        ? "text-yellow-400"
                        : "text-blue-400",
                  )}
                />
                <div>
                  <p className="text-sm text-text-primary">{item.rule}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {"\u2192"} {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {rollbackIndex > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-purple-400 flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Dernier rollback : {budgetHistory[rollbackIndex].date} — Budget
                réduit de {budgetHistory[rollbackIndex - 1].budget}€ à{" "}
                {budgetHistory[rollbackIndex].budget}€ (ROAS tombé à{" "}
                {budgetHistory[rollbackIndex].roas}x)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget progression chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Progression du budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budgetHistory}>
                <defs>
                  <linearGradient
                    id="budgetGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D32" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="budget"
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={(v) => `${v}\u20AC`}
                />
                <YAxis
                  yAxisId="roas"
                  orientation="right"
                  stroke="#6B7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(v) => `${v}x`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C1F23",
                    border: "1px solid #2A2D32",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <ReferenceLine
                  yAxisId="budget"
                  y={50}
                  stroke="#A78BFA"
                  strokeDasharray="3 3"
                  label={{
                    value: "Palier 2",
                    position: "right",
                    fill: "#A78BFA",
                    fontSize: 10,
                  }}
                />
                <Area
                  yAxisId="budget"
                  type="monotone"
                  dataKey="budget"
                  stroke="#34D399"
                  strokeWidth={2}
                  fill="url(#budgetGradient)"
                  name="Budget (\u20AC/jour)"
                />
                <Line
                  yAxisId="roas"
                  type="monotone"
                  dataKey="roas"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="ROAS"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 rounded" /> Budget
              (\u20AC/jour)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-400 rounded" /> ROAS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-purple-400 rounded" /> Seuil palier
              2
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// ─── Main Component ─────────────────────────────────────────

export function AdsAutomation() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="monitoring">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="monitoring" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Décisions Auto
          </TabsTrigger>
          <TabsTrigger value="cycle" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Cycle Créatif
          </TabsTrigger>
          <TabsTrigger value="scaling" className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Scaling
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <MonitoringTab />
        </TabsContent>
        <TabsContent value="decisions">
          <DecisionsAutoTab />
        </TabsContent>
        <TabsContent value="cycle">
          <CycleCreatifTab />
        </TabsContent>
        <TabsContent value="scaling">
          <ScalingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
