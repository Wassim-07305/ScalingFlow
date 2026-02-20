"use client";

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

const data = [
  { week: "S1", leads: 18 },
  { week: "S2", leads: 24 },
  { week: "S3", leads: 32 },
  { week: "S4", leads: 28 },
  { week: "S5", leads: 38 },
  { week: "S6", leads: 42 },
];

export function LeadsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads par semaine</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
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
                formatter={(value) => [String(value), "Leads"]}
              />
              <Bar
                dataKey="leads"
                fill="#3B82F6"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
