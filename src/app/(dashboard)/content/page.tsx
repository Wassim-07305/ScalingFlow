"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/shared/tab-bar";
import { StrategyOverview } from "@/components/content/strategy-overview";
import { EditorialCalendar } from "@/components/content/editorial-calendar";
import { ReelsGenerator } from "@/components/content/reels-generator";
import { YouTubeGenerator } from "@/components/content/youtube-generator";
import { StoriesGenerator } from "@/components/content/stories-generator";
import { CarouselGenerator } from "@/components/content/carousel-generator";
import { InstagramOptimizer } from "@/components/content/instagram-optimizer";
import { GenerationHistory } from "@/components/shared/generation-history";
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
  { key: "strategy", label: "Strategie", icon: Target },
  { key: "reels", label: "Reels", icon: Film },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "stories", label: "Stories", icon: BookImage },
  { key: "carousels", label: "Carousels", icon: Layers },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "editorial", label: "Plan Editorial", icon: CalendarDays },
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
      toast.success("Contenu charge depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  return (
    <div>
      <PageHeader
        title="Contenu"
        description="Genere et planifie du contenu pour tes reseaux sociaux."
      />

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "strategy" && <StrategyOverview initialData={loadedData.strategy} />}
      {activeTab === "reels" && <ReelsGenerator initialData={loadedData.reels} />}
      {activeTab === "youtube" && <YouTubeGenerator initialData={loadedData.youtube} />}
      {activeTab === "stories" && <StoriesGenerator initialData={loadedData.stories} />}
      {activeTab === "carousels" && <CarouselGenerator initialData={loadedData.carousels} />}
      {activeTab === "instagram" && <InstagramOptimizer initialData={loadedData.instagram} />}
      {activeTab === "editorial" && <EditorialCalendar initialData={loadedData.editorial} />}
      {activeTab === "history" && (
        <GenerationHistory
          table="content_pieces"
          titleField="title"
          subtitleField="content_type"
          emptyMessage="Aucun contenu genere pour le moment."
          onSelect={handleHistorySelect}
        />
      )}
    </div>
  );
}
