"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PostFeed } from "@/components/community/post-feed";

export default function CommunityPage() {
  return (
    <div>
      <PageHeader
        title="Communauté"
        description="Échange avec les autres membres ScalingFlow."
      />
      <PostFeed />
    </div>
  );
}
