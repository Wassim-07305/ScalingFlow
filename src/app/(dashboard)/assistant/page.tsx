"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AIChat } from "@/components/shared/ai-chat";
import { AGENTS, type AgentType } from "@/lib/ai/agents/index";
import { cn } from "@/lib/utils/cn";
import {
  Bot,
  Target,
  PenTool,
  Megaphone,
  Phone,
  Video,
  GitBranch,
  BarChart3,
  Rocket,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot,
  Target,
  PenTool,
  Megaphone,
  Phone,
  Video,
  GitBranch,
  BarChart3,
  Rocket,
};

export default function AssistantPage() {
  const [selectedAgent, setSelectedAgent] = React.useState<AgentType>("general");

  const agent = AGENTS.find((a) => a.type === selectedAgent) || AGENTS[0];

  return (
    <div>
      <PageHeader
        title="Assistant IA"
        description="Discute avec nos agents IA spécialisés."
      />

      {/* Agent selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {AGENTS.map((a) => {
          const Icon = ICON_MAP[a.icon] || Bot;
          return (
            <button
              key={a.type}
              onClick={() => setSelectedAgent(a.type)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                selectedAgent === a.type
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Chat */}
      <AIChat
        key={selectedAgent}
        agentType={selectedAgent}
        agentName={agent.name}
      />
    </div>
  );
}
