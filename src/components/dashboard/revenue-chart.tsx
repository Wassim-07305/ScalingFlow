"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

interface MonthData {
  month: string;
  generations: number;
}

export function RevenueChart() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchGenerationsPerMonth = async () => {
      setLoading(true);
      const supabase = createClient();
      const now = new Date();
      const months: MonthData[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const start = startOfMonth(monthDate).toISOString();
        const end = endOfMonth(monthDate).toISOString();
        const label = format(monthDate, "MMM", { locale: fr });
        // Capitaliser la premiere lettre
        const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

        const [offersRes, creativesRes, funnelsRes, assetsRes] =
          await Promise.all([
            supabase
              .from("offers")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .gte("created_at", start)
              .lte("created_at", end),
            supabase
              .from("ad_creatives")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .gte("created_at", start)
              .lte("created_at", end),
            supabase
              .from("funnels")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .gte("created_at", start)
              .lte("created_at", end),
            supabase
              .from("sales_assets")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .gte("created_at", start)
              .lte("created_at", end),
          ]);

        const total =
          (offersRes.count ?? 0) +
          (creativesRes.count ?? 0) +
          (funnelsRes.count ?? 0) +
          (assetsRes.count ?? 0);

        months.push({ month: capitalizedLabel, generations: total });
      }

      setData(months);
      setLoading(false);
    };

    fetchGenerationsPerMonth();
  }, [user]);

  const hasData = data.some((d) => d.generations > 0);
  const isLoading = userLoading || loading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generations par mois</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] sm:h-[300px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : !hasData ? (
            <div className="flex flex-col h-full items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 mb-3">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">Pas encore de donnees</p>
              <p className="text-xs text-text-muted max-w-[220px]">Tes statistiques mensuelles apparaitront ici apres tes premieres generations.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#34D399" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#5C6370"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#5C6370"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C1F23",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [
                    String(value ?? 0),
                    "Generations",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="generations"
                  stroke="#34D399"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
