"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { VSLGenerator } from "@/components/assets/vsl-generator";
import { EmailSequence } from "@/components/assets/email-sequence";
import { GenerationHistory } from "@/components/shared/generation-history";
import { cn } from "@/lib/utils/cn";
import { Video, Mail, MessageSquare, History } from "lucide-react";

const TABS = [
  { key: "vsl", label: "Script VSL", icon: Video },
  { key: "email", label: "Séquence Email", icon: Mail },
  { key: "sms", label: "Séquence SMS", icon: MessageSquare },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function AssetsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("vsl");

  return (
    <div>
      <PageHeader
        title="Sales Assets"
        description="Génère tes scripts VSL, emails et SMS avec l'IA."
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

      {activeTab === "vsl" && <VSLGenerator />}
      {activeTab === "email" && <EmailSequence />}
      {activeTab === "sms" && (
        <div className="text-center py-12">
          <p className="text-text-secondary">Module SMS bientôt disponible</p>
        </div>
      )}
      {activeTab === "history" && (
        <GenerationHistory
          table="sales_assets"
          titleField="title"
          subtitleField="asset_type"
          statusField="status"
          emptyMessage="Aucun asset généré pour le moment."
        />
      )}
    </div>
  );
}
