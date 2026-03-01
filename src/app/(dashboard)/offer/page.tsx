"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { OfferGenerator } from "@/components/offer/offer-generator";
import { CategoryOSWizard } from "@/components/offer/category-os-wizard";
import { OfferScoreCard } from "@/components/offer/offer-score-card";
import { GenerationHistory } from "@/components/shared/generation-history";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Sparkles, Crosshair, BarChart3, History } from "lucide-react";

const TABS = [
  { key: "generate", label: "Generer", icon: Sparkles },
  { key: "positioning", label: "Positionnement", icon: Crosshair },
  { key: "score", label: "Score", icon: BarChart3 },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function OfferPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState<string>("generate");
  const [latestOfferId, setLatestOfferId] = React.useState<string | null>(null);
  const [marketAnalysisId, setMarketAnalysisId] = React.useState<string | null>(null);
  const [marketName, setMarketName] = React.useState<string | null>(null);
  const supabase = createClient();

  // Fetch user's latest offer and market analysis
  React.useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get selected market analysis
      const { data: market } = await supabase
        .from("market_analyses")
        .select("id, market_name")
        .eq("user_id", user.id)
        .eq("selected", true)
        .single();

      if (market) {
        setMarketAnalysisId(market.id);
        setMarketName(market.market_name);
      }

      // Get latest offer
      const { data: offers } = await supabase
        .from("offers")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (offers && offers.length > 0) {
        setLatestOfferId(offers[0].id);
      }
    };

    fetchData();
  }, [user, supabase]);

  return (
    <div>
      <PageHeader
        title="Creation d'Offre"
        description="Genere ton offre irresistible avec l'IA."
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

      {activeTab === "generate" && (
        <OfferGenerator
          marketAnalysisId={marketAnalysisId || undefined}
          marketName={marketName || undefined}
        />
      )}
      {activeTab === "positioning" && (
        <CategoryOSWizard offerId={latestOfferId || undefined} />
      )}
      {activeTab === "score" && (
        <OfferScoreCard offerId={latestOfferId || undefined} />
      )}
      {activeTab === "history" && (
        <GenerationHistory
          table="offers"
          titleField="offer_name"
          subtitleField="positioning"
          statusField="status"
          emptyMessage="Aucune offre generee pour le moment."
        />
      )}
    </div>
  );
}
