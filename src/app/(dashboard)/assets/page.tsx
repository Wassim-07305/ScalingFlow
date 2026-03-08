"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { VSLGenerator } from "@/components/assets/vsl-generator";
import { EmailSequence } from "@/components/assets/email-sequence";
import { SmsSequenceGenerator } from "@/components/assets/sms-sequence-generator";
import { CaseStudyGenerator } from "@/components/assets/case-study-generator";
import { PitchDeckGenerator } from "@/components/assets/pitch-deck-generator";
import { SalesLetterGenerator } from "@/components/assets/sales-letter-generator";
import { SettingScriptGenerator } from "@/components/assets/setting-script-generator";
import { LeadMagnetGenerator } from "@/components/assets/lead-magnet-generator";
import { GenerationHistory } from "@/components/shared/generation-history";
import { TabBar } from "@/components/shared/tab-bar";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Video,
  Mail,
  MessageSquare,
  Presentation,
  FileText,
  Phone,
  Magnet,
  Users,
  History,
} from "lucide-react";

const TABS = [
  { key: "vsl", label: "Script VSL", icon: Video },
  { key: "email", label: "Sequence Email", icon: Mail },
  { key: "sms", label: "Sequence SMS", icon: MessageSquare },
  { key: "pitch_deck", label: "Pitch Deck", icon: Presentation },
  { key: "sales_letter", label: "Sales Letter", icon: FileText },
  { key: "setting_script", label: "Script Setting", icon: Phone },
  { key: "lead_magnet", label: "Lead Magnet", icon: Magnet },
  { key: "case_study", label: "Etude de cas", icon: Users },
  { key: "history", label: "Historique", icon: History },
] as const;

// Map DB asset_type to tab key
const ASSET_TYPE_TO_TAB: Record<string, string> = {
  vsl_script: "vsl",
  email_sequence: "email",
  sms_sequence: "sms",
  pitch_deck: "pitch_deck",
  sales_letter: "sales_letter",
  sales_script: "setting_script",
  lead_magnet: "lead_magnet",
  case_study: "case_study",
};

export default function AssetsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("vsl");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadedData, setLoadedData] = React.useState<Record<string, any>>({});
  const { user } = useUser();

  React.useEffect(() => {
    if (!user) return;
    const loadLatest = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("sales_assets")
        .select("asset_type, ai_raw_response, metadata")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.ai_raw_response) {
        const metadata = data.metadata as { original_type?: string } | null;
        const assetType = metadata?.original_type || data.asset_type;
        const tabKey = ASSET_TYPE_TO_TAB[assetType] || ASSET_TYPE_TO_TAB[data.asset_type];
        if (tabKey) {
          setLoadedData((prev) => ({ ...prev, [tabKey]: data.ai_raw_response }));
        }
      }
    };
    loadLatest();
  }, [user]);

  const handleHistorySelect = async (item: { id: string; subtitle?: string }) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sales_assets")
        .select("asset_type, ai_raw_response, content, metadata")
        .eq("id", item.id)
        .single();

      if (error || !data) {
        toast.error("Impossible de charger cet asset");
        return;
      }

      // Determine the actual asset type (check metadata for original_type)
      const metadata = data.metadata as { original_type?: string } | null;
      const assetType = metadata?.original_type || data.asset_type;
      const tabKey = ASSET_TYPE_TO_TAB[assetType] || ASSET_TYPE_TO_TAB[data.asset_type];

      if (!tabKey) {
        toast.error("Type d'asset non reconnu");
        return;
      }

      // Parse the content — ai_raw_response is already JSON, content might be stringified
      let parsed = data.ai_raw_response;
      if (!parsed && data.content) {
        try {
          parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content;
        } catch {
          parsed = null;
        }
      }

      if (!parsed) {
        toast.error("Contenu de l'asset introuvable");
        return;
      }

      // Store loaded data and switch to the right tab
      setLoadedData((prev) => ({ ...prev, [tabKey]: parsed }));
      setActiveTab(tabKey);
      toast.success("Asset charge depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  return (
    <div>
      <PageHeader
        title="Sales Assets"
        description="Genere tes scripts VSL, emails, pitch decks et plus avec l'IA."
      />

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "vsl" && <VSLGenerator initialData={loadedData.vsl} />}
      {activeTab === "email" && <EmailSequence initialData={loadedData.email} />}
      {activeTab === "sms" && <SmsSequenceGenerator initialData={loadedData.sms} />}
      {activeTab === "pitch_deck" && <PitchDeckGenerator initialData={loadedData.pitch_deck} />}
      {activeTab === "sales_letter" && <SalesLetterGenerator initialData={loadedData.sales_letter} />}
      {activeTab === "setting_script" && <SettingScriptGenerator initialData={loadedData.setting_script} />}
      {activeTab === "lead_magnet" && <LeadMagnetGenerator initialData={loadedData.lead_magnet} />}
      {activeTab === "case_study" && <CaseStudyGenerator initialData={loadedData.case_study} />}
      {activeTab === "history" && (
        <GenerationHistory
          table="sales_assets"
          titleField="title"
          subtitleField="asset_type"
          statusField="status"
          emptyMessage="Aucun asset genere pour le moment."
          onSelect={handleHistorySelect}
        />
      )}
    </div>
  );
}
