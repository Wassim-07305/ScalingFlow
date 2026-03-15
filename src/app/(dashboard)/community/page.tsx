"use client";

import { useState } from "react";
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

// ─── Types ──────────────────────────────────────────────────
const TABS = [
  { id: "feed" as const, label: "Fil d'actualité", icon: MessageSquare },
  { id: "wins" as const, label: "Victoires", icon: Trophy },
  { id: "messages" as const, label: "Messages", icon: Mail },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Stats bar component ────────────────────────────────────
function CommunityStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        { icon: Users, label: "Membres actifs", value: "—", color: "text-accent" },
        { icon: MessageSquare, label: "Posts ce mois", value: "—", color: "text-info" },
        { icon: Flame, label: "Streak communauté", value: "—", color: "text-warning" },
        { icon: Star, label: "Victoires", value: "—", color: "text-cyan-400" },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary/50 px-4 py-3 backdrop-blur-sm"
        >
          <div className={cn("rounded-xl bg-bg-tertiary p-2.5", stat.color)}>
            <stat.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{stat.value}</p>
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border-default bg-gradient-to-br from-accent/5 via-bg-secondary to-bg-secondary p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
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
      <CommunityStats />

      {/* Tab navigation — Skool-style */}
      <div className="flex gap-1 mb-6 rounded-xl bg-bg-secondary/80 border border-border-default p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "feed" && <PostFeed />}
      {activeTab === "wins" && <AutoWins />}
      {activeTab === "messages" && <DirectMessages />}
    </div>
  );
}
