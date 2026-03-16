"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  MessageCircle,
  Send,
  Search,
  Loader2,
  RefreshCw,
  Inbox,
  ArrowLeft,
  Linkedin,
  Instagram,
  MessageSquare,
  Phone,
  Twitter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

interface UnipileAccount {
  id: string;
  provider: string;
  name?: string;
  username?: string;
  connected_at?: string;
}

interface ChatParticipant {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Chat {
  id: string;
  account_id: string;
  provider: string;
  participants: ChatParticipant[];
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  text: string;
  sender_id: string;
  sender_name: string;
  is_me: boolean;
  created_at: string;
}

// ─── Provider config ──────────────────────────────────────────

const PROVIDER_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    badgeVariant: "blue" | "cyan" | "default";
  }
> = {
  LINKEDIN: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-400",
    badgeVariant: "blue",
  },
  WHATSAPP: {
    label: "WhatsApp",
    icon: Phone,
    color: "text-green-400",
    badgeVariant: "cyan",
  },
  INSTAGRAM: {
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-400",
    badgeVariant: "default",
  },
  MESSENGER: {
    label: "Messenger",
    icon: MessageSquare,
    color: "text-blue-300",
    badgeVariant: "blue",
  },
  TELEGRAM: {
    label: "Telegram",
    icon: Send,
    color: "text-cyan-400",
    badgeVariant: "cyan",
  },
  TWITTER: {
    label: "Twitter/X",
    icon: Twitter,
    color: "text-sky-400",
    badgeVariant: "default",
  },
};

function getProviderInfo(provider: string) {
  return (
    PROVIDER_CONFIG[provider.toUpperCase()] || {
      label: provider,
      icon: MessageCircle,
      color: "text-text-muted",
      badgeVariant: "default" as const,
    }
  );
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Component ────────────────────────────────────────────────

export function UnifiedInbox() {
  const [accounts, setAccounts] = useState<UnipileAccount[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch accounts ──────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/unipile/accounts");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      // silent
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // ── Fetch chats ─────────────────────────────────────────────

  const fetchChats = useCallback(async () => {
    if (accounts.length === 0) {
      setChats([]);
      return;
    }
    setLoadingChats(true);
    try {
      const allChats: Chat[] = [];
      for (const account of accounts) {
        const res = await fetch(
          `/api/integrations/unipile/messages?account_id=${account.id}`,
        );
        if (!res.ok) continue;
        const data = await res.json();
        const accountChats = (data.chats || []).map((c: Chat) => ({
          ...c,
          account_id: account.id,
          provider: account.provider,
        }));
        allChats.push(...accountChats);
      }
      // Sort by latest message
      allChats.sort((a, b) => {
        const dateA = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0;
        const dateB = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0;
        return dateB - dateA;
      });
      setChats(allChats);
    } catch {
      toast.error("Erreur lors du chargement des conversations");
    } finally {
      setLoadingChats(false);
    }
  }, [accounts]);

  // ── Fetch messages for a chat ───────────────────────────────

  const fetchMessages = useCallback(async (chat: Chat) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/integrations/unipile/messages?account_id=${chat.account_id}&chat_id=${chat.id}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast.error("Erreur lors du chargement des messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ── Send message ────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;
    setSendingMessage(true);
    try {
      const res = await fetch("/api/integrations/unipile/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selectedChat.account_id,
          chat_id: selectedChat.id,
          text: messageText.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setMessageText("");
      // Refresh messages
      await fetchMessages(selectedChat);
      toast.success("Message envoyé");
    } catch {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSendingMessage(false);
    }
  };

  // ── Effects ─────────────────────────────────────────────────

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchChats();
    }
  }, [accounts, fetchChats]);

  // Polling every 30s
  useEffect(() => {
    if (accounts.length === 0) return;
    pollRef.current = setInterval(() => {
      fetchChats();
      if (selectedChat) fetchMessages(selectedChat);
    }, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [accounts, selectedChat, fetchChats, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Select chat ─────────────────────────────────────────────

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat);
  };

  // ── Filtered chats ──────────────────────────────────────────

  const filteredChats = chats.filter((chat) => {
    const matchesProvider =
      filterProvider === "all" ||
      chat.provider.toUpperCase() === filterProvider;
    const matchesSearch =
      !searchQuery ||
      chat.participants.some((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      (chat.last_message || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  // ── No accounts state ──────────────────────────────────────

  if (!loadingAccounts && accounts.length === 0) {
    return (
      <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
            <MessageCircle className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            Aucun compte connecté
          </h3>
          <p className="text-sm text-text-secondary max-w-md mb-6 leading-relaxed">
            Connecte tes comptes de messagerie depuis les paramètres pour
            accéder à ta messagerie unifiée.
          </p>
          <Button asChild className="rounded-xl">
            <a href="/settings">Aller dans les paramètres</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-280px)] min-h-[500px] animate-in fade-in duration-500">
      {/* ── Left panel: Conversations list ── */}
      <Card
        className={cn(
          "flex flex-col overflow-hidden border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm",
          selectedChat && "hidden lg:flex",
        )}
      >
        {/* Top bar: search + filter */}
        <div className="p-3 border-b border-border-default space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-bg-tertiary"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilterProvider("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                filterProvider === "all"
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
              )}
            >
              Tous
            </button>
            {Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => {
              const hasAccount = accounts.some(
                (a) => a.provider.toUpperCase() === key,
              );
              if (!hasAccount) return null;
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setFilterProvider(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    filterProvider === key
                      ? "bg-accent text-white"
                      : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats && chats.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-12 w-12 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-text-muted" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Aucune conversation
              </p>
              <p className="text-xs text-text-muted">
                Les conversations apparaîtront ici.
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const providerInfo = getProviderInfo(chat.provider);
              const ProviderIcon = providerInfo.icon;
              const mainParticipant = chat.participants[0];
              const isSelected = selectedChat?.id === chat.id;

              return (
                <button
                  key={`${chat.account_id}-${chat.id}`}
                  onClick={() => handleSelectChat(chat)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 text-left transition-colors border-b border-border-default",
                    isSelected ? "bg-accent/10" : "hover:bg-white/[0.03]",
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-semibold text-text-primary">
                      {mainParticipant?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-bg-secondary flex items-center justify-center",
                      )}
                    >
                      <ProviderIcon
                        className={cn("h-2.5 w-2.5", providerInfo.color)}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {mainParticipant?.name || "Inconnu"}
                      </span>
                      <span className="text-[11px] text-text-muted shrink-0">
                        {formatRelativeTime(chat.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {chat.last_message || "Pas de message"}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {chat.unread_count && chat.unread_count > 0 && (
                    <span className="shrink-0 mt-1 h-5 min-w-[20px] rounded-full bg-accent text-white text-[11px] font-semibold flex items-center justify-center px-1.5">
                      {chat.unread_count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Refresh button */}
        <div className="p-2 border-t border-border-default">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-text-muted"
            onClick={() => fetchChats()}
            disabled={loadingChats}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 mr-2", loadingChats && "animate-spin")}
            />
            Rafraîchir
          </Button>
        </div>
      </Card>

      {/* ── Right panel: Message thread ── */}
      <Card
        className={cn(
          "flex flex-col overflow-hidden border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm",
          !selectedChat && "hidden lg:flex",
        )}
      >
        {!selectedChat ? (
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <MessageCircle className="h-12 w-12 text-text-muted mb-4" />
            <p className="text-sm text-text-muted">
              Sélectionne une conversation pour voir les messages
            </p>
          </CardContent>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-3 border-b border-border-default">
              <button
                onClick={() => setSelectedChat(null)}
                className="lg:hidden p-1 rounded-lg hover:bg-bg-tertiary"
              >
                <ArrowLeft className="h-5 w-5 text-text-secondary" />
              </button>
              <div className="h-9 w-9 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-semibold text-text-primary">
                {selectedChat.participants[0]?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {selectedChat.participants[0]?.name || "Inconnu"}
                </p>
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const info = getProviderInfo(selectedChat.provider);
                    const Icon = info.icon;
                    return (
                      <>
                        <Icon className={cn("h-3 w-3", info.color)} />
                        <span className="text-xs text-text-muted">
                          {info.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchMessages(selectedChat)}
                disabled={loadingMessages}
              >
                <RefreshCw
                  className={cn(
                    "h-3.5 w-3.5",
                    loadingMessages && "animate-spin",
                  )}
                />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-text-muted">Aucun message</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.is_me ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        msg.is_me
                          ? "bg-accent text-white rounded-br-md"
                          : "bg-bg-tertiary text-text-primary rounded-bl-md",
                      )}
                    >
                      {!msg.is_me && (
                        <p className="text-[11px] font-medium text-text-muted mb-1">
                          {msg.sender_name}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          msg.is_me ? "text-white/60" : "text-text-muted",
                        )}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send input */}
            <div className="p-3 border-t border-border-default">
              <div className="flex gap-2">
                <Input
                  placeholder="Écrire un message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="bg-bg-tertiary"
                  disabled={sendingMessage}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className="shrink-0"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
