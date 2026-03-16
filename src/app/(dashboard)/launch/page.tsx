"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils/cn";
import { Code2, ClipboardCheck, CalendarDays } from "lucide-react";
import { PixelCAPIGenerator } from "@/components/launch/pixel-capi-generator";
import { PreLaunchChecklist } from "@/components/launch/pre-launch-checklist";
import { TenDayGuide } from "@/components/launch/ten-day-guide";

type TabKey = "checklist" | "pixel" | "guide";

export default function LaunchGuidePage() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("checklist");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "checklist",
      label: "Checklist Pré-lancement",
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      key: "pixel",
      label: "Pixel & CAPI",
      icon: <Code2 className="h-4 w-4" />,
    },
    {
      key: "guide",
      label: "Guide 10 Jours",
      icon: <CalendarDays className="h-4 w-4" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Guide de Lancement"
        description="Prépare, vérifie et lance tes premières campagnes publicitaires."
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "checklist" && <PreLaunchChecklist />}
      {activeTab === "pixel" && <PixelCAPIGenerator />}
      {activeTab === "guide" && <TenDayGuide />}
    </div>
  );
}
