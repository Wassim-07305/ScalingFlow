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
    bg: "bg-accent-muted",
    text: "text-accent",
    icon: "text-accent",
  },
  blue: {
    bg: "bg-info/12",
    text: "text-info",
    icon: "text-info",
  },
  cyan: {
    bg: "bg-accent-muted",
    text: "text-accent",
    icon: "text-accent",
  },
  purple: {
    bg: "bg-[rgba(139,92,246,0.12)]",
    text: "text-[#A78BFA]",
    icon: "text-[#A78BFA]",
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
                      stat.change > 0 ? "text-accent" : "text-danger"
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
                  "flex h-10 w-10 items-center justify-center rounded-[8px]",
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
