"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────
interface DailyMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  calls: number;
  clients: number;
  revenue: number;
}

// ─── Demo data (same as dashboard) ───────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────
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
    date: typeof row.date === "string" ? row.date : new Date(row.date).toISOString().split("T")[0],
    spend: Number(row.spend),
    impressions: row.impressions,
    clicks: row.clicks,
    leads: row.leads,
    calls: row.calls,
    clients: row.clients,
    revenue: Number(row.revenue),
  }));
}

// ─── Main component ──────────────────────────────────────────
export function MetricsHistory() {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadMetricsFromDB(user.id).then((rows) => {
      if (rows.length > 0) {
        setMetrics(rows);
        setIsDemo(false);
      } else {
        setMetrics(DEMO_DATA);
        setIsDemo(true);
      }
    });
  }, [user]);

  // Calculate derived metrics for each day
  const enrichedData = useMemo(() => {
    return metrics
      .slice()
      .reverse()
      .map((m, idx, arr) => {
        const prev = arr[idx + 1]; // previous day (arr is reversed)
        const cpl = m.leads > 0 ? m.spend / m.leads : 0;
        const cpa = m.clients > 0 ? m.spend / m.clients : 0;
        const roas = m.spend > 0 ? m.revenue / m.spend : 0;
        const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;

        const prevRoas = prev && prev.spend > 0 ? prev.revenue / prev.spend : null;

        return {
          ...m,
          cpl,
          cpa,
          roas,
          ctr,
          roasTrend: prevRoas !== null ? roas - prevRoas : null,
          revenueTrend: prev ? m.revenue - prev.revenue : null,
        };
      });
  }, [metrics]);

  // Summary stats
  const summary = useMemo(() => {
    const totals = metrics.reduce(
      (acc, m) => ({
        spend: acc.spend + m.spend,
        leads: acc.leads + m.leads,
        clients: acc.clients + m.clients,
        revenue: acc.revenue + m.revenue,
      }),
      { spend: 0, leads: 0, clients: 0, revenue: 0 }
    );

    return {
      totalDays: metrics.length,
      avgDailySpend: metrics.length > 0 ? totals.spend / metrics.length : 0,
      avgDailyRevenue: metrics.length > 0 ? totals.revenue / metrics.length : 0,
      avgDailyLeads: metrics.length > 0 ? totals.leads / metrics.length : 0,
      totalSpend: totals.spend,
      totalRevenue: totals.revenue,
      totalLeads: totals.leads,
      totalClients: totals.clients,
      overallROAS: totals.spend > 0 ? totals.revenue / totals.spend : 0,
      overallCPL: totals.leads > 0 ? totals.spend / totals.leads : 0,
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
        {isDemo && <Badge variant="yellow">Donnees de demonstration</Badge>}
        <Badge variant="muted">
          <Calendar className="h-3 w-3 mr-1" />
          {summary.totalDays} jours de donnees
        </Badge>
        </div>
        {!isDemo && metrics.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const headers = "Date,Depense,Impressions,Clics,Leads,Appels,Clients,Revenu\n";
              const rows = metrics.map((m) =>
                `${m.date},${m.spend},${m.impressions},${m.clicks},${m.leads},${m.calls},${m.clients},${m.revenue}`
              ).join("\n");
              const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `scalingflow-historique-${format(new Date(), "yyyy-MM-dd")}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-text-secondary font-medium">Total depense</span>
          <div className="text-lg font-bold text-text-primary mt-1">
            {fmtCurrency(summary.totalSpend)}
          </div>
          <span className="text-xs text-text-muted">
            Moy. {fmtCurrency(summary.avgDailySpend)}/jour
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-text-secondary font-medium">Total revenu</span>
          <div className="text-lg font-bold text-accent mt-1">
            {fmtCurrency(summary.totalRevenue)}
          </div>
          <span className="text-xs text-text-muted">
            Moy. {fmtCurrency(summary.avgDailyRevenue)}/jour
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-text-secondary font-medium">ROAS global</span>
          <div className="text-lg font-bold text-text-primary mt-1">
            {summary.overallROAS.toFixed(2)}x
          </div>
          <span className="text-xs text-text-muted">
            CPL moy. {fmtCurrency(summary.overallCPL)}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-text-secondary font-medium">Total leads / clients</span>
          <div className="text-lg font-bold text-text-primary mt-1">
            {summary.totalLeads} / {summary.totalClients}
          </div>
          <span className="text-xs text-text-muted">
            Moy. {summary.avgDailyLeads.toFixed(1)} leads/jour
          </span>
        </Card>
      </div>

      {/* Detailed history table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique detaille jour par jour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left text-text-secondary font-medium py-3 px-2">Date</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Depense</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Impressions</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Clics</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">CTR</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Leads</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">CPL</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Appels</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Clients</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">Revenu</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {enrichedData.map((row) => (
                  <tr
                    key={row.date}
                    className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium text-text-primary whitespace-nowrap">
                      {format(parseISO(row.date), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="py-3 px-2 text-right text-text-secondary">
                      {fmtCurrency(row.spend)}
                    </td>
                    <td className="py-3 px-2 text-right text-text-secondary">
                      {fmtNumber(row.impressions)}
                    </td>
                    <td className="py-3 px-2 text-right text-text-secondary">
                      {fmtNumber(row.clicks)}
                    </td>
                    <td className="py-3 px-2 text-right text-text-secondary">
                      {row.ctr.toFixed(2)}%
                    </td>
                    <td className="py-3 px-2 text-right text-text-secondary">{row.leads}</td>
                    <td className="py-3 px-2 text-right text-text-secondary">
                      {fmtCurrency(row.cpl)}
                    </td>
                    <td className="py-3 px-2 text-right text-text-secondary">{row.calls}</td>
                    <td className="py-3 px-2 text-right text-text-secondary">{row.clients}</td>
                    <td className="py-3 px-2 text-right font-medium text-text-primary">
                      <div className="flex items-center justify-end gap-1">
                        {fmtCurrency(row.revenue)}
                        {row.revenueTrend !== null && (
                          <span>
                            {row.revenueTrend >= 0 ? (
                              <ArrowUpRight className="h-3 w-3 text-accent inline" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 text-danger inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Badge
                        variant={
                          row.roas >= 3
                            ? "default"
                            : row.roas >= 2
                            ? "yellow"
                            : "red"
                        }
                      >
                        {row.roas.toFixed(2)}x
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
