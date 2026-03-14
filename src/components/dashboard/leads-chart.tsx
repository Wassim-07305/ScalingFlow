"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";

interface WeekData {
  week: string;
  creations: number;
}

export function LeadsChart() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCreationsPerWeek = async () => {
      setLoading(true);
      const supabase = createClient();
      const now = new Date();
      const weeks: WeekData[] = [];

      for (let i = 5; i >= 0; i--) {
        const weekDate = subWeeks(now, i);
        const start = startOfWeek(weekDate, { locale: fr }).toISOString();
        const end = endOfWeek(weekDate, { locale: fr }).toISOString();
        // Format : "3 Fev" pour le debut de la semaine
        const label = format(startOfWeek(weekDate, { locale: fr }), "d MMM", {
          locale: fr,
        });

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

        weeks.push({ week: label, creations: total });
      }

      setData(weeks);
      setLoading(false);
    };

    fetchCreationsPerWeek();
  }, [user]);

  const hasData = data.some((d) => d.creations > 0);
  const isLoading = userLoading || loading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Creations par semaine</CardTitle>
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
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">Pas encore de creations</p>
              <p className="text-xs text-text-muted max-w-[220px]">Génère ta première offre ou funnel pour voir les stats ici.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
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
                  formatter={(value) => [String(value ?? 0), "Creations"]}
                />
                <Bar
                  dataKey="creations"
                  fill="#34D399"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
