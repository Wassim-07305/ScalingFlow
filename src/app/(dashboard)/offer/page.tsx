"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { OfferGenerator } from "@/components/offer/offer-generator";
import { GenerationHistory } from "@/components/shared/generation-history";
import { cn } from "@/lib/utils/cn";
import { Sparkles, History } from "lucide-react";

const TABS = [
  { key: "generate", label: "Générer", icon: Sparkles },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function OfferPage() {
  const [activeTab, setActiveTab] = React.useState<string>("generate");

  return (
    <div>
      <PageHeader
        title="Création d'Offre"
        description="Génère ton offre irrésistible avec l'IA."
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

      {activeTab === "generate" && <OfferGenerator />}
      {activeTab === "history" && (
        <GenerationHistory
          table="offers"
          titleField="offer_name"
          subtitleField="positioning"
          statusField="status"
          emptyMessage="Aucune offre générée pour le moment."
        />
      )}
    </div>
  );
}
