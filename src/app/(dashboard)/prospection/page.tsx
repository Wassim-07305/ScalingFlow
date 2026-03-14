"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AcquisitionStrategy } from "@/components/prospection/acquisition-strategy";
import { WarmCallScript } from "@/components/prospection/warm-call-script";
import { DmScripts } from "@/components/prospection/dm-scripts";
import { OutboundWorkflow } from "@/components/prospection/outbound-workflow";
import { GenerationHistory } from "@/components/shared/generation-history";
import { TabBar } from "@/components/shared/tab-bar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Compass, Phone, MessageSquare, GitBranch, History } from "lucide-react";

const TABS = [
  { key: "strategy", label: "Stratégie d'Acquisition", icon: Compass },
  { key: "warm_call", label: "Script Appel Tiède", icon: Phone },
  { key: "dm", label: "Scripts DM", icon: MessageSquare },
  { key: "workflow", label: "Workflow Outbound", icon: GitBranch },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function ProspectionPage() {
  const [activeTab, setActiveTab] = React.useState<string>("strategy");

  const handleHistorySelect = async (item: { id: string }) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sales_assets")
        .select("asset_type, ai_raw_response, content, metadata")
        .eq("id", item.id)
        .single();

      if (error || !data) {
        toast.error("Impossible de charger cet élément");
        return;
      }

      // Déterminer l'onglet cible depuis les metadata
      const metadata = data.metadata as { scriptType?: string } | null;
      const scriptType = metadata?.scriptType;

      if (scriptType === "acquisition_strategy") {
        setActiveTab("strategy");
      } else if (scriptType === "warm_call") {
        setActiveTab("warm_call");
      } else if (scriptType === "dm_scripts") {
        setActiveTab("dm");
      } else if (scriptType === "outbound_workflow") {
        setActiveTab("workflow");
      } else {
        setActiveTab("strategy");
      }

      toast.success("Élément chargé depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "strategy":
        return <AcquisitionStrategy />;
      case "warm_call":
        return <WarmCallScript />;
      case "dm":
        return <DmScripts />;
      case "workflow":
        return <OutboundWorkflow />;
      case "history":
        return (
          <GenerationHistory
            table="sales_assets"
            titleField="title"
            subtitleField="asset_type"
            statusField="status"
            filters={{ asset_type: "sales_script" }}
            emptyMessage="Aucun élément de prospection généré pour le moment."
            onSelect={handleHistorySelect}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader
        title="Prospection & Closing"
        description="Stratégie d'acquisition, scripts d'appels, DMs et workflows outbound."
      />

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {renderContent()}
    </div>
  );
}
