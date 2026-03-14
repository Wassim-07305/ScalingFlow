"use client";

import React from "react";
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
  Search,
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
  { key: "content_spy", label: "Content Spy", icon: Search },
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

      {activeTab === "strategy" && <div role="tabpanel" id="tabpanel-strategy" aria-labelledby="tab-strategy"><StrategyOverview initialData={loadedData.strategy} /></div>}
      {activeTab === "reels" && <div role="tabpanel" id="tabpanel-reels" aria-labelledby="tab-reels"><ReelsGenerator initialData={loadedData.reels} /></div>}
      {activeTab === "youtube" && <div role="tabpanel" id="tabpanel-youtube" aria-labelledby="tab-youtube"><YouTubeGenerator initialData={loadedData.youtube} /></div>}
      {activeTab === "stories" && <div role="tabpanel" id="tabpanel-stories" aria-labelledby="tab-stories"><StoriesGenerator initialData={loadedData.stories} /></div>}
      {activeTab === "carousels" && <div role="tabpanel" id="tabpanel-carousels" aria-labelledby="tab-carousels"><CarouselGenerator initialData={loadedData.carousels} /></div>}
      {activeTab === "instagram" && <div role="tabpanel" id="tabpanel-instagram" aria-labelledby="tab-instagram"><InstagramOptimizer initialData={loadedData.instagram} /></div>}
      {activeTab === "editorial" && <div role="tabpanel" id="tabpanel-editorial" aria-labelledby="tab-editorial"><EditorialCalendar initialData={loadedData.editorial} /></div>}
      {activeTab === "content_spy" && <div role="tabpanel" id="tabpanel-content_spy" aria-labelledby="tab-content_spy"><ContentSpy /></div>}
      {activeTab === "history" && (<div role="tabpanel" id="tabpanel-history" aria-labelledby="tab-history">
        <GenerationHistory
          table="content_pieces"
          titleField="title"
          subtitleField="content_type"
          emptyMessage="Aucun contenu genere pour le moment."
          onSelect={handleHistorySelect}
        />
      </div>)}
    </div>
  );
}
