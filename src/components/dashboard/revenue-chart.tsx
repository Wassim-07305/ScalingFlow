"use client";

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

const data = [
  { month: "Sep", revenue: 3200 },
  { month: "Oct", revenue: 4100 },
  { month: "Nov", revenue: 3800 },
  { month: "Déc", revenue: 5200 },
  { month: "Jan", revenue: 6800 },
  { month: "Fév", revenue: 8450 },
];

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenus mensuels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B2C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF6B2C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#4A4A6A"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4A4A6A"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#22223A",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                  color: "#F1F1F6",
                  fontSize: "13px",
                }}
                formatter={(value) => [`${value}€`, "Revenu"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FF6B2C"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
