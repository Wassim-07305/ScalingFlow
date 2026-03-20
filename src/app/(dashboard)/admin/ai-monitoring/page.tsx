"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { usdToEur } from "@/lib/admin/cost-config";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AICostsData {
  overview: {
    total_cost_usd: number;
    cost_this_month: number;
    cost_last_month: number;
    cost_this_week: number;
    cost_today: number;
    total_generations: number;
    generations_this_month: number;
    avg_cost_per_generation: number;
    avg_cost_per_active_user: number;
    month_over_month_change: number;
  };
  profitability: {
    mrr: number;
    ai_cost: number;
    infra_cost_estimate: number;
    gross_margin: number;
    cost_per_plan: {
      plan_id: string;
      plan_name: string;
      plan_price: number;
      active_users: number;
      total_ai_cost: number;
      avg_cost_per_user: number;
      margin_per_user: number;
      margin_percent: number;
    }[];
  };
  by_model: {
    model: string;
    generations: number;
    total_cost: number;
    avg_cost: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cached_tokens: number;
    cache_hit_rate: number;
  }[];
  by_type: {
    generation_type: string;
    generations: number;
    total_cost: number;
    avg_cost: number;
    model_used: string;
  }[];
  cron_vs_user: {
    user_generations: number;
    user_cost: number;
    cron_generations: number;
    cron_cost: number;
    cron_cost_percent: number;
  };
  top_users: {
    user_id: string;
    user_name: string;
    user_email: string;
    plan: string;
    generations_this_month: number;
    cost_this_month: number;
    limit: number;
    usage_percent: number;
  }[];
  daily_trend: {
    date: string;
    generations: number;
    cost: number;
    active_users: number;
  }[];
  cost_alerts: {
    type: string;
    message: string;
    severity: string;
    data: Record<string, unknown>;
  }[];
}

// ─── Chart Theme ────────────────────────────────────────────────────────────

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#1C1F23",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "8px",
  color: "#FFFFFF",
  fontSize: "13px",
};

const PIE_COLORS = ["#34D399", "#818CF8", "#F472B6", "#FBBF24", "#60A5FA"];

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ─── Page Component ─────────────────────────────────────────────────────────

export default function AIMonitoringPage() {
  const { profile, loading: userLoading } = useUser();
  const router = useRouter();
  const [data, setData] = React.useState<AICostsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Admin guard
  React.useEffect(() => {
    if (!userLoading && (!profile || profile.role !== "admin")) {
      router.replace("/");
    }
  }, [userLoading, profile, router]);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-costs");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (userLoading || loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-bg-tertiary rounded animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-bg-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-80 bg-bg-secondary rounded-2xl animate-pulse" />
          <div className="h-80 bg-bg-secondary rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-text-muted">
        Erreur lors du chargement des données
      </div>
    );
  }

  const { overview, profitability, by_model, by_type, cron_vs_user, top_users, daily_trend, cost_alerts } = data;

  // Model pie data
  const modelPieData = by_model.map((m) => ({
    name: m.model === "haiku" ? "Haiku" : "Sonnet",
    value: m.generations,
    cost: m.total_cost,
  }));

  // Savings from using Haiku
  const haikuData = by_model.find((m) => m.model === "haiku");
  const sonnetAvgCost = by_model.find((m) => m.model === "sonnet")?.avg_cost || 0;
  const haikuSavings = haikuData
    ? (sonnetAvgCost - (haikuData.avg_cost || 0)) * haikuData.generations
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Monitoring IA & Coûts
            </h1>
            <p className="text-sm text-text-muted">
              Vue d&apos;ensemble des coûts IA et de la rentabilité
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* ─── Alerts ─── */}
      {cost_alerts.length > 0 && (
        <div className="space-y-2">
          {cost_alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info}`}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          title="Coût IA ce mois"
          value={`${usdToEur(overview.cost_this_month).toFixed(2)}€`}
          subtitle={`$${overview.cost_this_month.toFixed(2)} USD`}
          change={overview.month_over_month_change}
          icon={DollarSign}
        />
        <KPICard
          title="Générations ce mois"
          value={overview.generations_this_month.toLocaleString()}
          icon={Sparkles}
        />
        <KPICard
          title="Coût / génération"
          value={`$${overview.avg_cost_per_generation.toFixed(4)}`}
          icon={Cpu}
        />
        <KPICard
          title="Coût / user actif"
          value={`${usdToEur(overview.avg_cost_per_active_user).toFixed(2)}€`}
          icon={Users}
        />
        <KPICard
          title="Marge brute"
          value={`${profitability.gross_margin}%`}
          icon={profitability.gross_margin >= 50 ? TrendingUp : TrendingDown}
          color={profitability.gross_margin >= 50 ? "text-accent" : "text-red-400"}
        />
      </div>

      {/* ─── P&L ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            Rentabilité par plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* MRR bar */}
          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="text-text-muted w-16">MRR</span>
            <div className="flex-1 h-6 rounded-full bg-bg-tertiary overflow-hidden flex">
              <div
                className="h-full bg-accent/60 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ width: `${Math.max(5, 100 - (usdToEur(overview.cost_this_month) + profitability.infra_cost_estimate) / Math.max(profitability.mrr, 1) * 100)}%` }}
              >
                Profit
              </div>
              <div
                className="h-full bg-orange-500/60 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ width: `${Math.min(95, (usdToEur(overview.cost_this_month) / Math.max(profitability.mrr, 1)) * 100)}%` }}
              >
                IA
              </div>
              <div
                className="h-full bg-purple-500/40 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ width: `${Math.min(30, (profitability.infra_cost_estimate / Math.max(profitability.mrr, 1)) * 100)}%` }}
              >
                Infra
              </div>
            </div>
            <span className="text-text-primary font-medium w-20 text-right">{profitability.mrr}€</span>
          </div>

          {/* Plan table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs border-b border-border-default">
                  <th className="text-left py-2 font-medium">Plan</th>
                  <th className="text-right py-2 font-medium">Prix</th>
                  <th className="text-right py-2 font-medium">Users actifs</th>
                  <th className="text-right py-2 font-medium">Coût IA total</th>
                  <th className="text-right py-2 font-medium">Coût/user</th>
                  <th className="text-right py-2 font-medium">Marge/user</th>
                  <th className="text-right py-2 font-medium">Marge %</th>
                </tr>
              </thead>
              <tbody>
                {profitability.cost_per_plan
                  .filter((p) => p.active_users > 0 || p.plan_price > 0)
                  .map((p) => (
                    <tr key={p.plan_id} className="border-b border-border-default/50">
                      <td className="py-2 font-medium text-text-primary">{p.plan_name}</td>
                      <td className="py-2 text-right text-text-secondary">{p.plan_price}€</td>
                      <td className="py-2 text-right text-text-secondary">{p.active_users}</td>
                      <td className="py-2 text-right text-text-secondary">${p.total_ai_cost.toFixed(2)}</td>
                      <td className="py-2 text-right text-text-secondary">${p.avg_cost_per_user.toFixed(4)}</td>
                      <td className="py-2 text-right text-text-secondary">{p.margin_per_user.toFixed(2)}€</td>
                      <td className={`py-2 text-right font-medium ${p.margin_percent < 50 ? "text-red-400" : "text-accent"}`}>
                        {p.margin_percent}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance quotidienne (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            {daily_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={daily_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8b8f96" }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "#8b8f96" }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v, name) => [name === "cost" ? `$${Number(v ?? 0).toFixed(2)}` : String(v ?? 0), name === "cost" ? "Coût" : "Générations"]} />
                  <Line type="monotone" dataKey="cost" stroke="#34D399" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="generations" stroke="#818CF8" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-text-muted text-sm">
                Pas encore de données
              </div>
            )}
          </CardContent>
        </Card>

        {/* By type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top types de génération (par coût)</CardTitle>
          </CardHeader>
          <CardContent>
            {by_type.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={by_type.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#8b8f96" }} tickFormatter={(v) => `$${v}`} />
                  <YAxis dataKey="generation_type" type="category" tick={{ fontSize: 10, fill: "#8b8f96" }} width={80} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [`$${Number(v ?? 0).toFixed(4)}`, "Coût"]} />
                  <Bar dataKey="total_cost" fill="#34D399" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-text-muted text-sm">
                Pas encore de données
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Models & Efficiency ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-accent" />
              Répartition Haiku vs Sonnet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modelPieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={modelPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                      {modelPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 text-sm">
                  {by_model.map((m, i) => (
                    <div key={m.model} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <div>
                        <p className="text-text-primary font-medium">{m.model === "haiku" ? "Haiku" : "Sonnet"}</p>
                        <p className="text-text-muted text-xs">{m.generations} gen • ${m.total_cost.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
                Pas encore de données
              </div>
            )}
          </CardContent>
        </Card>

        {/* Efficiency metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              Efficacité & Optimisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow
              label="Cache hit rate"
              value={`${by_model.reduce((s, m) => s + m.cache_hit_rate, 0) / Math.max(by_model.length, 1)}%`}
              detail="Tokens servis depuis le cache prompt"
            />
            <MetricRow
              label="CRONs vs Users"
              value={`${cron_vs_user.cron_cost_percent}% CRON`}
              detail={`$${cron_vs_user.cron_cost.toFixed(2)} CRONs • $${cron_vs_user.user_cost.toFixed(2)} Users`}
            />
            <MetricRow
              label="Économie Haiku"
              value={`$${haikuSavings.toFixed(2)} économisés`}
              detail="vs si tout était en Sonnet"
            />
            <MetricRow
              label="Coût aujourd'hui"
              value={`$${overview.cost_today.toFixed(2)}`}
              detail={`Semaine : $${overview.cost_this_week.toFixed(2)}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── Top Consumers ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            Top Consumers (ce mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {top_users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-xs border-b border-border-default">
                    <th className="text-left py-2 font-medium">Utilisateur</th>
                    <th className="text-left py-2 font-medium">Plan</th>
                    <th className="text-right py-2 font-medium">Générations</th>
                    <th className="text-center py-2 font-medium">Quota</th>
                    <th className="text-right py-2 font-medium">Coût</th>
                    <th className="text-right py-2 font-medium">Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {top_users.map((u) => {
                    const isOverCost = usdToEur(u.cost_this_month) > (getPlanPrice(u.plan) * 0.8);
                    return (
                      <tr key={u.user_id} className={`border-b border-border-default/50 ${isOverCost ? "bg-red-500/5" : ""}`}>
                        <td className="py-2">
                          <p className="font-medium text-text-primary text-xs">{u.user_name}</p>
                          <p className="text-[10px] text-text-muted">{u.user_email}</p>
                        </td>
                        <td className="py-2">
                          <Badge variant="muted" className="text-[10px]">{u.plan}</Badge>
                        </td>
                        <td className="py-2 text-right text-text-secondary">{u.generations_this_month}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${u.usage_percent > 90 ? "bg-red-400" : u.usage_percent > 70 ? "bg-amber-400" : "bg-accent"}`}
                                style={{ width: `${Math.min(u.usage_percent, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-text-muted w-10 text-right">{u.usage_percent}%</span>
                          </div>
                        </td>
                        <td className={`py-2 text-right font-medium ${isOverCost ? "text-red-400" : "text-text-secondary"}`}>
                          ${u.cost_this_month.toFixed(2)}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => window.open(`/admin/ai-monitoring?user=${u.user_id}`, "_self")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-text-muted text-sm py-8">Aucune donnée de consommation</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-text-muted font-medium">{title}</span>
          <Icon className={`h-4 w-4 ${color || "text-text-muted"}`} />
        </div>
        <p className={`text-2xl font-bold ${color || "text-text-primary"}`}>{value}</p>
        {subtitle && <p className="text-[10px] text-text-muted mt-0.5">{subtitle}</p>}
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${change >= 0 ? "text-red-400" : "text-accent"}`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change >= 0 ? "+" : ""}{change}% vs mois dernier
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-default/30 last:border-0">
      <div>
        <p className="text-sm text-text-primary">{label}</p>
        <p className="text-[10px] text-text-muted">{detail}</p>
      </div>
      <span className="text-sm font-medium text-accent">{value}</span>
    </div>
  );
}

function getPlanPrice(planId: string): number {
  const prices: Record<string, number> = { free: 0, starter: 29, pro: 59, scale: 149, agency: 299 };
  return prices[planId] || 0;
}
