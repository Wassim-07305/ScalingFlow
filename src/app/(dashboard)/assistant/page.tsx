"use client";

import React, { useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AIChat } from "@/components/shared/ai-chat";
import { AGENTS, type AgentType } from "@/lib/ai/agents/index";
import { cn } from "@/lib/utils/cn";
import {
  Bot,
  Target,
  Megaphone,
  Phone,
  Video,
  GitBranch,
  Search,
  Gift,
  Plus,
  MessageSquare,
  Trash2,
  Clock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot,
  Target,
  Megaphone,
  Phone,
  Video,
  GitBranch,
  Search,
  Gift,
};

const AGENT_COLORS: Record<AgentType, string> = {
  general: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  offre: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  funnel: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  ads: "from-pink-500/20 to-pink-500/5 border-pink-500/30",
  vente: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
  contenu: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
  strategie: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
  recherche: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30",
};

const AGENT_ICON_COLORS: Record<AgentType, string> = {
  general: "text-emerald-400",
  offre: "text-amber-400",
  funnel: "text-blue-400",
  ads: "text-pink-400",
  vente: "text-orange-400",
  contenu: "text-purple-400",
  strategie: "text-cyan-400",
  recherche: "text-indigo-400",
};

const AGENT_BADGE_COLORS: Record<AgentType, string> = {
  general: "bg-emerald-500/15 text-emerald-400",
  offre: "bg-amber-500/15 text-amber-400",
  funnel: "bg-blue-500/15 text-blue-400",
  ads: "bg-pink-500/15 text-pink-400",
  vente: "bg-orange-500/15 text-orange-400",
  contenu: "bg-purple-500/15 text-purple-400",
  strategie: "bg-cyan-500/15 text-cyan-400",
  recherche: "bg-indigo-500/15 text-indigo-400",
};

interface ConversationItem {
  id: string;
  agent_type: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantPage() {
  const [selectedAgent, setSelectedAgent] = React.useState<AgentType | null>(
    null,
  );
  const [conversations, setConversations] = React.useState<ConversationItem[]>(
    [],
  );
  const [activeConversationId, setActiveConversationId] = React.useState<
    string | null
  >(null);
  const [activeMessages, setActiveMessages] = React.useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);

  const agent = selectedAgent
    ? AGENTS.find((a) => a.type === selectedAgent) || AGENTS[0]
    : null;

  // Load conversation list for selected agent
  const loadConversations = useCallback(async () => {
    if (!selectedAgent) return;
    try {
      const res = await fetch(
        `/api/ai/conversations?agentType=${selectedAgent}`,
      );
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // Fail silently
    }
  }, [selectedAgent]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load conversation messages
  const openConversation = async (conv: ConversationItem) => {
    setLoadingHistory(true);
    setActiveConversationId(conv.id);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("agent_conversations")
        .select("messages")
        .eq("id", conv.id)
        .single();

      if (data?.messages) {
        setActiveMessages(data.messages as ChatMessage[]);
      }
    } catch {
      setActiveMessages([]);
    }
    setLoadingHistory(false);
  };

  const deleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/conversations?id=${convId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConversationId === convId) {
          startNewConversation();
        }
      }
    } catch {
      // Fail silently
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setActiveMessages([]);
  };

  const handleSelectAgent = (agentType: AgentType) => {
    setSelectedAgent(agentType);
    startNewConversation();
  };

  const handleBackToSelector = () => {
    setSelectedAgent(null);
    setConversations([]);
    startNewConversation();
  };

  const handleConversationSaved = (id: string, title: string) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        return prev.map((c) =>
          c.id === id
            ? { ...c, title, updated_at: new Date().toISOString() }
            : c,
        );
      }
      return [
        {
          id,
          agent_type: selectedAgent || "general",
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin}min`;
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffD < 7) return `Il y a ${diffD}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // ─── Agent Selector Grid ──────────────────────────────────
  if (!selectedAgent) {
    return (
      <div>
        <PageHeader
          title="Assistants IA"
          description="Choisis un agent spécialisé pour t'accompagner dans ta problématique."
        />

        {/* Agent cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AGENTS.map((a) => {
            const Icon = ICON_MAP[a.icon] || Bot;
            const colorClass = AGENT_COLORS[a.type];
            const iconColor = AGENT_ICON_COLORS[a.type];

            return (
              <button
                key={a.type}
                onClick={() => handleSelectAgent(a.type)}
                className={cn(
                  "group relative flex flex-col items-start gap-3 p-5 rounded-xl border bg-gradient-to-br transition-all duration-200",
                  "hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20",
                  colorClass,
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-lg bg-bg-primary/60 backdrop-blur-sm",
                    iconColor,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Name & description */}
                <div className="text-left">
                  <h3 className="font-semibold text-text-primary text-sm mb-1">
                    {a.name}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {a.description}
                  </p>
                </div>

                {/* Suggested questions preview */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {a.suggestedQuestions.slice(0, 2).map((q, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-bg-primary/50 text-text-muted truncate max-w-full"
                    >
                      {q}
                    </span>
                  ))}
                </div>

                {/* Hover arrow */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className={cn("h-4 w-4", iconColor)} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Chat View with Selected Agent ─────────────────────────
  return (
    <div>
      <PageHeader
        title="Assistant IA"
        description="Discute avec tes agents IA spécialisés."
      />

      {/* Agent selector bar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Back button */}
        <button
          onClick={handleBackToSelector}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Agents
        </button>

        {/* Scrollable agent tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {AGENTS.map((a) => {
            const Icon = ICON_MAP[a.icon] || Bot;
            const isSelected = selectedAgent === a.type;
            const badgeColor = AGENT_BADGE_COLORS[a.type];

            return (
              <button
                key={a.type}
                onClick={() => handleSelectAgent(a.type)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                  isSelected
                    ? cn("text-white", badgeColor, "ring-1 ring-current/30")
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {a.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile toggle for conversation history */}
      <div className="flex lg:hidden mb-4">
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Historique ({conversations.length})
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden mb-4 rounded-xl border border-border-default bg-bg-secondary overflow-hidden max-h-[300px] flex flex-col">
          <div className="p-3 border-b border-border-default">
            <button
              onClick={() => {
                startNewConversation();
                setShowMobileSidebar(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouvelle conversation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Aucune conversation.
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    openConversation(conv);
                    setShowMobileSidebar(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    activeConversationId === conv.id
                      ? "bg-accent/15 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary",
                  )}
                >
                  <p className="font-medium truncate text-xs">
                    {conv.title || "Sans titre"}
                  </p>
                  <span className="text-[10px] text-text-muted">
                    {formatDate(conv.updated_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main layout: sidebar + chat */}
      <div className="flex gap-4">
        {/* Conversation history sidebar */}
        <div className="w-64 shrink-0 hidden lg:flex flex-col rounded-xl border border-border-default bg-bg-secondary overflow-hidden h-[calc(100vh-200px)] max-h-[700px]">
          {/* New conversation button */}
          <div className="p-3 border-b border-border-default">
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouvelle conversation
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                <MessageSquare className="h-8 w-8 text-text-muted mb-2" />
                <p className="text-xs text-text-muted">
                  Aucune conversation avec cet agent.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group",
                    activeConversationId === conv.id
                      ? "bg-accent/15 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-medium truncate text-xs leading-5">
                      {conv.title || "Sans titre"}
                    </p>
                    <button
                      onClick={(e) => deleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="h-3 w-3 text-text-muted hover:text-red-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-text-muted" />
                    <span className="text-[10px] text-text-muted">
                      {formatDate(conv.updated_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 min-w-0">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-[calc(100vh-200px)] max-h-[700px] rounded-xl border border-border-default bg-bg-secondary">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-text-muted">Chargement...</p>
              </div>
            </div>
          ) : (
            <AIChat
              key={`${selectedAgent}-${activeConversationId || "new"}`}
              agentType={selectedAgent}
              agentName={agent?.name || "Assistant"}
              conversationId={activeConversationId}
              initialMessages={activeMessages}
              suggestedQuestions={agent?.suggestedQuestions}
              onConversationSaved={handleConversationSaved}
            />
          )}
        </div>
      </div>
    </div>
  );
}
