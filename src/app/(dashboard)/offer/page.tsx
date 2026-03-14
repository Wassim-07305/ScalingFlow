"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/shared/tab-bar";
import { OfferGenerator } from "@/components/offer/offer-generator";
import { CategoryOSWizard } from "@/components/offer/category-os-wizard";
import { OfferScoreCard } from "@/components/offer/offer-score-card";
import { GenerationHistory } from "@/components/shared/generation-history";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Sparkles, Crosshair, BarChart3, History, DollarSign, Settings, Gift } from "lucide-react";
import { toast } from "sonner";
import { PricingBuilder } from "@/components/offer/pricing-builder";
import { DeliveryDesigner } from "@/components/offer/delivery-designer";
import { OtoGenerator } from "@/components/offer/oto-generator";

const TABS = [
  { key: "generate", label: "Générer", icon: Sparkles },
  { key: "positioning", label: "Positionnement", icon: Crosshair },
  { key: "pricing", label: "Pricing", icon: DollarSign },
  { key: "delivery", label: "Livraison", icon: Settings },
  { key: "oto", label: "Upsell (OTO)", icon: Gift },
  { key: "score", label: "Score", icon: BarChart3 },
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
  const [pricingData, setPricingData] = React.useState<{
    anchorPrice: number;
    realPrice: number;
    valueBreakdown: { item: string; value: number }[];
  }>({ anchorPrice: 0, realPrice: 0, valueBreakdown: [] });
  const [savingPricing, setSavingPricing] = React.useState(false);
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

      // Get latest offer with pricing
      const { data: offers } = await supabase
        .from("offers")
        .select("id, pricing_strategy")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (offers && offers.length > 0) {
        setLatestOfferId(offers[0].id);
        const ps = offers[0].pricing_strategy as { anchor_price?: number; real_price?: number; value_breakdown?: { item: string; value: number }[] } | null;
        if (ps) {
          setPricingData({
            anchorPrice: ps.anchor_price || 0,
            realPrice: ps.real_price || 0,
            valueBreakdown: ps.value_breakdown || [],
          });
        }
      }
    };

    fetchData();
  }, [user, supabase]);

  const handleHistorySelect = async (item: { id: string }) => {
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("ai_raw_response, offer_name, positioning, unique_mechanism, pricing_strategy, guarantees, risk_reversal, delivery_structure, oto_offer, full_document")
        .eq("id", item.id)
        .single();

      if (error || !data) {
        toast.error("Impossible de charger cette offre");
        return;
      }

      setLoadedData(data.ai_raw_response || data);
      setActiveTab("generate");
      toast.success("Offre chargée depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  const handleSavePricing = async () => {
    if (!latestOfferId) {
      toast.error("Aucune offre à modifier. Génère d'abord une offre.");
      return;
    }
    setSavingPricing(true);
    try {
      const { error } = await supabase
        .from("offers")
        .update({
          pricing_strategy: {
            anchor_price: pricingData.anchorPrice,
            real_price: pricingData.realPrice,
            value_breakdown: pricingData.valueBreakdown,
          },
        })
        .eq("id", latestOfferId);
      if (error) throw error;
      toast.success("Stratégie de prix sauvegardée !");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSavingPricing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Création d'Offre"
        description="Génère ton offre irrésistible avec l'IA."
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
      {activeTab === "pricing" && (
        <div className="space-y-4">
          <PricingBuilder
            anchorPrice={pricingData.anchorPrice}
            realPrice={pricingData.realPrice}
            valueBreakdown={pricingData.valueBreakdown}
            onChange={setPricingData}
          />
          <Button onClick={handleSavePricing} disabled={savingPricing || !latestOfferId}>
            {savingPricing ? "Sauvegarde..." : "Sauvegarder le pricing"}
          </Button>
        </div>
      )}
      {activeTab === "delivery" && (
        <DeliveryDesigner offerId={latestOfferId || undefined} />
      )}
      {activeTab === "oto" && (
        <OtoGenerator offerId={latestOfferId || undefined} />
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
          emptyMessage="Aucune offre générée pour le moment."
          onSelect={handleHistorySelect}
        />
      )}
    </div>
  );
}
