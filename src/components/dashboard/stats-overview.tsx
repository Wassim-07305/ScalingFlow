"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, FileText, GitBranch, Flame, PenTool, Megaphone, Target, TrendingUp, DollarSign } from "lucide-react";
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
  color: "orange" | "blue" | "cyan" | "purple" | "emerald";
  href?: string;
  trend?: number;
}

const colorMap = {
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    icon: "text-orange-400",
    glow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.12)]",
    gradient: "from-orange-500/5 to-transparent",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    icon: "text-blue-400",
    glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.12)]",
    gradient: "from-blue-500/5 to-transparent",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    icon: "text-cyan-400",
    glow: "hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]",
    gradient: "from-cyan-500/5 to-transparent",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    icon: "text-purple-400",
    glow: "hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]",
    gradient: "from-purple-500/5 to-transparent",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    icon: "text-emerald-400",
    glow: "hover:shadow-[0_0_20px_rgba(52,211,153,0.12)]",
    gradient: "from-emerald-500/5 to-transparent",
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
    adSpend: 0,
    avgRoas: 0,
    milestones: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      setCountsLoading(true);
      const supabase = createClient();

      const [offersRes, assetsRes, funnelsRes, adsRes, contentRes, campaignsRes, milestonesRes] = await Promise.all([
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
        supabase
          .from("ad_campaigns")
          .select("total_spend, roas")
          .eq("user_id", user.id),
        supabase
          .from("user_milestones")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const campaigns = (campaignsRes.data ?? []) as any[];
      const adSpend = campaigns.reduce((s: number, c: any) => s + (c.total_spend ?? 0), 0);
      const avgRoas = campaigns.length > 0
        ? campaigns.reduce((s: number, c: any) => s + (c.roas ?? 0), 0) / campaigns.length
        : 0;

      setCounts({
        offers: offersRes.count ?? 0,
        assets: assetsRes.count ?? 0,
        funnels: funnelsRes.count ?? 0,
        ads: adsRes.count ?? 0,
        content: contentRes.count ?? 0,
        adSpend,
        avgRoas,
        milestones: milestonesRes.count ?? 0,
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
      color: "emerald",
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
      label: "Publicites",
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
      color: "orange",
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
    {
      label: "Depense Ads",
      value: counts.adSpend,
      suffix: " €",
      icon: DollarSign,
      color: "blue",
      href: "/ads/analytics",
    },
    {
      label: "ROAS moyen",
      value: counts.avgRoas,
      suffix: "x",
      icon: TrendingUp,
      color: "cyan",
      href: "/ads/analytics",
    },
    {
      label: "Milestones",
      value: counts.milestones,
      icon: Target,
      color: "purple",
      href: "/roadmap",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {stats.map((stat) => {
        const colors = colorMap[stat.color];
        return (
          <div
            key={stat.label}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border-default bg-bg-secondary p-3 sm:p-4 cursor-pointer transition-all duration-300",
              "hover:border-transparent hover:translate-y-[-2px]",
              colors.glow
            )}
            onClick={() => stat.href && router.push(stat.href)}
          >
            {/* Gradient background on hover */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              colors.gradient
            )} />

            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-text-secondary font-medium truncate">{stat.label}</p>
                <div className="mt-1.5 text-lg sm:text-2xl font-bold text-text-primary">
                  {isLoading ? (
                    <span className="inline-block h-7 w-14 animate-pulse rounded bg-white/10" />
                  ) : (
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      decimals={stat.suffix === "x" ? 1 : 0}
                    />
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 shrink-0",
                  colors.bg,
                  "group-hover:scale-110"
                )}
              >
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", colors.icon)} />
              </div>
            </div>

            {/* Subtle shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-700" />
          </div>
        );
      })}
    </div>
  );
}
