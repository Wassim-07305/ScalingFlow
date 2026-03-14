"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────
type AttributionModel = "firstTouch" | "lastTouch" | "linear" | "timeDecay";

interface ChannelData {
  name: string;
  firstTouch: number;
  lastTouch: number;
  linear: number;
  timeDecay: number;
  color: string;
}

// ─── Demo data ───────────────────────────────────────────────
const DEMO_CHANNELS: ChannelData[] = [
  { name: "Meta Ads", firstTouch: 45, lastTouch: 30, linear: 38, timeDecay: 35, color: "#3B82F6" },
  { name: "Contenu Organique", firstTouch: 25, lastTouch: 15, linear: 20, timeDecay: 18, color: "#34D399" },
  { name: "Email Nurture", firstTouch: 5, lastTouch: 35, linear: 22, timeDecay: 28, color: "#F59E0B" },
  { name: "Referral", firstTouch: 15, lastTouch: 10, linear: 12, timeDecay: 11, color: "#A78BFA" },
  { name: "Direct", firstTouch: 10, lastTouch: 10, linear: 8, timeDecay: 8, color: "#F87171" },
];

const DEMO_REVENUE = 32813; // Total revenue to distribute

const MODEL_LABELS: Record<AttributionModel, string> = {
  firstTouch: "Premier contact",
  lastTouch: "Dernier contact",
  linear: "Lineaire",
  timeDecay: "Decroissance temporelle",
};

const MODEL_DESCRIPTIONS: Record<AttributionModel, string> = {
  firstTouch:
    "100% du credit au premier point de contact. Ideal pour mesurer l'efficacite de la decouverte.",
  lastTouch:
    "100% du credit au dernier point de contact avant conversion. Ideal pour mesurer le closing.",
  linear:
    "Credit reparti egalement entre tous les points de contact. Vue equilibree du parcours client.",
  timeDecay:
    "Plus de credit aux points de contact recents. Bon compromis entre premier et dernier contact.",
};

// ─── Customer journey demo ───────────────────────────────────
const DEMO_JOURNEYS = [
  {
    client: "Client A",
    revenue: 2997,
    touchpoints: ["Meta Ads", "Contenu Organique", "Email Nurture", "Direct"],
  },
  {
    client: "Client B",
    revenue: 1997,
    touchpoints: ["Contenu Organique", "Referral", "Email Nurture"],
  },
  {
    client: "Client C",
    revenue: 997,
    touchpoints: ["Meta Ads", "Email Nurture"],
  },
  {
    client: "Client D",
    revenue: 2997,
    touchpoints: ["Meta Ads", "Meta Ads", "Contenu Organique", "Email Nurture", "Direct"],
  },
  {
    client: "Client E",
    revenue: 1997,
    touchpoints: ["Referral", "Email Nurture", "Meta Ads"],
  },
];

// ─── Main component ──────────────────────────────────────────
export function AttributionModel() {
  const { user } = useUser();
  const [model, setModel] = useState<AttributionModel>("linear");
  const [totalRevenue, setTotalRevenue] = useState<number>(DEMO_REVENUE);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("daily_performance_metrics")
      .select("revenue")
      .eq("user_id", user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (data && data.length > 0) {
          const total = data.reduce((sum: number, row: { revenue: number }) => sum + Number(row.revenue), 0);
          if (total > 0) {
            setTotalRevenue(total);
            setIsDemo(false);
          }
        }
      });
  }, [user]);

  // Real revenue only affects the total — channel percentages are always estimated
  const revenueIsReal = !isDemo;

  // ─── Computed data ───────────────────────────────────────────
  const chartData = useMemo(() => {
    return DEMO_CHANNELS.map((ch) => ({
      name: ch.name,
      pourcentage: ch[model],
      revenu: Math.round((ch[model] / 100) * totalRevenue),
      color: ch.color,
    })).sort((a, b) => b.pourcentage - a.pourcentage);
  }, [model, totalRevenue]);

  const totalPct = chartData.reduce((s, d) => s + d.pourcentage, 0);

  const handleExportJSON = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      model: model,
      model_label: MODEL_LABELS[model],
      total_revenue: totalRevenue,
      is_real_revenue: revenueIsReal,
      channels: chartData.map((ch) => ({
        name: ch.name,
        percentage: ch.pourcentage,
        attributed_revenue: ch.revenu,
      })),
      all_models: DEMO_CHANNELS.map((ch) => ({
        name: ch.name,
        firstTouch: ch.firstTouch,
        lastTouch: ch.lastTouch,
        linear: ch.linear,
        timeDecay: ch.timeDecay,
      })),
      customer_journeys: DEMO_JOURNEYS.map((j) => ({
        client: j.client,
        revenue: j.revenue,
        touchpoints: j.touchpoints,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attribution-${model}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export JSON telecharge");
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <Card className="border-accent/20">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                Modeles d&apos;attribution
              </h3>
              <p className="text-xs text-text-secondary">
                Comprenez comment chaque canal contribue a vos conversions selon differents modeles
                d&apos;attribution. Les repartitions par canal sont des estimations basees sur les modeles standards du secteur.
                {revenueIsReal && " Le revenu total affiche est base sur vos donnees reelles."}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge variant="yellow">Repartitions estimees</Badge>
              {revenueIsReal && <Badge variant="default">Revenu reel : {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalRevenue)}</Badge>}
              {isDemo && <Badge variant="muted">Revenu de demo</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:w-64">
          <Select value={model} onValueChange={(v) => setModel(v as AttributionModel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firstTouch">Premier contact</SelectItem>
              <SelectItem value="lastTouch">Dernier contact</SelectItem>
              <SelectItem value="linear">Lineaire</SelectItem>
              <SelectItem value="timeDecay">Decroissance temporelle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-text-secondary flex-1">{MODEL_DESCRIPTIONS[model]}</p>
        <Button variant="ghost" size="sm" onClick={handleExportJSON}>
          <Download className="h-4 w-4 mr-1" />
          Export JSON
        </Button>
      </div>

      {/* Attribution chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            Attribution du revenu - {MODEL_LABELS[model]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1F23" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141719",
                    border: "1px solid #2A2D31",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  formatter={(value) => {
                    const v = typeof value === "number" ? value : 0;
                    return [`${v}%`, "Attribution"];
                  }}
                />
                <Bar dataKey="pourcentage" radius={[0, 6, 6, 0]} barSize={24}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Channel breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.map((ch) => (
          <Card key={ch.name} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: ch.color }}
              />
              <span className="text-sm font-medium text-text-primary">{ch.name}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-text-primary">{ch.pourcentage}%</div>
                <div className="text-xs text-text-muted">du revenu total</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-text-primary">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(ch.revenu)}
                </div>
                <div className="text-xs text-text-muted">attribue</div>
              </div>
            </div>
            {/* Mini bar */}
            <div className="mt-3 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(ch.pourcentage / Math.max(...chartData.map((c) => c.pourcentage))) * 100}%`,
                  backgroundColor: ch.color,
                }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Model comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des modeles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left text-text-secondary font-medium py-3 px-2">Canal</th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    1er contact
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Dernier contact
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Lineaire
                  </th>
                  <th className="text-right text-text-secondary font-medium py-3 px-2">
                    Decroissance
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CHANNELS.map((ch) => (
                  <tr key={ch.name} className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ch.color }}
                        />
                        <span className="font-medium text-text-primary">{ch.name}</span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "py-3 px-2 text-right",
                        model === "firstTouch"
                          ? "font-semibold text-accent"
                          : "text-text-secondary"
                      )}
                    >
                      {ch.firstTouch}%
                    </td>
                    <td
                      className={cn(
                        "py-3 px-2 text-right",
                        model === "lastTouch"
                          ? "font-semibold text-accent"
                          : "text-text-secondary"
                      )}
                    >
                      {ch.lastTouch}%
                    </td>
                    <td
                      className={cn(
                        "py-3 px-2 text-right",
                        model === "linear"
                          ? "font-semibold text-accent"
                          : "text-text-secondary"
                      )}
                    >
                      {ch.linear}%
                    </td>
                    <td
                      className={cn(
                        "py-3 px-2 text-right",
                        model === "timeDecay"
                          ? "font-semibold text-accent"
                          : "text-text-secondary"
                      )}
                    >
                      {ch.timeDecay}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Journeys */}
      <Card>
        <CardHeader>
          <CardTitle>Exemples de parcours clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEMO_JOURNEYS.map((journey, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-bg-tertiary/50"
              >
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="text-sm font-medium text-text-primary">{journey.client}</span>
                  <Badge variant="default">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(journey.revenue)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {journey.touchpoints.map((tp, tIdx) => {
                    const channel = DEMO_CHANNELS.find((c) => c.name === tp);
                    return (
                      <React.Fragment key={tIdx}>
                        {tIdx > 0 && (
                          <span className="text-text-muted text-xs mx-0.5">&rarr;</span>
                        )}
                        <span
                          className="text-xs px-2 py-1 rounded-md"
                          style={{
                            backgroundColor: `${channel?.color || "#6B7280"}20`,
                            color: channel?.color || "#6B7280",
                          }}
                        >
                          {tp}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
