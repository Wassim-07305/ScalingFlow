"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Loader2, TrendingUp } from "lucide-react";
import type { ContentPerformanceProfile } from "@/lib/services/content-performance-analyzer";

const TYPE_LABELS: Record<string, string> = {
  reel: "Reels",
  carousel: "Carousels",
  story: "Stories",
  post: "Posts",
  youtube: "YouTube",
};

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { count: number; avgReach: number } }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border border-[#2A2F35] bg-[#141719] p-3 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-white">{label}</p>
      <p className="text-emerald-400">
        Engagement : {data.value.toFixed(1)}%
      </p>
      <p className="text-[#8A919A]">
        Reach moyen : {Math.round(data.payload.avgReach)} vues
      </p>
      <p className="text-[#8A919A]">{data.payload.count} publiés</p>
    </div>
  );
}

export function ContentPerformanceWidget({
  className,
}: {
  className?: string;
}) {
  const [profile, setProfile] = useState<ContentPerformanceProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content/performance")
      .then((r) => r.json())
      .then((data) => setProfile(data.profile ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className={cn("border-[#2A2F35] bg-[#141719]", className)}>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-[#8A919A]" />
        </CardContent>
      </Card>
    );
  }

  if (!profile || !profile.hasData) {
    return (
      <Card className={cn("border-[#2A2F35] bg-[#141719]", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Performance par format
          </CardTitle>
          <CardDescription className="text-[#8A919A]">
            Pas encore assez de données (minimum 3 contenus publiés). Le widget
            s&apos;activera automatiquement au fil de tes publications.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Build chart data from byType
  const chartData = Object.entries(profile.byType)
    .map(([type, perf]) => ({
      name: TYPE_LABELS[type] ?? type,
      engagement: parseFloat(perf.avgEngagement.toFixed(2)),
      avgReach: perf.avgReach,
      count: perf.count,
    }))
    .sort((a, b) => b.engagement - a.engagement);

  return (
    <Card className={cn("border-[#2A2F35] bg-[#141719]", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          Performance par format
        </CardTitle>
        {profile.insightText && (
          <CardDescription className="flex items-start gap-1.5 text-sm text-emerald-400/80">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {profile.insightText}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2A2F35"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#8A919A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#8A919A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1C1F23" }} />
              <Bar
                dataKey="engagement"
                fill="#34D399"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-6 text-center text-sm text-[#8A919A]">
            Pas de données disponibles.
          </p>
        )}

        <p className="mt-3 text-center text-xs text-[#6A717A]">
          Basé sur les 30 derniers jours · Mis à jour chaque lundi
        </p>
      </CardContent>
    </Card>
  );
}
