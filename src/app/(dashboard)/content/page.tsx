"use client";

import React, { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/shared/tab-bar";
import { PostGenerator } from "@/components/content/post-generator";
import { StrategyOverview } from "@/components/content/strategy-overview";
import { EditorialCalendar } from "@/components/content/editorial-calendar";
import { ReelsGenerator } from "@/components/content/reels-generator";
import { YouTubeGenerator } from "@/components/content/youtube-generator";
import { StoriesGenerator } from "@/components/content/stories-generator";
import { CarouselGenerator } from "@/components/content/carousel-generator";
import { InstagramOptimizer } from "@/components/content/instagram-optimizer";
import { ContentSpy } from "@/components/ads/content-spy";
import { WeeklyContentBatch } from "@/components/content/weekly-content-batch";
import { ObjectionContent } from "@/components/content/objection-content";
import { SocialPublisher } from "@/components/content/social-publisher";
import { GenerationHistory } from "@/components/shared/generation-history";
import { InstagramStats } from "@/components/integrations/instagram-stats";
import { AISuggestions } from "@/components/content/ai-suggestions";
import { ContentPerformanceWidget } from "@/components/content/content-performance-widget";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Target,
  Film,
  Youtube,
  BookImage,
  Layers,
  Instagram,
  CalendarDays,
  History,
  Search,
  Zap,
  MessageSquareWarning,
  Share2,
  BarChart3,
  Sparkles,
} from "lucide-react";

const CONTENT_TYPE_TO_TAB: Record<string, string> = {
  instagram_reel: "reels",
  instagram_story: "stories",
  instagram_carousel: "carousels",
  instagram_post: "instagram",
  youtube_video: "youtube",
  youtube_short: "youtube",
  linkedin_post: "strategy",
  tiktok_video: "reels",
  blog_post: "editorial",
  strategy: "strategy",
  reels: "reels",
  youtube: "youtube",
  stories: "stories",
  carousel: "carousels",
  editorial: "editorial",
};

const TABS = [
  { key: "suggestions", label: "Suggestions IA", icon: Sparkles },
  { key: "strategy", label: "Stratégie", icon: Target },
  { key: "reels", label: "Reels", icon: Film },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "stories", label: "Stories", icon: BookImage },
  { key: "carousels", label: "Carousels", icon: Layers },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "editorial", label: "Plan Éditorial", icon: CalendarDays },
  { key: "batch_hebdo", label: "Batch Hebdo", icon: Zap },
  {
    key: "objections_contenu",
    label: "Objections → Contenu",
    icon: MessageSquareWarning,
  },
  { key: "content_spy", label: "Content Spy", icon: Search },
  { key: "publication", label: "Publication", icon: Share2 },
  { key: "instagram_stats", label: "Stats Instagram", icon: BarChart3 },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function ContentPage() {
  const [activeTab, setActiveTab] = React.useState<string>("strategy");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadedData, setLoadedData] = React.useState<Record<string, any>>({});

  const handleHistorySelect = async (item: { id: string }) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("content_pieces")
        .select("content_type, ai_raw_response, title")
        .eq("id", item.id)
        .single();
      if (error || !data) {
        toast.error("Impossible de charger ce contenu");
        return;
      }
      const parsed = data.ai_raw_response || data;
      const tabKey = CONTENT_TYPE_TO_TAB[data.content_type] || "strategy";
      setLoadedData((prev) => ({ ...prev, [tabKey]: parsed }));
      setActiveTab(tabKey);
      toast.success("Contenu chargé depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  return (
    <div>
      <PageHeader
        title="Contenu"
        description="Génère et planifie du contenu pour tes réseaux sociaux."
      />

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "suggestions" && (
        <div
          role="tabpanel"
          id="tabpanel-suggestions"
          aria-labelledby="tab-suggestions"
        >
          <AISuggestions />
        </div>
      )}
      {activeTab === "strategy" && (
        <div
          role="tabpanel"
          id="tabpanel-strategy"
          aria-labelledby="tab-strategy"
        >
          <ContentPerformanceWidget className="mb-6" />
          <StrategyOverview initialData={loadedData.strategy} />
        </div>
      )}
      {activeTab === "reels" && (
        <div role="tabpanel" id="tabpanel-reels" aria-labelledby="tab-reels">
          <ReelsGenerator initialData={loadedData.reels} />
        </div>
      )}
      {activeTab === "youtube" && (
        <div
          role="tabpanel"
          id="tabpanel-youtube"
          aria-labelledby="tab-youtube"
        >
          <YouTubeGenerator initialData={loadedData.youtube} />
        </div>
      )}
      {activeTab === "stories" && (
        <div
          role="tabpanel"
          id="tabpanel-stories"
          aria-labelledby="tab-stories"
        >
          <StoriesGenerator initialData={loadedData.stories} />
        </div>
      )}
      {activeTab === "carousels" && (
        <div
          role="tabpanel"
          id="tabpanel-carousels"
          aria-labelledby="tab-carousels"
        >
          <CarouselGenerator initialData={loadedData.carousels} />
        </div>
      )}
      {activeTab === "instagram" && (
        <div
          role="tabpanel"
          id="tabpanel-instagram"
          aria-labelledby="tab-instagram"
        >
          <InstagramOptimizer initialData={loadedData.instagram} />
        </div>
      )}
      {activeTab === "editorial" && (
        <div
          role="tabpanel"
          id="tabpanel-editorial"
          aria-labelledby="tab-editorial"
        >
          <EditorialCalendar initialData={loadedData.editorial} />
        </div>
      )}
      {activeTab === "batch_hebdo" && (
        <div
          role="tabpanel"
          id="tabpanel-batch_hebdo"
          aria-labelledby="tab-batch_hebdo"
        >
          <WeeklyContentBatch />
        </div>
      )}
      {activeTab === "objections_contenu" && (
        <div
          role="tabpanel"
          id="tabpanel-objections_contenu"
          aria-labelledby="tab-objections_contenu"
        >
          <ObjectionContent />
        </div>
      )}
      {activeTab === "content_spy" && (
        <div
          role="tabpanel"
          id="tabpanel-content_spy"
          aria-labelledby="tab-content_spy"
        >
          <ContentSpy />
        </div>
      )}
      {activeTab === "publication" && (
        <div
          role="tabpanel"
          id="tabpanel-publication"
          aria-labelledby="tab-publication"
        >
          <SocialPublisher />
        </div>
      )}
      {activeTab === "instagram_stats" && (
        <div
          role="tabpanel"
          id="tabpanel-instagram_stats"
          aria-labelledby="tab-instagram_stats"
        >
          <InstagramStats />
        </div>
      )}
      {activeTab === "history" && (
        <div
          role="tabpanel"
          id="tabpanel-history"
          aria-labelledby="tab-history"
        >
          <GenerationHistory
            table="content_pieces"
            titleField="title"
            subtitleField="content_type"
            emptyMessage="Aucun contenu généré pour le moment."
            onSelect={handleHistorySelect}
          />
        </div>
      )}
    </div>
  );
}
