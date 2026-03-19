"use client";

import { useEffect, useState, useMemo} from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface DailyMetric {
  date: string;
  dateLabel: string;
  spend: number;
  conversions: number;
  roas: number;
  clicks: number;
}

interface PerformanceChartProps {
  className?: string;
}

type MetricKey = "spend" | "roas" | "conversions" | "clicks";

const METRICS: {
  key: MetricKey;
  label: string;
  color: string;
  suffix: string;
}[] = [
  { key: "roas", label: "ROAS", color: "#34D399", suffix: "x" },
  { key: "spend", label: "Dépense", color: "#60A5FA", suffix: " €" },
  { key: "conversions", label: "Conversions", color: "#A78BFA", suffix: "" },
  { key: "clicks", label: "Clics", color: "#FBBF24", suffix: "" },
];

export function PerformanceChart({ className }: PerformanceChartProps) {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("roas");
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");
  const [trendPercent, setTrendPercent] = useState(0);

  useEffect(() => {
    if (userLoading || !user) return;

    const fetchData = async () => {
      const supabase = createClient();
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      // Récupérer les métriques quotidiennes
      const { data: dailyData } = await supabase
        .from("ad_daily_metrics")
        .select("date, spend, conversions, roas, clicks")
        .eq("user_id", user.id)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      // Créer un map des données existantes
      const dataMap = new Map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((dailyData ?? []) as any[]).map((d) => [d.date, d]),
      );

      // Générer tous les jours des 30 derniers jours
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const chartData: DailyMetric[] = allDays.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const existing = dataMap.get(dateKey);
        return {
          date: dateKey,
          dateLabel: format(day, "d MMM", { locale: fr }),
          spend: existing?.spend ?? 0,
          conversions: existing?.conversions ?? 0,
          roas: existing?.roas ?? 0,
          clicks: existing?.clicks ?? 0,
        };
      });

      setData(chartData);

      // Calculer la tendance (comparer les 7 derniers jours aux 7 précédents)
      if (chartData.length >= 14) {
        const recent = chartData.slice(-7);
        const previous = chartData.slice(-14, -7);

        const recentAvg = recent.reduce((s, d) => s + d[activeMetric], 0) / 7;
        const previousAvg =
          previous.reduce((s, d) => s + d[activeMetric], 0) / 7;

        if (previousAvg > 0) {
          const change = ((recentAvg - previousAvg) / previousAvg) * 100;
          setTrendPercent(Math.abs(change));
          setTrend(change > 5 ? "up" : change < -5 ? "down" : "stable");
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user, userLoading, activeMetric]);

  const activeMetricConfig = METRICS.find((m) => m.key === activeMetric)!;

  if (loading || userLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Performance 30 jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some((d) => d.spend > 0 || d.conversions > 0);

  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Performance 30 jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <TrendingUp className="h-12 w-12 text-text-muted/30 mb-3" />
            <p className="text-sm text-text-muted">
              Aucune donnée de performance disponible.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Synchronise tes campagnes Meta Ads pour voir tes tendances.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Performance 30 jours
          </CardTitle>
          <div className="flex items-center gap-2">
            {trend === "up" && (
              <div className="flex items-center gap-1 text-accent text-xs">
                <TrendingUp className="h-3.5 w-3.5" />+{trendPercent.toFixed(1)}
                %
              </div>
            )}
            {trend === "down" && (
              <div className="flex items-center gap-1 text-danger text-xs">
                <TrendingDown className="h-3.5 w-3.5" />-
                {trendPercent.toFixed(1)}%
              </div>
            )}
            {trend === "stable" && (
              <div className="flex items-center gap-1 text-text-muted text-xs">
                <Minus className="h-3.5 w-3.5" />
                Stable
              </div>
            )}
          </div>
        </div>
        {/* Metric selector */}
        <div className="flex gap-2 mt-3">
          {METRICS.map((metric) => (
            <button
              key={metric.key}
              onClick={() => setActiveMetric(metric.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeMetric === metric.key
                  ? "text-white"
                  : "bg-bg-tertiary text-text-muted hover:text-text-primary",
              )}
              style={{
                backgroundColor:
                  activeMetric === metric.key ? metric.color : undefined,
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D32" />
              <XAxis
                dataKey="dateLabel"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={50}
                tickFormatter={(value) =>
                  `${value}${activeMetricConfig.suffix}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1C1F23",
                  border: "1px solid #2A2D32",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#9CA3AF" }}
                formatter={(value) => [
                  `${Number(value).toFixed(2)}${activeMetricConfig.suffix}`,
                  activeMetricConfig.label,
                ]}
              />
              <Line
                type="monotone"
                dataKey={activeMetric}
                stroke={activeMetricConfig.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
