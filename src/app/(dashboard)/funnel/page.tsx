"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/shared/tab-bar";
import { FunnelBuilder } from "@/components/funnel/funnel-builder";
import { GenerationHistory } from "@/components/shared/generation-history";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, History } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { key: "generate", label: "Générer", icon: Sparkles },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function FunnelPage() {
  const [activeTab, setActiveTab] = React.useState<string>("generate");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadedData, setLoadedData] = React.useState<any>(null);
  const supabase = createClient();

  const handleHistorySelect = async (item: { id: string }) => {
    try {
      const { data, error } = await supabase
        .from("funnels")
        .select("ai_raw_response, optin_page, vsl_page, thankyou_page, funnel_name")
        .eq("id", item.id)
        .single();

      if (error || !data) {
        toast.error("Impossible de charger ce funnel");
        return;
      }

      setLoadedData(data.ai_raw_response || data);
      setActiveTab("generate");
      toast.success("Funnel charge depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  return (
    <div>
      <PageHeader
        title="Funnel Builder"
        description="Construis ton funnel de conversion avec copy IA."
      />

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "generate" && <FunnelBuilder initialData={loadedData} />}
      {activeTab === "history" && (
        <GenerationHistory
          table="funnels"
          titleField="funnel_name"
          statusField="status"
          emptyMessage="Aucun funnel généré pour le moment."
          onSelect={handleHistorySelect}
        />
      )}
    </div>
  );
}
