"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { OfferGenerator } from "@/components/offer/offer-generator";
import { OtoGenerator } from "@/components/offer/oto-generator";
import { CategoryOSWizard } from "@/components/offer/category-os-wizard";
import { OfferScoreCard } from "@/components/offer/offer-score-card";
import { DeliveryDesigner } from "@/components/offer/delivery-designer";
import { GenerationHistory } from "@/components/shared/generation-history";
import { TabBar } from "@/components/shared/tab-bar";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Sparkles, Crosshair, BarChart3, Gift, Settings, History } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { key: "generate", label: "Generer", icon: Sparkles },
  { key: "positioning", label: "Positionnement", icon: Crosshair },
  { key: "score", label: "Score", icon: BarChart3 },
  { key: "oto", label: "Offre OTO", icon: Gift },
  { key: "delivery", label: "Delivery", icon: Settings },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function OfferPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState<string>("generate");
  const [latestOfferId, setLatestOfferId] = React.useState<string | null>(null);
  const [marketAnalysisId, setMarketAnalysisId] = React.useState<string | null>(null);
  const [marketName, setMarketName] = React.useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadedData, setLoadedData] = React.useState<any>(null);
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
        .select("id, ai_raw_response, offer_name, positioning, unique_mechanism, pricing_strategy, guarantees, risk_reversal, delivery_structure, oto_offer, delivery_data, full_document")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (offers && offers.length > 0) {
        setLatestOfferId(offers[0].id);
        // Auto-load last offer data into generator
        if (offers[0].ai_raw_response) {
          setLoadedData(offers[0].ai_raw_response);
        }
      }
    };

    fetchData();
  }, [user, supabase]);

  const handleHistorySelect = async (item: { id: string }) => {
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("ai_raw_response, offer_name, positioning, unique_mechanism, pricing_strategy, guarantees, risk_reversal, delivery_structure, oto_offer, delivery_data, full_document")
        .eq("id", item.id)
        .single();

      if (error || !data) {
        toast.error("Impossible de charger cette offre");
        return;
      }

      setLoadedData(data.ai_raw_response || data);
      setActiveTab("generate");
      toast.success("Offre chargee depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  return (
    <div>
      <PageHeader
        title="Creation d'Offre"
        description="Genere ton offre irresistible avec l'IA."
      />

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "generate" && (
        <OfferGenerator
          marketAnalysisId={marketAnalysisId || undefined}
          marketName={marketName || undefined}
          initialData={loadedData}
        />
      )}
      {activeTab === "positioning" && (
        <CategoryOSWizard offerId={latestOfferId || undefined} />
      )}
      {activeTab === "score" && (
        <OfferScoreCard offerId={latestOfferId || undefined} />
      )}
      {activeTab === "oto" && (
        <OtoGenerator offerId={latestOfferId || undefined} initialData={loadedData} />
      )}
      {activeTab === "delivery" && (
        <DeliveryDesigner offerId={latestOfferId || undefined} initialData={loadedData} />
      )}
      {activeTab === "history" && (
        <GenerationHistory
          table="offers"
          titleField="offer_name"
          subtitleField="positioning"
          statusField="status"
          emptyMessage="Aucune offre generee pour le moment."
          onSelect={handleHistorySelect}
        />
      )}
    </div>
  );
}
