"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CreativeGenerator } from "@/components/ads/creative-generator";
import { CampaignDashboard } from "@/components/ads/campaign-dashboard";
import { VideoAdGenerator } from "@/components/ads/video-ad-generator";
import { DMScriptGenerator } from "@/components/ads/dm-script-generator";
import { FollowerAdsGenerator } from "@/components/ads/follower-ads-generator";
import { DmRetargetingGenerator } from "@/components/ads/dm-retargeting-generator";
import { AdsAutomation } from "@/components/ads/ads-automation";
import { AdSpy } from "@/components/ads/ad-spy";
import { GenerationHistory } from "@/components/shared/generation-history";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Sparkles, BarChart3, Video, MessageSquare, Users, MessageCircle, History, Zap, Eye } from "lucide-react";

const TABS = [
  { key: "creatives", label: "Creatives IA", icon: Sparkles },
  { key: "campaigns", label: "Campagnes", icon: BarChart3 },
  { key: "automation", label: "Automation", icon: Zap },
  { key: "video_ads", label: "Video Ads", icon: Video },
  { key: "dm_scripts", label: "Scripts DM", icon: MessageSquare },
  { key: "follower_ads", label: "Follower Ads", icon: Users },
  { key: "dm_retargeting", label: "DM Retargeting", icon: MessageCircle },
  { key: "ad_spy", label: "Ad Spy", icon: Eye },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function AdsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("creatives");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadedData, setLoadedData] = React.useState<Record<string, any>>({});

  const handleHistorySelect = async (item: { id: string }) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ad_creatives")
        .select("creative_type, ai_raw_response, ad_copy, headline, hook, cta, video_script, angle")
        .eq("id", item.id)
        .single();
      if (error || !data) {
        toast.error("Impossible de charger ce creative");
        return;
      }
      const parsed = data.ai_raw_response || data;
      const typeMap: Record<string, string> = {
        image: "creatives",
        carousel: "creatives",
        video: "video_ads",
        video_script: "video_ads",
        video_ad: "video_ads",
        dm: "dm_scripts",
        dm_scripts: "dm_scripts",
      };
      const tabKey = typeMap[data.creative_type] || "creatives";
      setLoadedData((prev) => ({ ...prev, [tabKey]: parsed }));
      setActiveTab(tabKey);
      toast.success("Creative chargee depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  return (
    <div>
      <PageHeader
        title="Publicites"
        description="Cree et gere tes campagnes publicitaires."
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

      {activeTab === "creatives" && <CreativeGenerator initialData={loadedData.creatives} />}
      {activeTab === "campaigns" && <CampaignDashboard />}
      {activeTab === "automation" && <AdsAutomation />}
      {activeTab === "video_ads" && <VideoAdGenerator initialData={loadedData.video_ads} />}
      {activeTab === "dm_scripts" && <DMScriptGenerator initialData={loadedData.dm_scripts} />}
      {activeTab === "follower_ads" && <FollowerAdsGenerator initialData={loadedData.follower_ads} />}
      {activeTab === "dm_retargeting" && <DmRetargetingGenerator initialData={loadedData.dm_retargeting} />}
      {activeTab === "ad_spy" && <AdSpy />}
      {activeTab === "history" && (
        <GenerationHistory
          table="ad_creatives"
          titleField="headline"
          subtitleField="ad_copy"
          statusField="status"
          emptyMessage="Aucune creative generee pour le moment."
          onSelect={handleHistorySelect}
        />
      )}
    </div>
  );
}
