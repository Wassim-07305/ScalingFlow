"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  TrendingUp,
  Loader2,
  CheckCircle,
  DollarSign,
  Layers,
  Target,
  ShieldAlert,
  RotateCcw,
  BarChart3,
  ArrowUpRight,
  Clock,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────

interface ScalingEntry {
  id: string;
  campaign_id: string | null;
  campaign_name: string;
  creative_name: string;
  tier_level: number;
  previous_budget: number;
  new_budget: number;
  scale_percent: number;
  roas_at_scale: number;
  roas_after_24h: number | null;
  roas_threshold: number;
  status: "pending" | "active" | "validated" | "rollback" | "failed";
  rollback_at: string | null;
  validated_at: string | null;
  created_at: string;
  check_at: string | null;
}

interface Campaign {
  id: string;
  campaign_name: string;
  daily_budget: number;
  roas: number;
  status: string;
  meta_adset_id: string | null;
}

// ─── Helpers ────────────────────────────────────────────────

function getStatusConfig(status: ScalingEntry["status"]) {
  switch (status) {
    case "pending":
      return { label: "En attente", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
    case "active":
      return { label: "En cours", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" };
    case "validated":
      return { label: "Validé", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    case "rollback":
      return { label: "Rollback", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" };
    case "failed":
      return { label: "Échoué", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
  }
}

function getTierLabel(level: number) {
  switch (level) {
    case 1: return "Palier 1 — Démarrage";
    case 2: return "Palier 2 — Croissance";
    case 3: return "Palier 3 — Accélération";
    case 4: return "Palier 4 — Volume";
    default: return `Palier ${level}`;
  }
}

function getTierConfig(budget: number) {
  if (budget < 50) return { level: 1, scalePercent: 20, roasRequired: 2.0 };
  if (budget < 200) return { level: 2, scalePercent: 15, roasRequired: 2.5 };
  if (budget < 500) return { level: 3, scalePercent: 10, roasRequired: 3.0 };
  return { level: 4, scalePercent: 5, roasRequired: 3.5 };
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ─── Skeleton Loader ────────────────────────────────────────

function ScalingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-bg-tertiary" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-bg-tertiary" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-bg-tertiary" />
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export function ScalingDashboard() {
  const { user, loading: userLoading } = useUser();
  const [entries, setEntries] = useState<ScalingEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [scaling, setScaling] = useState(false);
  const [showScaleForm, setShowScaleForm] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [scalePercent, setScalePercent] = useState("20");
  const [roasThreshold, setRoasThreshold] = useState("1.5");
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [entriesRes, campaignsRes] = await Promise.all([
      supabase
        .from("ad_scaling_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("ad_campaigns")
        .select("id, campaign_name, daily_budget, roas, status, meta_adset_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    if (entriesRes.error) toast.error("Impossible de charger l'historique de scaling");
    if (campaignsRes.error) toast.error("Impossible de charger les campagnes");

    setEntries(entriesRes.data ?? []);
    setCampaigns(campaignsRes.data ?? []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchData();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading, fetchData]);

  const handleScale = async () => {
    if (!selectedCampaignId) {
      toast.error("Sélectionne une campagne");
      return;
    }
    setScaling(true);
    try {
      const res = await fetch("/api/ads/scale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: selectedCampaignId,
          scale_percent: parseFloat(scalePercent) || 20,
          roas_threshold: parseFloat(roasThreshold) || 1.5,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowScaleForm(false);
        await fetchData();
      } else {
        toast.error(data.error || "Erreur lors du scaling");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setScaling(false);
    }
  };

  const handleRollback = async (scalingId: string) => {
    try {
      const res = await fetch("/api/ads/scale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", scaling_id: scalingId }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        await fetchData();
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  if (loading || userLoading) {
    return <ScalingSkeleton />;
  }

  const activeScalings = entries.filter((e) => e.status === "active");
  const validatedScalings = entries.filter((e) => e.status === "validated");
  const rollbackScalings = entries.filter((e) => e.status === "rollback");

  // Build chart data from entries
  const chartData = [...entries]
    .reverse()
    .map((e) => ({
      date: formatDate(e.created_at),
      budget: e.new_budget,
      roas: e.roas_after_24h ?? e.roas_at_scale,
      tier: e.tier_level,
      status: e.status,
    }));

  // Current highest budget among active campaigns
  const currentMaxBudget = campaigns.reduce((max, c) => Math.max(max, c.daily_budget ?? 0), 0);
  const currentTier = getTierConfig(currentMaxBudget);

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Budget max actif",
            value: `${currentMaxBudget}€`,
            suffix: "/jour",
            color: "text-accent",
            icon: DollarSign,
          },
          {
            label: "Palier actuel",
            value: getTierLabel(currentTier.level),
            suffix: "",
            color: "text-purple-400",
            icon: Layers,
          },
          {
            label: "Scalings validés",
            value: `${validatedScalings.length}`,
            suffix: "",
            color: "text-emerald-400",
            icon: CheckCircle,
          },
          {
            label: "Rollbacks",
            value: `${rollbackScalings.length}`,
            suffix: "",
            color: "text-purple-400",
            icon: RotateCcw,
          },
        ].map((item) => (
          <div key={item.label} className="p-4 rounded-xl border border-border-default bg-bg-tertiary">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{item.label}</p>
              <item.icon className={cn("h-4 w-4", item.color)} />
            </div>
            <p className={cn("text-lg font-bold", item.color)}>
              {item.value}
              {item.suffix && <span className="text-xs text-text-muted">{item.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Scale action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Target className="h-3.5 w-3.5" />
          {activeScalings.length > 0
            ? `${activeScalings.length} scaling${activeScalings.length > 1 ? "s" : ""} en cours de vérification`
            : "Aucun scaling actif"}
        </div>
        <Button
          size="sm"
          onClick={() => setShowScaleForm(!showScaleForm)}
          className="bg-accent hover:bg-accent/90"
          disabled={campaigns.length === 0}
        >
          <Rocket className="h-3.5 w-3.5 mr-1.5" />
          Lancer un scaling
        </Button>
      </div>

      {/* Scale form */}
      {showScaleForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Rocket className="h-4 w-4 text-accent" />
              Scaling progressif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <Label className="text-xs text-text-muted">Campagne</Label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-border-default bg-bg-tertiary text-text-primary px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner une campagne</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.campaign_name} — {c.daily_budget ?? 0}€/jour (ROAS {c.roas ?? 0}x)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-text-muted">Augmentation (%)</Label>
                <Input
                  type="number"
                  value={scalePercent}
                  onChange={(e) => setScalePercent(e.target.value)}
                  min="5"
                  max="50"
                  step="5"
                />
              </div>
              <div>
                <Label className="text-xs text-text-muted">ROAS minimum</Label>
                <Input
                  type="number"
                  value={roasThreshold}
                  onChange={(e) => setRoasThreshold(e.target.value)}
                  min="0.5"
                  step="0.1"
                />
              </div>
            </div>

            {selectedCampaignId && (() => {
              const selected = campaigns.find((c) => c.id === selectedCampaignId);
              if (!selected) return null;
              const newBudget = Math.round((selected.daily_budget ?? 0) * (1 + (parseFloat(scalePercent) || 20) / 100));
              return (
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 mb-4">
                  <p className="text-xs text-accent flex items-center gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Budget passera de {selected.daily_budget ?? 0}€ à {newBudget}€/jour (+{scalePercent}%)
                    — Vérification du ROAS après 24h (seuil: {roasThreshold}x)
                  </p>
                </div>
              );
            })()}

            <div className="flex gap-2">
              <Button onClick={handleScale} disabled={scaling || !selectedCampaignId} size="sm">
                {scaling ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Rocket className="h-3.5 w-3.5 mr-1.5" />
                )}
                Lancer le scaling
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowScaleForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scaling tiers reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Règles de scaling progressif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: 1, label: "Palier 1 — Démarrage", budgetRange: "0€ — 50€", scalePercent: 20, roasRequired: 2.0 },
              { id: 2, label: "Palier 2 — Croissance", budgetRange: "50€ — 200€", scalePercent: 15, roasRequired: 2.5 },
              { id: 3, label: "Palier 3 — Accélération", budgetRange: "200€ — 500€", scalePercent: 10, roasRequired: 3.0 },
              { id: 4, label: "Palier 4 — Volume", budgetRange: "500€+", scalePercent: 5, roasRequired: 3.5 },
            ].map((tier) => {
              const isCurrent = tier.id === currentTier.level;
              const isPassed = currentTier.level > tier.id;
              const meetsRoas = campaigns.some((c) => (c.roas ?? 0) >= tier.roasRequired);

              return (
                <div
                  key={tier.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    isCurrent
                      ? "border-accent bg-accent/10"
                      : isPassed
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-border-default bg-bg-tertiary"
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
                              : "bg-bg-secondary text-text-muted"
                        )}
                      >
                        {tier.id}
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold", isCurrent ? "text-accent" : "text-text-primary")}>
                          {tier.label}
                        </p>
                        <p className="text-[10px] text-text-muted">Budget : {tier.budgetRange}/jour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-text-muted">Scale</p>
                        <p className="text-sm font-semibold text-text-primary">+{tier.scalePercent}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">ROAS requis</p>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isCurrent && meetsRoas ? "text-emerald-400" : isCurrent ? "text-red-400" : "text-text-primary"
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
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Budget progression chart */}
      {chartData.length > 1 && (
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
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scalingBudgetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D32" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
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
                    yAxisId="roas"
                    y={parseFloat(roasThreshold) || 1.5}
                    stroke="#A78BFA"
                    strokeDasharray="3 3"
                    label={{ value: "ROAS min", position: "right", fill: "#A78BFA", fontSize: 10 }}
                  />
                  <Area
                    yAxisId="budget"
                    type="monotone"
                    dataKey="budget"
                    stroke="#34D399"
                    strokeWidth={2}
                    fill="url(#scalingBudgetGradient)"
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
                <span className="w-3 h-0.5 bg-emerald-400 rounded" /> Budget (\u20AC/jour)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-400 rounded" /> ROAS
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-purple-400 rounded" /> ROAS minimum
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scaling history */}
      {entries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Historique des scalings ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.map((entry) => {
                const cfg = getStatusConfig(entry.status);

                return (
                  <div
                    key={entry.id}
                    className={cn("rounded-xl border p-4 transition-all", cfg.border, cfg.bg)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("p-2 rounded-lg mt-0.5", cfg.bg)}>
                          {entry.status === "validated" ? (
                            <CheckCircle className={cn("h-4 w-4", cfg.color)} />
                          ) : entry.status === "rollback" ? (
                            <RotateCcw className={cn("h-4 w-4", cfg.color)} />
                          ) : entry.status === "active" ? (
                            <Loader2 className={cn("h-4 w-4 animate-spin", cfg.color)} />
                          ) : (
                            <ArrowUpRight className={cn("h-4 w-4", cfg.color)} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {entry.campaign_name}
                            </span>
                            <Badge variant={cfg.color.includes("emerald") ? "default" : cfg.color.includes("purple") ? "purple" : cfg.color.includes("yellow") ? "yellow" : cfg.color.includes("blue") ? "blue" : "red"}>
                              {cfg.label}
                            </Badge>
                            <Badge variant="muted">{getTierLabel(entry.tier_level)}</Badge>
                          </div>
                          <p className="text-xs text-text-secondary">
                            Budget : {entry.previous_budget}€ → {entry.new_budget}€/jour (+{entry.scale_percent}%)
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-[10px]">
                            <span className="text-text-muted">
                              ROAS au scaling : <span className="text-text-primary font-semibold">{entry.roas_at_scale?.toFixed(2) ?? "—"}x</span>
                            </span>
                            {entry.roas_after_24h !== null && (
                              <span className="text-text-muted">
                                ROAS après 24h : <span className={cn("font-semibold", (entry.roas_after_24h ?? 0) >= entry.roas_threshold ? "text-emerald-400" : "text-red-400")}>
                                  {entry.roas_after_24h?.toFixed(2) ?? "—"}x
                                </span>
                              </span>
                            )}
                            <span className="text-text-muted">
                              Seuil : <span className="text-text-primary font-semibold">{entry.roas_threshold}x</span>
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted mt-2 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTimestamp(entry.created_at)}
                            {entry.check_at && entry.status === "active" && (
                              <> · Vérification prévue {formatTimestamp(entry.check_at)}</>
                            )}
                            {entry.validated_at && (
                              <> · Validé {formatTimestamp(entry.validated_at)}</>
                            )}
                            {entry.rollback_at && (
                              <> · Rollback {formatTimestamp(entry.rollback_at)}</>
                            )}
                          </p>
                        </div>
                      </div>
                      {entry.status === "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRollback(entry.id)}
                          className="h-7 px-2 text-purple-400 hover:text-purple-300 shrink-0"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Rollback</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-full bg-accent/10 mb-4">
                <Rocket className="h-8 w-8 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">Aucun scaling lancé</p>
              <p className="text-xs text-text-muted">
                Sélectionne une campagne performante et lance un scaling progressif pour augmenter ton budget par paliers.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
              { rule: "Si le ROAS passe sous le seuil après 24h", action: "Rollback au budget précédent", severity: "red" },
              { rule: "Si le ROAS baisse de plus de 30% en 48h", action: "Rollback immédiat + alerte", severity: "red" },
              { rule: "Si le CPA dépasse 2x le seuil pendant 24h", action: "Réduction de 25% du budget", severity: "yellow" },
              { rule: "Si les dépenses dépassent le plafond de 10%", action: "Cap automatique + notification", severity: "blue" },
            ].map((item) => (
              <div key={item.rule} className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-default">
                <ShieldAlert
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    item.severity === "red" ? "text-red-400" : item.severity === "yellow" ? "text-yellow-400" : "text-blue-400"
                  )}
                />
                <div>
                  <p className="text-sm text-text-primary">{item.rule}</p>
                  <p className="text-xs text-text-muted mt-0.5">{"\u2192"} {item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
