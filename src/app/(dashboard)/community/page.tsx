"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PostFeed } from "@/components/community/post-feed";
import { SkeletonCard } from "@/components/ui/skeleton";
import { MessageSquare, Trophy, HelpCircle } from "lucide-react";

const CATEGORIES = [
  { icon: MessageSquare, label: "Général", color: "text-info" },
  { icon: Trophy, label: "Wins", color: "text-accent" },
  { icon: HelpCircle, label: "Questions", color: "text-warning" },
];

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
  return (
    <div>
      <PageHeader
        title="Communauté"
        description="Échange avec les autres membres ScalingFlow."
      />
      <CommunityHeader />
      <Suspense fallback={<PostFeedFallback />}>
        <PostFeed />
      </Suspense>
    </div>
  );
}
