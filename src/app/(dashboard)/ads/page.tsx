"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CreativeGenerator } from "@/components/ads/creative-generator";
import { CampaignDashboard } from "@/components/ads/campaign-dashboard";
import { VideoAdGenerator } from "@/components/ads/video-ad-generator";
import { DMScriptGenerator } from "@/components/ads/dm-script-generator";
import { AdSpy } from "@/components/ads/ad-spy";
import { ContentSpy } from "@/components/ads/content-spy";
import { GenerationHistory } from "@/components/shared/generation-history";
import { TabBar } from "@/components/shared/tab-bar";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { Sparkles, BarChart3, Video, MessageSquare, History, Eye, Search } from "lucide-react";

const TABS = [
  { key: "creatives", label: "Creatives IA", icon: Sparkles },
  { key: "campaigns", label: "Campagnes", icon: BarChart3 },
  { key: "video_ads", label: "Video Ads", icon: Video },
  { key: "dm_scripts", label: "Scripts DM", icon: MessageSquare },
  { key: "ad_spy", label: "Ad Spy", icon: Eye },
  { key: "content_spy", label: "Content Spy", icon: Search },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function AdsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("creatives");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadedData, setLoadedData] = React.useState<Record<string, any>>({});
  const { user } = useUser();

  React.useEffect(() => {
    if (!user) return;
    const loadLatest = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("ad_creatives")
        .select("creative_type, ai_raw_response")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.ai_raw_response) {
        const typeMap: Record<string, string> = {
          image: "creatives",
          carousel: "creatives",
          video_script: "video_ads",
          video_ad: "video_ads",
          dm_scripts: "dm_scripts",
        };
        const tabKey = typeMap[data.creative_type] || "creatives";
        setLoadedData((prev) => ({ ...prev, [tabKey]: data.ai_raw_response }));
      }
    };
    loadLatest();
  }, [user]);

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
        video_script: "video_ads",
        video_ad: "video_ads",
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

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "creatives" && <CreativeGenerator initialData={loadedData.creatives} />}
      {activeTab === "campaigns" && <CampaignDashboard />}
      {activeTab === "video_ads" && <VideoAdGenerator initialData={loadedData.video_ads} />}
      {activeTab === "dm_scripts" && <DMScriptGenerator initialData={loadedData.dm_scripts} />}
      {activeTab === "ad_spy" && <AdSpy />}
      {activeTab === "content_spy" && <ContentSpy />}
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
