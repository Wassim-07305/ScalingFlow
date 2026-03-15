"use client";

import { Suspense, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PostFeed } from "@/components/community/post-feed";
import { AutoWins } from "@/components/community/auto-wins";
import { SkeletonCard } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { MessageSquare, Trophy, HelpCircle, Sparkles } from "lucide-react";

const CATEGORIES = [
  { icon: MessageSquare, label: "Général", color: "text-info" },
  { icon: Trophy, label: "Wins", color: "text-accent" },
  { icon: HelpCircle, label: "Questions", color: "text-warning" },
];

const TABS = [
  { id: "feed" as const, label: "Fil d'actualité", icon: MessageSquare },
  { id: "wins" as const, label: "Victoires", icon: Sparkles },
];

type TabId = (typeof TABS)[number]["id"];

function CommunityHeader() {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {CATEGORIES.map((cat) => (
        <div key={cat.label} className="flex items-center gap-2 rounded-full border border-border-default bg-bg-secondary px-3 py-1.5">
          <cat.icon className={`h-4 w-4 ${cat.color}`} />
          <span className="text-xs text-text-secondary">{cat.label}</span>
        </div>
      ))}
    </div>
  );
}

function PostFeedFallback() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} className="h-28" />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabId>("feed");

  return (
    <div>
      <PageHeader
        title="Communauté"
        description="Échange avec les autres membres ScalingFlow."
      />
      <CommunityHeader />

      {/* Onglets Feed / Victoires */}
      <div className="flex gap-2 mb-6 border-b border-border-default pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "feed" && (
        <Suspense fallback={<PostFeedFallback />}>
          <PostFeed />
        </Suspense>
      )}

      {activeTab === "wins" && (
        <Suspense fallback={<PostFeedFallback />}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">
                Victoires automatiques
              </h2>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Les accomplissements des membres sont automatiquement célébrés ici.
              Badges débloqués, paliers XP, premiers funnels publiés...
            </p>
            <AutoWins />
          </div>
        </Suspense>
      )}
    </div>
  );
}
