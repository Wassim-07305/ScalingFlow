"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PostGenerator } from "@/components/content/post-generator";
import { StrategyOverview } from "@/components/content/strategy-overview";
import { EditorialCalendar } from "@/components/content/editorial-calendar";
import { ReelsGenerator } from "@/components/content/reels-generator";
import { YouTubeGenerator } from "@/components/content/youtube-generator";
import { StoriesGenerator } from "@/components/content/stories-generator";
import { CarouselGenerator } from "@/components/content/carousel-generator";
import { InstagramOptimizer } from "@/components/content/instagram-optimizer";
import { GenerationHistory } from "@/components/shared/generation-history";
import { cn } from "@/lib/utils/cn";
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

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" role="tablist" aria-label="Types de contenu">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "strategy" && <div role="tabpanel" id="tabpanel-strategy" aria-labelledby="tab-strategy"><StrategyOverview initialData={loadedData.strategy} /></div>}
      {activeTab === "reels" && <div role="tabpanel" id="tabpanel-reels" aria-labelledby="tab-reels"><ReelsGenerator initialData={loadedData.reels} /></div>}
      {activeTab === "youtube" && <div role="tabpanel" id="tabpanel-youtube" aria-labelledby="tab-youtube"><YouTubeGenerator initialData={loadedData.youtube} /></div>}
      {activeTab === "stories" && <div role="tabpanel" id="tabpanel-stories" aria-labelledby="tab-stories"><StoriesGenerator initialData={loadedData.stories} /></div>}
      {activeTab === "carousels" && <div role="tabpanel" id="tabpanel-carousels" aria-labelledby="tab-carousels"><CarouselGenerator initialData={loadedData.carousels} /></div>}
      {activeTab === "instagram" && <div role="tabpanel" id="tabpanel-instagram" aria-labelledby="tab-instagram"><InstagramOptimizer initialData={loadedData.instagram} /></div>}
      {activeTab === "editorial" && <div role="tabpanel" id="tabpanel-editorial" aria-labelledby="tab-editorial"><EditorialCalendar initialData={loadedData.editorial} /></div>}
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
