"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { type LucideIcon } from "lucide-react";

export interface Tab {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface TabBarProps {
  tabs: readonly Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div className={cn("flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-none", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-accent/90"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
