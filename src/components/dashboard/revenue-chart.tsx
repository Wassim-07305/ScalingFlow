"use client";

import { useEffect, useState, useMemo} from "react";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchGenerationsPerMonth = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const now = new Date();
        const months: MonthData[] = [];

        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const start = startOfMonth(monthDate).toISOString();
          const end = endOfMonth(monthDate).toISOString();
          const label = format(monthDate, "MMM", { locale: fr });
          // Capitaliser la première lettre
          const capitalizedLabel =
            label.charAt(0).toUpperCase() + label.slice(1);

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
      } catch {
        // Show empty state rather than infinite skeleton
      } finally {
        setLoading(false);
      }
    };

    fetchGenerationsPerMonth();
  }, [user]);

  const hasData = data.some((d) => d.generations > 0);
  const isLoading = userLoading || loading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Générations par mois</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] sm:h-[300px]">
          {isLoading ? (
            <div className="flex h-full flex-col justify-end gap-2 px-4 pb-4">
              <div className="flex items-end gap-3 h-full">
                {[40, 65, 45, 80, 55, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-bg-tertiary animate-pulse"
                      style={{ height: `${h}%` }}
                    />
                    <div className="h-3 w-8 mx-auto rounded bg-bg-tertiary animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : !hasData ? (
            <div className="flex flex-col h-full items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 mb-3">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Pas encore de données
              </p>
              <p className="text-xs text-text-muted max-w-[220px]">
                Tes statistiques mensuelles apparaîtront ici après tes premières
                générations.
              </p>
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
                  formatter={(value) => [String(value ?? 0), "Générations"]}
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
