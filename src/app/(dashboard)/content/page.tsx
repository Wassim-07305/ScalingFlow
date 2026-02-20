"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PostGenerator } from "@/components/content/post-generator";
import { ContentCalendar } from "@/components/content/content-calendar";
import { cn } from "@/lib/utils/cn";
import { PenTool, Calendar } from "lucide-react";

const TABS = [
  { key: "generator", label: "Générateur", icon: PenTool },
  { key: "calendar", label: "Calendrier", icon: Calendar },
] as const;

export default function ContentPage() {
  const [activeTab, setActiveTab] = React.useState<string>("generator");

  return (
    <div>
      <PageHeader
        title="Contenu"
        description="Génère du contenu pour tes réseaux sociaux."
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

      {activeTab === "generator" && <PostGenerator />}
      {activeTab === "calendar" && <ContentCalendar />}
    </div>
  );
}
