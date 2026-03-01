"use client";

import { useEffect, useState } from "react";
import { Package, FileText, GitBranch, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface StatCard {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  color: "orange" | "blue" | "cyan" | "purple";
}

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
  const { user, profile, loading: userLoading } = useUser();
  const [counts, setCounts] = useState({
    offers: 0,
    assets: 0,
    funnels: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      setCountsLoading(true);
      const supabase = createClient();

      const [offersRes, assetsRes, funnelsRes] = await Promise.all([
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("sales_assets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("funnels")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setCounts({
        offers: offersRes.count ?? 0,
        assets: assetsRes.count ?? 0,
        funnels: funnelsRes.count ?? 0,
      });
      setCountsLoading(false);
    };

    fetchCounts();
  }, [user]);

  const isLoading = userLoading || countsLoading;

  const stats: StatCard[] = [
    {
      label: "Nombre d'offres",
      value: counts.offers,
      icon: Package,
      color: "orange",
    },
    {
      label: "Assets créés",
      value: counts.assets,
      icon: FileText,
      color: "blue",
    },
    {
      label: "Funnels créés",
      value: counts.funnels,
      icon: GitBranch,
      color: "cyan",
    },
    {
      label: "Streak",
      value: profile?.streak_days ?? 0,
      suffix: " jours",
      icon: Flame,
      color: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const colors = colorMap[stat.color];
        return (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <div className="mt-2 text-2xl font-bold text-text-primary">
                  {isLoading ? (
                    <span className="inline-block h-7 w-16 animate-pulse rounded bg-white/10" />
                  ) : (
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      decimals={0}
                    />
                  )}
                </div>
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
