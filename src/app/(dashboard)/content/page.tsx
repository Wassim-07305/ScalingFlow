"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PostGenerator } from "@/components/content/post-generator";
import { ContentCalendar } from "@/components/content/content-calendar";
import { StrategyOverview } from "@/components/content/strategy-overview";
import { EditorialCalendar } from "@/components/content/editorial-calendar";
import { ReelsGenerator } from "@/components/content/reels-generator";
import { YouTubeGenerator } from "@/components/content/youtube-generator";
import { StoriesGenerator } from "@/components/content/stories-generator";
import { CarouselGenerator } from "@/components/content/carousel-generator";
import { InstagramOptimizer } from "@/components/content/instagram-optimizer";
import { GenerationHistory } from "@/components/shared/generation-history";
import { cn } from "@/lib/utils/cn";
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

  return (
    <div>
      <PageHeader
        title="Contenu"
        description="Genere et planifie du contenu pour tes reseaux sociaux."
      />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
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

      {activeTab === "strategy" && <StrategyOverview />}
      {activeTab === "reels" && <ReelsGenerator />}
      {activeTab === "youtube" && <YouTubeGenerator />}
      {activeTab === "stories" && <StoriesGenerator />}
      {activeTab === "carousels" && <CarouselGenerator />}
      {activeTab === "instagram" && <InstagramOptimizer />}
      {activeTab === "editorial" && <EditorialCalendar />}
      {activeTab === "history" && (
        <GenerationHistory
          table="content_pieces"
          titleField="title"
          subtitleField="content_type"
          emptyMessage="Aucun contenu genere pour le moment."
        />
      )}
    </div>
  );
}
