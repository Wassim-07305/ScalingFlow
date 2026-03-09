"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, FileText, GitBranch, Flame, PenTool, Megaphone } from "lucide-react";
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
  href?: string;
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
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const [counts, setCounts] = useState({
    offers: 0,
    assets: 0,
    funnels: 0,
    ads: 0,
    content: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      setCountsLoading(true);
      const supabase = createClient();

      const [offersRes, assetsRes, funnelsRes, adsRes, contentRes] = await Promise.all([
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
        supabase
          .from("ad_creatives")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("content_pieces")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setCounts({
        offers: offersRes.count ?? 0,
        assets: assetsRes.count ?? 0,
        funnels: funnelsRes.count ?? 0,
        ads: adsRes.count ?? 0,
        content: contentRes.count ?? 0,
      });
      setCountsLoading(false);
    };

    fetchCounts();
  }, [user]);

  const isLoading = userLoading || countsLoading;

  const stats: StatCard[] = [
    {
      label: "Offres",
      value: counts.offers,
      icon: Package,
      color: "orange",
      href: "/offer",
    },
    {
      label: "Funnels",
      value: counts.funnels,
      icon: GitBranch,
      color: "cyan",
      href: "/funnel",
    },
    {
      label: "Publicités",
      value: counts.ads,
      icon: Megaphone,
      color: "blue",
      href: "/ads",
    },
    {
      label: "Contenus",
      value: counts.content,
      icon: PenTool,
      color: "purple",
      href: "/content",
    },
    {
      label: "Assets",
      value: counts.assets,
      icon: FileText,
      color: "blue",
      href: "/assets",
    },
    {
      label: "Streak",
      value: profile?.streak_days ?? 0,
      suffix: "j",
      icon: Flame,
      color: "orange",
      href: "/progress",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const colors = colorMap[stat.color];
        return (
          <Card
            key={stat.label}
            className="relative overflow-hidden cursor-pointer transition-all hover:border-accent/30 hover:shadow-[0_0_15px_rgba(52,211,153,0.08)]"
            onClick={() => stat.href && router.push(stat.href)}
          >
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
