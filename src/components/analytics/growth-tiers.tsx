"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  Rocket,
  TrendingUp,
  Crown,
  Target,
  Zap,
  CheckCircle,
  Circle,
  ArrowRight,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── Growth Tier Definitions ────────────────────────────────

interface GrowthTier {
  id: string;
  name: string;
  icon: React.ElementType;
  revenueMin: number;
  revenueMax: number;
  color: string;
  bgColor: string;
  accentHex: string;
  badgeVariant: "default" | "blue" | "cyan" | "purple" | "red" | "yellow" | "muted";
  checkpoints: string[];
  nextActions: string[];
}

const GROWTH_TIERS: GrowthTier[] = [
  {
    id: "launch",
    name: "Lancement",
    icon: Rocket,
    revenueMin: 0,
    revenueMax: 5000,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    accentHex: "#60A5FA",
    badgeVariant: "blue",
    checkpoints: [
      "Analyse de marché terminée",
      "Offre créée et validée",
      "Funnel de vente en place",
      "Premières publicités lancées",
      "Premier client signé",
    ],
    nextActions: [
      "Optimise ton offre avec les retours clients",
      "Teste 3 angles publicitaires différents",
      "Mets en place un suivi des KPIs",
    ],
  },
  {
    id: "traction",
    name: "Traction",
    icon: TrendingUp,
    revenueMin: 5000,
    revenueMax: 15000,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    accentHex: "#34D399",
    badgeVariant: "default",
    checkpoints: [
      "ROAS > 2x stable sur 7 jours",
      "Pipeline de vente régulier (5+ leads/semaine)",
      "Système de contenu en place",
      "Séquences email automatisées",
      "3+ témoignages clients",
    ],
    nextActions: [
      "Scale tes campagnes gagnantes (budget x2)",
      "Crée un système de referral",
      "Automatise le suivi prospect",
    ],
  },
  {
    id: "growth",
    name: "Croissance",
    icon: Target,
    revenueMin: 15000,
    revenueMax: 50000,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    accentHex: "#A78BFA",
    badgeVariant: "purple",
    checkpoints: [
      "CPA < 50\u20AC stable",
      "LTV/CAC > 3x",
      "Multi-canal (Meta + contenu organique)",
      "Équipe ou assistants en place",
      "Process de vente documenté",
    ],
    nextActions: [
      "Diversifie tes canaux d'acquisition",
      "Lance une offre complémentaire (OTO/upsell)",
      "Construis ton personal branding",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    icon: Crown,
    revenueMin: 50000,
    revenueMax: Infinity,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    accentHex: "#FBBF24",
    badgeVariant: "yellow",
    checkpoints: [
      "Revenu prévisible et récurrent",
      "Équipe structurée (ops, marketing, vente)",
      "Multiple sources de revenus",
      "Communauté engagée (1000+ membres)",
      "Personal branding fort",
    ],
    nextActions: [
      "Crée une communauté payante premium",
      "Explore de nouveaux marchés / international",
      "Développe un programme de formation/certification",
    ],
  },
];

// ─── Types ──────────────────────────────────────────────────

interface MonthlyRevenue {
  month: string; // "2026-01"
  label: string; // "Jan 2026"
  total: number;
}

interface GrowthTiersProps {
  completedCheckpoints?: Record<string, string[]>;
  className?: string;
}

// ─── Helpers ────────────────────────────────────────────────

const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

function formatEur(n: number): string {
  return n.toLocaleString("fr-FR") + "\u00A0\u20AC";
}

// ─── Component ──────────────────────────────────────────────

export function GrowthTiers({
  completedCheckpoints = {},
  className,
}: GrowthTiersProps) {
  const { user } = useUser();
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  // Fetch revenue entries from Supabase, grouped by month
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const fetchRevenue = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("revenue_entries")
          .select("amount, entry_date")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: true });

        if (error || !data || data.length === 0) {
          setHasData(false);
          setLoading(false);
          return;
        }

        setHasData(true);

        // Group by month
        const grouped: Record<string, number> = {};
        for (const entry of data) {
          const d = new Date(entry.entry_date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          grouped[key] = (grouped[key] || 0) + Number(entry.amount);
        }

        // Build sorted array
        const months: MonthlyRevenue[] = Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, total]) => {
            const [y, m] = key.split("-");
            return {
              month: key,
              label: `${MONTH_LABELS[parseInt(m) - 1]} ${y}`,
              total: Math.round(total),
            };
          });

        setMonthlyData(months);
      } catch {
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [user]);

  // Current month's revenue
  const currentMonthlyCA = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    return monthlyData[monthlyData.length - 1].total;
  }, [monthlyData]);

  // Previous month for growth rate
  const previousMonthlyCA = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    return monthlyData[monthlyData.length - 2].total;
  }, [monthlyData]);

  const growthRate = useMemo(() => {
    if (previousMonthlyCA <= 0) return null;
    return Math.round(((currentMonthlyCA - previousMonthlyCA) / previousMonthlyCA) * 100);
  }, [currentMonthlyCA, previousMonthlyCA]);

  // Determine current tier
  const currentTier = useMemo(() => {
    for (let i = GROWTH_TIERS.length - 1; i >= 0; i--) {
      if (currentMonthlyCA >= GROWTH_TIERS[i].revenueMin) {
        return GROWTH_TIERS[i];
      }
    }
    return GROWTH_TIERS[0];
  }, [currentMonthlyCA]);

  const currentTierIndex = GROWTH_TIERS.findIndex((t) => t.id === currentTier.id);
  const nextTier = currentTierIndex < GROWTH_TIERS.length - 1
    ? GROWTH_TIERS[currentTierIndex + 1]
    : null;

  // Progress toward next tier
  const progressToNext = useMemo(() => {
    if (!nextTier) return 100;
    const range = nextTier.revenueMin - currentTier.revenueMin;
    const progress = currentMonthlyCA - currentTier.revenueMin;
    return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
  }, [currentMonthlyCA, currentTier, nextTier]);

  // Estimated months to reach next tier
  const monthsToNextTier = useMemo(() => {
    if (!nextTier || !growthRate || growthRate <= 0) return null;
    const remaining = nextTier.revenueMin - currentMonthlyCA;
    if (remaining <= 0) return 0;
    const monthlyGrowthAbs = currentMonthlyCA * (growthRate / 100);
    if (monthlyGrowthAbs <= 0) return null;
    return Math.ceil(remaining / monthlyGrowthAbs);
  }, [nextTier, growthRate, currentMonthlyCA]);

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-16", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-accent mr-3" />
        <span className="text-text-secondary text-sm">Chargement des données de revenus...</span>
      </div>
    );
  }

  // ─── No data ──────────────────────────────────────────────
  if (!hasData) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-text-muted mb-4" />
          <p className="text-text-secondary font-medium mb-2">Aucune donnée de revenu</p>
          <p className="text-text-muted text-sm max-w-md mb-5">
            Ajoute tes revenus dans le suivi de CA pour voir ta progression à travers les paliers de croissance.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = "/ads?tab=analytics";
            }}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Aller au suivi de CA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* ─── Key Metrics ─────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">CA mensuel</p>
            <p className="text-2xl font-bold text-text-primary">{formatEur(currentMonthlyCA)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Taux de croissance</p>
            {growthRate !== null ? (
              <p className={cn("text-2xl font-bold", growthRate >= 0 ? "text-emerald-400" : "text-red-400")}>
                {growthRate >= 0 ? "+" : ""}{growthRate}%
              </p>
            ) : (
              <p className="text-lg text-text-muted">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Prochain palier dans</p>
            {monthsToNextTier !== null && nextTier ? (
              <p className="text-2xl font-bold text-text-primary">
                {monthsToNextTier === 0 ? "Atteint !" : `~${monthsToNextTier} mois`}
              </p>
            ) : nextTier ? (
              <p className="text-lg text-text-muted">—</p>
            ) : (
              <p className="text-lg font-bold text-amber-400">Palier max !</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Current Tier + Progress ─────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentTier.icon className={cn("h-5 w-5", currentTier.color)} />
            Palier actuel : {currentTier.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              CA mensuel : <strong className="text-text-primary">{formatEur(currentMonthlyCA)}</strong>
            </span>
            {nextTier && (
              <span className="text-text-muted">
                Prochain palier : {formatEur(nextTier.revenueMin)}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="relative h-3 rounded-full bg-bg-primary overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                currentTier.bgColor.replace("/10", "/40")
              )}
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-text-muted text-right">{progressToNext}%</p>

          {/* Next actions */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Actions recommandées</p>
            <div className="space-y-2">
              {currentTier.nextActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", currentTier.color)} />
                  <p className="text-sm text-text-secondary">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Growth Trajectory Chart ─────────────────────────── */}
      {monthlyData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" />
              Trajectoire de croissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentTier.accentHex} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={currentTier.accentHex} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={{ stroke: "#1C1F23" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={{ stroke: "#1C1F23" }}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141719",
                      border: "1px solid #1C1F23",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#9CA3AF" }}
                    formatter={(value?: number) => [formatEur(value ?? 0), "CA"]}
                  />
                  {/* Reference lines for tier thresholds */}
                  {GROWTH_TIERS.filter(t => t.revenueMin > 0 && t.revenueMin < Infinity).map((t) => (
                    <ReferenceLine
                      key={t.id}
                      y={t.revenueMin}
                      stroke={t.accentHex}
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                      label={{
                        value: t.name,
                        position: "right",
                        fill: t.accentHex,
                        fontSize: 10,
                      }}
                    />
                  ))}
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={currentTier.accentHex}
                    strokeWidth={2}
                    fill="url(#growthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── All Tiers Grid ──────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {GROWTH_TIERS.map((tier) => {
          const isActive = tier.id === currentTier.id;
          const isPast = GROWTH_TIERS.indexOf(tier) < currentTierIndex;
          const completed = completedCheckpoints[tier.id] || [];

          return (
            <Card
              key={tier.id}
              className={cn(
                "transition-all",
                isActive && "ring-1 ring-accent/30",
                !isActive && !isPast && "opacity-60"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", tier.bgColor)}>
                      <tier.icon className={cn("h-4 w-4", tier.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tier.name}</p>
                      <p className="text-xs text-text-muted font-normal">
                        {tier.revenueMax < Infinity
                          ? `${tier.revenueMin.toLocaleString("fr-FR")} - ${tier.revenueMax.toLocaleString("fr-FR")}\u00A0\u20AC/mois`
                          : `${tier.revenueMin.toLocaleString("fr-FR")}\u00A0\u20AC+/mois`}
                      </p>
                    </div>
                  </div>
                  {isActive && <Badge variant="default">Actuel</Badge>}
                  {isPast && <Badge variant="muted">Complété</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {tier.checkpoints.map((cp, i) => {
                    const isDone = isPast || completed.includes(cp);
                    return (
                      <div key={i} className="flex items-start gap-2">
                        {isDone ? (
                          <CheckCircle className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                        )}
                        <p className={cn("text-xs", isDone ? "text-text-secondary" : "text-text-muted")}>
                          {cp}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Show tier-specific actions when active */}
                {isActive && (
                  <div className="mt-4 pt-3 border-t border-border-default">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
                      Actions pour ce palier
                    </p>
                    {tier.nextActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <ArrowRight className={cn("h-3 w-3 mt-0.5 shrink-0", tier.color)} />
                        <p className="text-xs text-text-secondary">{action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
