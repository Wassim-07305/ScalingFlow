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
  DollarSign,
  Users,
  Clock,
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
interface LTVCACEntry {
  date: string; // YYYY-MM
  avgDealValue: number;
  monthlyChurnRate: number; // as decimal 0.05 = 5%
  monthlyAdSpend: number;
  newCustomers: number;
}

interface ComputedMetrics {
  ltv: number;
  cac: number;
  ratio: number;
  paybackMonths: number;
  monthlyRevenuePerCustomer: number;
}

// ─── Demo data ───────────────────────────────────────────────
const DEMO_ENTRIES: LTVCACEntry[] = [
  {
    date: "2025-09",
    avgDealValue: 997,
    monthlyChurnRate: 0.08,
    monthlyAdSpend: 3200,
    newCustomers: 8,
  },
  {
    date: "2025-10",
    avgDealValue: 997,
    monthlyChurnRate: 0.07,
    monthlyAdSpend: 3500,
    newCustomers: 10,
  },
  {
    date: "2025-11",
    avgDealValue: 1497,
    monthlyChurnRate: 0.06,
    monthlyAdSpend: 4000,
    newCustomers: 11,
  },
  {
    date: "2025-12",
    avgDealValue: 1497,
    monthlyChurnRate: 0.06,
    monthlyAdSpend: 4200,
    newCustomers: 13,
  },
  {
    date: "2026-01",
    avgDealValue: 1997,
    monthlyChurnRate: 0.05,
    monthlyAdSpend: 4500,
    newCustomers: 14,
  },
  {
    date: "2026-02",
    avgDealValue: 1997,
    monthlyChurnRate: 0.05,
    monthlyAdSpend: 5000,
    newCustomers: 16,
  },
  {
    date: "2026-03",
    avgDealValue: 2497,
    monthlyChurnRate: 0.04,
    monthlyAdSpend: 5500,
    newCustomers: 18,
  },
];

// ─── Supabase helpers ────────────────────────────────────────
async function loadEntriesFromDB(userId: string): Promise<LTVCACEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ltv_cac_entries")
    .select(
      "date, avg_deal_value, monthly_churn_rate, monthly_ad_spend, new_customers",
    )
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (!data || data.length === 0) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row: any) => ({
    date: row.date,
    avgDealValue: Number(row.avg_deal_value),
    monthlyChurnRate: Number(row.monthly_churn_rate),
    monthlyAdSpend: Number(row.monthly_ad_spend),
    newCustomers: row.new_customers,
  }));
}

async function upsertEntryToDB(userId: string, entry: LTVCACEntry) {
  const supabase = createClient();
  await supabase.from("ltv_cac_entries").upsert(
    {
      user_id: userId,
      date: entry.date,
      avg_deal_value: entry.avgDealValue,
      monthly_churn_rate: entry.monthlyChurnRate,
      monthly_ad_spend: entry.monthlyAdSpend,
      new_customers: entry.newCustomers,
    },
    { onConflict: "user_id,date" },
  );
}

async function clearEntriesFromDB(userId: string) {
  const supabase = createClient();
  await supabase.from("ltv_cac_entries").delete().eq("user_id", userId);
}

// ─── Compute metrics ─────────────────────────────────────────
function computeMetrics(entry: LTVCACEntry): ComputedMetrics {
  const ltv =
    entry.monthlyChurnRate > 0
      ? entry.avgDealValue / entry.monthlyChurnRate
      : entry.avgDealValue * 24;
  const cac =
    entry.newCustomers > 0 ? entry.monthlyAdSpend / entry.newCustomers : 0;
  const ratio = cac > 0 ? ltv / cac : 0;
  const monthlyRevenuePerCustomer = entry.avgDealValue;
  const paybackMonths =
    monthlyRevenuePerCustomer > 0 ? cac / monthlyRevenuePerCustomer : 0;

  return { ltv, cac, ratio, paybackMonths, monthlyRevenuePerCustomer };
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Gauge component ─────────────────────────────────────────
function RatioGauge({ ratio }: { ratio: number }) {
  const clampedRatio = Math.min(ratio, 6);
  const pct = (clampedRatio / 6) * 100;
  const isGood = ratio >= 3;
  const isOk = ratio >= 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20 overflow-hidden">
        {/* Background arc */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 160 80" className="w-full h-full">
            {/* Background track */}
            <path
              d="M 10 75 A 65 65 0 0 1 150 75"
              fill="none"
              stroke="#1C1F23"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Red zone (0-2) */}
            <path
              d="M 10 75 A 65 65 0 0 1 56.67 15"
              fill="none"
              stroke="#EF4444"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={0.3}
            />
            {/* Yellow zone (2-3) */}
            <path
              d="M 56.67 15 A 65 65 0 0 1 80 10"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={0.3}
            />
            {/* Green zone (3+) */}
            <path
              d="M 80 10 A 65 65 0 0 1 150 75"
              fill="none"
              stroke="#34D399"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={0.3}
            />
            {/* Active arc */}
            <path
              d="M 10 75 A 65 65 0 0 1 150 75"
              fill="none"
              stroke={isGood ? "#34D399" : isOk ? "#F59E0B" : "#EF4444"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${pct * 2.04} ${204 - pct * 2.04}`}
            />
          </svg>
        </div>
      </div>
      <div className="text-center -mt-2">
        <span
          className={cn(
            "text-3xl font-bold",
            isGood ? "text-accent" : isOk ? "text-warning" : "text-danger",
          )}
        >
          {ratio.toFixed(1)}:1
        </span>
        <div className="text-xs text-text-muted mt-1">
          {isGood ? "Excellent" : isOk ? "Correct" : "Critique"}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────
export function LTVCACTracker() {
  const { user } = useUser();
  const [entries, setEntries] = useState<LTVCACEntry[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<LTVCACEntry>({
    date: format(new Date(), "yyyy-MM"),
    avgDealValue: 0,
    monthlyChurnRate: 0.05,
    monthlyAdSpend: 0,
    newCustomers: 0,
  });

  useEffect(() => {
    if (!user) return;
    loadEntriesFromDB(user.id).then((rows) => {
      if (rows.length > 0) {
        setEntries(rows);
        setIsDemo(false);
      } else {
        setEntries(DEMO_ENTRIES);
        setIsDemo(true);
      }
    });
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    const updated = isDemo
      ? [formData]
      : [...entries.filter((e) => e.date !== formData.date), formData].sort(
          (a, b) => a.date.localeCompare(b.date),
        );
    setEntries(updated);
    setIsDemo(false);
    await upsertEntryToDB(user.id, formData);
    setShowForm(false);
    toast.success("Données LTV/CAC enregistrées");
    setFormData({
      date: format(new Date(), "yyyy-MM"),
      avgDealValue: 0,
      monthlyChurnRate: 0.05,
      monthlyAdSpend: 0,
      newCustomers: 0,
    });
  }, [user, entries, formData, isDemo]);

  const handleClear = useCallback(async () => {
    if (!user) return;
    await clearEntriesFromDB(user.id);
    setEntries(DEMO_ENTRIES);
    setIsDemo(true);
    toast.success("Données réinitialisées");
  }, [user]);

  // ─── Current metrics (latest entry) ─────────────────────────
  const currentMetrics = useMemo(() => {
    if (entries.length === 0) return null;
    const latest = entries[entries.length - 1];
    return computeMetrics(latest);
  }, [entries]);

  // ─── Previous metrics (for trend) ───────────────────────────
  const previousMetrics = useMemo(() => {
    if (entries.length < 2) return null;
    const prev = entries[entries.length - 2];
    return computeMetrics(prev);
  }, [entries]);

  // ─── Chart data ─────────────────────────────────────────────
  const chartData = useMemo(() => {
    return entries.map((e) => {
      const m = computeMetrics(e);
      return {
        date: e.date,
        LTV: Math.round(m.ltv),
        CAC: Math.round(m.cac),
        Ratio: parseFloat(m.ratio.toFixed(1)),
      };
    });
  }, [entries]);

  const trend = (current: number, prev: number | undefined) => {
    if (!prev || prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

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
            Ajouter mois
          </Button>
        </div>
      </div>

      {/* Main KPIs */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* LTV */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs font-medium">
                LTV
              </span>
              <DollarSign className="h-4 w-4 text-text-muted" />
            </div>
            <div className="text-xl font-bold text-text-primary">
              {fmtCurrency(currentMetrics.ltv)}
            </div>
            {previousMetrics && (
              <div className="flex items-center gap-1 mt-1">
                {trend(currentMetrics.ltv, previousMetrics.ltv) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-accent" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-danger" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend(currentMetrics.ltv, previousMetrics.ltv) >= 0
                      ? "text-accent"
                      : "text-danger",
                  )}
                >
                  {trend(currentMetrics.ltv, previousMetrics.ltv) >= 0
                    ? "+"
                    : ""}
                  {trend(currentMetrics.ltv, previousMetrics.ltv).toFixed(1)}%
                </span>
              </div>
            )}
          </Card>

          {/* CAC */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs font-medium">
                CAC
              </span>
              <Target className="h-4 w-4 text-text-muted" />
            </div>
            <div className="text-xl font-bold text-text-primary">
              {fmtCurrency(currentMetrics.cac)}
            </div>
            {previousMetrics && (
              <div className="flex items-center gap-1 mt-1">
                {/* For CAC, lower is better */}
                {trend(currentMetrics.cac, previousMetrics.cac) <= 0 ? (
                  <TrendingUp className="h-3 w-3 text-accent" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-danger" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend(currentMetrics.cac, previousMetrics.cac) <= 0
                      ? "text-accent"
                      : "text-danger",
                  )}
                >
                  {trend(currentMetrics.cac, previousMetrics.cac) >= 0
                    ? "+"
                    : ""}
                  {trend(currentMetrics.cac, previousMetrics.cac).toFixed(1)}%
                </span>
              </div>
            )}
          </Card>

          {/* LTV:CAC Ratio - center gauge */}
          <Card className="p-4 md:col-span-1 flex flex-col items-center justify-center">
            <span className="text-text-secondary text-xs font-medium mb-2">
              Ratio LTV:CAC
            </span>
            <RatioGauge ratio={currentMetrics.ratio} />
          </Card>

          {/* Payback Period */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs font-medium">
                Payback
              </span>
              <Clock className="h-4 w-4 text-text-muted" />
            </div>
            <div className="text-xl font-bold text-text-primary">
              {currentMetrics.paybackMonths.toFixed(1)} mois
            </div>
            <div className="mt-1">
              <Badge
                variant={
                  currentMetrics.paybackMonths <= 3
                    ? "default"
                    : currentMetrics.paybackMonths <= 6
                      ? "yellow"
                      : "red"
                }
              >
                {currentMetrics.paybackMonths <= 3
                  ? "Rapide"
                  : currentMetrics.paybackMonths <= 6
                    ? "Moyen"
                    : "Lent"}
              </Badge>
            </div>
          </Card>

          {/* Customers */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs font-medium">
                Nv. clients/mois
              </span>
              <Users className="h-4 w-4 text-text-muted" />
            </div>
            <div className="text-xl font-bold text-text-primary">
              {entries[entries.length - 1]?.newCustomers || 0}
            </div>
            {previousMetrics && entries.length >= 2 && (
              <div className="flex items-center gap-1 mt-1">
                {entries[entries.length - 1].newCustomers >=
                entries[entries.length - 2].newCustomers ? (
                  <TrendingUp className="h-3 w-3 text-accent" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-danger" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    entries[entries.length - 1].newCustomers >=
                      entries[entries.length - 2].newCustomers
                      ? "text-accent"
                      : "text-danger",
                  )}
                >
                  {entries[entries.length - 1].newCustomers -
                    entries[entries.length - 2].newCustomers >=
                  0
                    ? "+"
                    : ""}
                  {entries[entries.length - 1].newCustomers -
                    entries[entries.length - 2].newCustomers}
                </span>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Health indicators */}
      {currentMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-text-muted" />
              Indicateurs de santé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary/50">
                {currentMetrics.ratio >= 3 ? (
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                ) : currentMetrics.ratio >= 2 ? (
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-text-primary">
                    Ratio LTV:CAC
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    {currentMetrics.ratio >= 3
                      ? "Ton ratio est sain (>3:1). Tu peux investir davantage en acquisition."
                      : currentMetrics.ratio >= 2
                        ? "Ton ratio est correct mais peut être amélioré. Optimise ton funnel ou augmente ta LTV."
                        : "Ratio critique (<2:1). Réduis ton CAC ou augmente ta LTV en priorité."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary/50">
                {currentMetrics.paybackMonths <= 3 ? (
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                ) : currentMetrics.paybackMonths <= 6 ? (
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-text-primary">
                    Payback Period
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    {currentMetrics.paybackMonths <= 3
                      ? "Excellent ! Tu récupères ton investissement en moins de 3 mois."
                      : currentMetrics.paybackMonths <= 6
                        ? "Correct. Essayez de raccourcir le payback en augmentant le panier moyen."
                        : "Attention, le retour sur investissement est lent. Revois ton pricing ou ton CAC."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary/50">
                {entries.length >= 2 &&
                entries[entries.length - 1].monthlyChurnRate <
                  entries[entries.length - 2].monthlyChurnRate ? (
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-text-primary">
                    Churn Rate
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Taux de churn actuel :{" "}
                    <strong>
                      {(
                        (entries[entries.length - 1]?.monthlyChurnRate || 0) *
                        100
                      ).toFixed(1)}
                      %
                    </strong>
                    /mois.{" "}
                    {(entries[entries.length - 1]?.monthlyChurnRate || 0) <=
                    0.05
                      ? "Bon taux de retention."
                      : "Travaillez l'onboarding et le succès client pour réduire le churn."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LTV vs CAC Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution LTV vs CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLTV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCAC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
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
                    cursor={{ stroke: "rgba(52,211,153,0.2)", strokeWidth: 1 }}
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
                    dataKey="LTV"
                    stroke="#34D399"
                    fillOpacity={1}
                    fill="url(#colorLTV)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="CAC"
                    stroke="#F87171"
                    fillOpacity={1}
                    fill="url(#colorCAC)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left text-text-secondary font-medium py-3 px-2">
                    Mois
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Panier moy.
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Churn
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    LTV
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    CAC
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Ratio
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Payback
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries
                  .slice()
                  .reverse()
                  .map((e) => {
                    const m = computeMetrics(e);
                    return (
                      <tr
                        key={e.date}
                        className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium text-text-primary">
                          {e.date}
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {fmtCurrency(e.avgDealValue)}
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {(e.monthlyChurnRate * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-text-primary">
                          {fmtCurrency(m.ltv)}
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {fmtCurrency(m.cac)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge
                            variant={
                              m.ratio >= 3
                                ? "default"
                                : m.ratio >= 2
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {m.ratio.toFixed(1)}:1
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right text-text-secondary">
                          {m.paybackMonths.toFixed(1)} mois
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Input Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Données mensuelles LTV / CAC</DialogTitle>
            <DialogDescription>
              Saisis tes indicateurs business du mois pour calculer ta LTV, CAC
              et ratio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ltv-date">Mois</Label>
              <Input
                id="ltv-date"
                type="month"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="ltv-deal">
                Valeur moyenne d&apos;un deal (EUR)
              </Label>
              <Input
                id="ltv-deal"
                type="number"
                min={0}
                step={0.01}
                value={formData.avgDealValue || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    avgDealValue: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="ltv-churn">Taux de churn mensuel (%)</Label>
              <Input
                id="ltv-churn"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={formData.monthlyChurnRate * 100 || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    monthlyChurnRate: (parseFloat(e.target.value) || 0) / 100,
                  }))
                }
              />
              <p className="text-xs text-text-muted mt-1">
                Ex: 5% signifie que 5% des clients partent chaque mois
              </p>
            </div>
            <div>
              <Label htmlFor="ltv-spend">
                Dépense publicitaire mensuelle (EUR)
              </Label>
              <Input
                id="ltv-spend"
                type="number"
                min={0}
                step={0.01}
                value={formData.monthlyAdSpend || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    monthlyAdSpend: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="ltv-customers">Nouveaux clients ce mois</Label>
              <Input
                id="ltv-customers"
                type="number"
                min={0}
                value={formData.newCustomers || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    newCustomers: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            {/* Preview */}
            {formData.avgDealValue > 0 && formData.newCustomers > 0 && (
              <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-default">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Aperçu
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-text-muted">LTV :</span>{" "}
                    <span className="font-medium text-text-primary">
                      {fmtCurrency(computeMetrics(formData).ltv)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">CAC :</span>{" "}
                    <span className="font-medium text-text-primary">
                      {fmtCurrency(computeMetrics(formData).cac)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Ratio :</span>{" "}
                    <span className="font-medium text-text-primary">
                      {computeMetrics(formData).ratio.toFixed(1)}:1
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Payback :</span>{" "}
                    <span className="font-medium text-text-primary">
                      {computeMetrics(formData).paybackMonths.toFixed(1)} mois
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
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
