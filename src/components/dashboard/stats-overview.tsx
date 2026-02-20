"use client";

import { DollarSign, Users, TrendingUp, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils/cn";

interface StatCard {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  icon: React.ElementType;
  color: "orange" | "blue" | "cyan" | "purple";
}

const STATS: StatCard[] = [
  {
    label: "Revenu mensuel",
    value: 8450,
    prefix: "",
    suffix: "€",
    change: 23,
    icon: DollarSign,
    color: "orange",
  },
  {
    label: "Leads générés",
    value: 142,
    change: 12,
    icon: Users,
    color: "blue",
  },
  {
    label: "Taux de conversion",
    value: 4.2,
    suffix: "%",
    change: 0.8,
    icon: TrendingUp,
    color: "cyan",
  },
  {
    label: "Streak",
    value: 7,
    suffix: " jours",
    icon: Flame,
    color: "orange",
  },
];

const colorMap = {
  orange: {
    bg: "bg-neon-orange-glow",
    text: "text-neon-orange",
    icon: "text-neon-orange",
  },
  blue: {
    bg: "bg-neon-blue-glow",
    text: "text-neon-blue",
    icon: "text-neon-blue",
  },
  cyan: {
    bg: "bg-neon-cyan-glow",
    text: "text-neon-cyan",
    icon: "text-neon-cyan",
  },
  purple: {
    bg: "bg-neon-purple-glow",
    text: "text-neon-purple",
    icon: "text-neon-purple",
  },
};

export function StatsOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => {
        const colors = colorMap[stat.color];
        return (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <div className="mt-2 text-2xl font-bold text-text-primary">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.suffix === "%" ? 1 : 0}
                  />
                </div>
                {stat.change !== undefined && (
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium",
                      stat.change > 0 ? "text-neon-cyan" : "text-neon-red"
                    )}
                  >
                    {stat.change > 0 ? "+" : ""}
                    {stat.change}
                    {stat.suffix === "%" ? " pts" : "%"} vs mois dernier
                  </p>
                )}
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-[12px]",
                  colors.bg
                )}
              >
                <stat.icon className={cn("h-5 w-5", colors.icon)} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
