"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CreativeGenerator } from "@/components/ads/creative-generator";
import { CampaignDashboard } from "@/components/ads/campaign-dashboard";
import { GenerationHistory } from "@/components/shared/generation-history";
import { cn } from "@/lib/utils/cn";
import { Sparkles, BarChart3, History } from "lucide-react";

const TABS = [
  { key: "creatives", label: "Créatives IA", icon: Sparkles },
  { key: "campaigns", label: "Campagnes", icon: BarChart3 },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function AdsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("creatives");

  return (
    <div>
      <PageHeader
        title="Publicités"
        description="Crée et gère tes campagnes publicitaires."
      />

      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
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

      {activeTab === "creatives" && <CreativeGenerator />}
      {activeTab === "campaigns" && <CampaignDashboard />}
      {activeTab === "history" && (
        <GenerationHistory
          table="ad_creatives"
          titleField="headline"
          subtitleField="ad_copy"
          statusField="status"
          emptyMessage="Aucune créative générée pour le moment."
        />
      )}
    </div>
  );
}
