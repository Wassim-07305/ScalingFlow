"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { VSLGenerator } from "@/components/assets/vsl-generator";
import { EmailSequence } from "@/components/assets/email-sequence";
import { PitchDeckGenerator } from "@/components/assets/pitch-deck-generator";
import { SalesLetterGenerator } from "@/components/assets/sales-letter-generator";
import { SettingScriptGenerator } from "@/components/assets/setting-script-generator";
import { LeadMagnetGenerator } from "@/components/assets/lead-magnet-generator";
import { GenerationHistory } from "@/components/shared/generation-history";
import { cn } from "@/lib/utils/cn";
import {
  Video,
  Mail,
  MessageSquare,
  Presentation,
  FileText,
  Phone,
  Magnet,
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
  { key: "history", label: "Historique", icon: History },
] as const;

export default function AssetsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("vsl");

  return (
    <div>
      <PageHeader
        title="Sales Assets"
        description="Genere tes scripts VSL, emails, pitch decks et plus avec l'IA."
      />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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

      {activeTab === "vsl" && <VSLGenerator />}
      {activeTab === "email" && <EmailSequence />}
      {activeTab === "sms" && (
        <div className="text-center py-12">
          <p className="text-text-secondary">Module SMS bientot disponible</p>
        </div>
      )}
      {activeTab === "pitch_deck" && <PitchDeckGenerator />}
      {activeTab === "sales_letter" && <SalesLetterGenerator />}
      {activeTab === "setting_script" && <SettingScriptGenerator />}
      {activeTab === "lead_magnet" && <LeadMagnetGenerator />}
      {activeTab === "history" && (
        <GenerationHistory
          table="sales_assets"
          titleField="title"
          subtitleField="asset_type"
          statusField="status"
          emptyMessage="Aucun asset genere pour le moment."
        />
      )}
    </div>
  );
}
