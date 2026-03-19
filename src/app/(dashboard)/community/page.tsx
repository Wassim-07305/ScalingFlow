"use client";

import { useState, useEffect, useRef, useMemo} from "react";
import { PostFeed } from "@/components/community/post-feed";
import { AutoWins } from "@/components/community/auto-wins";
import { DirectMessages } from "@/components/community/direct-messages";
import { cn } from "@/lib/utils/cn";
import {
  MessageSquare,
  Trophy,
  TrendingUp,
  Users,
  Flame,
  Star,
  Mail,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────
const TABS = [
  { id: "feed" as const, label: "Fil d'actualité", icon: MessageSquare },
  { id: "wins" as const, label: "Victoires", icon: Trophy },
  { id: "messages" as const, label: "Messages", icon: Mail },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Stats bar component ────────────────────────────────────
function CommunityStats({ streakDays }: { streakDays: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({
    activeMembers: "—",
    postsThisMonth: "—",
    streak: "—",
    wins: "—",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      const thirtyDaysAgo = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const [membersRes, postsRes, winsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("last_active_date", thirtyDaysAgo.split("T")[0]),
        supabase
          .from("community_posts")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startOfMonth),
        supabase
          .from("community_posts")
          .select("id", { count: "exact", head: true })
          .eq("auto_generated", true),
      ]);

      setStats({
        activeMembers: (membersRes.count ?? 0).toLocaleString("fr-FR"),
        postsThisMonth: (postsRes.count ?? 0).toLocaleString("fr-FR"),
        streak: `${streakDays}j`,
        wins: (winsRes.count ?? 0).toLocaleString("fr-FR"),
      });
      setLoaded(true);
    }

    fetchStats();
  }, [supabase, streakDays]);

  const statItems = [
    {
      icon: Users,
      label: "Membres actifs",
      value: stats.activeMembers,
      color: "text-accent",
    },
    {
      icon: MessageSquare,
      label: "Posts ce mois",
      value: stats.postsThisMonth,
      color: "text-info",
    },
    {
      icon: Flame,
      label: "Streak",
      value: stats.streak,
      color: "text-warning",
    },
    {
      icon: Star,
      label: "Victoires",
      value: stats.wins,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {statItems.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary/50 px-4 py-3 backdrop-blur-sm transition-all duration-500",
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
          style={{ transitionDelay: loaded ? `${i * 80}ms` : "0ms" }}
        >
          <div className={cn("rounded-xl bg-bg-tertiary p-2.5", stat.color)}>
            <stat.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary tabular-nums">
              {stat.value}
            </p>
            <p className="text-[11px] text-text-muted">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabId>("feed");
  const { profile } = useUser();
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Animated tab indicator
  useEffect(() => {
    if (!tabsContainerRef.current || !tabIndicatorRef.current) return;
    const activeIndex = TABS.findIndex((t) => t.id === activeTab);
    const buttons =
      tabsContainerRef.current.querySelectorAll<HTMLButtonElement>(
        "button[data-tab]",
      );
    const btn = buttons[activeIndex];
    if (!btn) return;
    const container = tabsContainerRef.current;
    tabIndicatorRef.current.style.left = `${btn.offsetLeft - container.offsetLeft}px`;
    tabIndicatorRef.current.style.width = `${btn.offsetWidth}px`;
  }, [activeTab]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border-default bg-gradient-to-br from-accent/5 via-bg-secondary to-bg-secondary p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Communauté
              </h1>
              <p className="text-sm text-text-secondary">
                Échange, partage tes wins et apprends des autres membres.
              </p>
            </div>
          </div>
          {profile && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
                <TrendingUp className="h-3 w-3 text-accent" />
                <span className="text-xs font-medium text-accent">
                  {profile.xp_points?.toLocaleString("fr-FR") || 0} XP
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1">
                <Trophy className="h-3 w-3 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400">
                  Niveau {profile.level || 1}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <CommunityStats streakDays={profile?.streak_days ?? 0} />

      {/* Tab navigation — Premium animated indicator */}
      <div
        ref={tabsContainerRef}
        className="relative flex gap-1 mb-6 rounded-xl bg-bg-secondary/80 border border-border-default p-1"
      >
        {/* Sliding indicator */}
        <div
          ref={tabIndicatorRef}
          className="absolute top-1 bottom-1 rounded-lg bg-accent shadow-lg shadow-accent/20 transition-all duration-300 ease-out pointer-events-none"
        />

        {TABS.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
              activeTab === tab.id
                ? "text-white"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content with fade transition */}
      <div key={activeTab} className="animate-in fade-in duration-300">
        {activeTab === "feed" && <PostFeed />}
        {activeTab === "wins" && <AutoWins />}
        {activeTab === "messages" && <DirectMessages />}
      </div>
    </div>
  );
}
