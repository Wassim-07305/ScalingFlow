"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CreativeGenerator } from "@/components/ads/creative-generator";
import { CampaignDashboard } from "@/components/ads/campaign-dashboard";
import { cn } from "@/lib/utils/cn";
import { Sparkles, BarChart3 } from "lucide-react";

const TABS = [
  { key: "creatives", label: "Créatives IA", icon: Sparkles },
  { key: "campaigns", label: "Campagnes", icon: BarChart3 },
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
                ? "bg-neon-orange text-white shadow-[0_0_20px_rgba(255,107,44,0.3)]"
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
    </div>
  );
}
