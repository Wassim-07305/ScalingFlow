"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Send,
  Loader2,
  Search,
  MessageSquare,
  Check,
  CheckCheck,
  ArrowLeft,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Conversation {
  userId: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

/* ── Skeleton loader for conversation list ── */

function ConversationListSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 border-b border-border-default/30 animate-pulse"
        >
          <div className="h-11 w-11 rounded-full bg-bg-tertiary shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded-md bg-bg-tertiary" />
              <div className="h-2.5 w-12 rounded-md bg-bg-tertiary" />
            </div>
            <div className="h-3 w-40 rounded-md bg-bg-tertiary" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Message skeleton ── */

function MessagesSkeleton() {
  return (
    <div className="space-y-4 px-5 py-4 animate-pulse">
      <div className="flex justify-start">
        <div className="h-12 w-48 rounded-2xl rounded-bl-md bg-bg-tertiary" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-56 rounded-2xl rounded-br-md bg-bg-tertiary" />
      </div>
      <div className="flex justify-start">
        <div className="h-16 w-52 rounded-2xl rounded-bl-md bg-bg-tertiary" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-40 rounded-2xl rounded-br-md bg-bg-tertiary" />
      </div>
    </div>
  );
}

export function DirectMessages() {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; full_name: string; avatar_url: string | null }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: allMessages } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!allMessages || allMessages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Grouper par conversation
    const convMap = new Map<string, { lastMsg: Message; unread: number }>();
    for (const msg of allMessages) {
      const otherUserId =
        msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, {
          lastMsg: msg,
          unread: msg.receiver_id === user.id && !msg.read ? 1 : 0,
        });
      } else {
        const existing = convMap.get(otherUserId)!;
        if (msg.receiver_id === user.id && !msg.read) {
          existing.unread++;
        }
      }
    }

    // Récupérer les profils
    const userIds = Array.from(convMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    type ProfileData = {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
    const profileMap = new Map<string, ProfileData>(
      ((profiles ?? []) as ProfileData[]).map((p) => [p.id, p])
    );

    const convList: Conversation[] = [];
    for (const [userId, { lastMsg, unread }] of convMap) {
      const profile = profileMap.get(userId);
      convList.push({
        userId,
        name: profile?.full_name || "Utilisateur",
        avatarUrl: profile?.avatar_url || null,
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.created_at,
        unreadCount: unread,
      });
    }

    convList.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );
    setConversations(convList);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription pour les nouveaux messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dm-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const newMsg = payload.new as Message;

          // Si on est dans la conversation concernée, ajouter le message
          if (selectedUserId === newMsg.sender_id) {
            setMessages((prev) => {
              // Éviter les doublons
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Marquer comme lu automatiquement
            supabase
              .from("direct_messages")
              .update({ read: true })
              .eq("id", newMsg.id);
          }

          // Mettre à jour la liste des conversations
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, selectedUserId, fetchConversations]);

  // Charger les messages d'une conversation
  const loadMessages = useCallback(
    async (otherUserId: string) => {
      if (!user) return;
      setLoadingMessages(true);

      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(data ?? []);
      setLoadingMessages(false);

      // Marquer comme lu
      await supabase
        .from("direct_messages")
        .update({ read: true })
        .eq("sender_id", otherUserId)
        .eq("receiver_id", user.id)
        .eq("read", false);

      // Mettre à jour le compteur localement
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === otherUserId ? { ...c, unreadCount: 0 } : c
        )
      );
    },
    [user, supabase]
  );

  // Scroll en bas quand les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sélectionner une conversation
  const selectConversation = (conv: Conversation) => {
    setSelectedUserId(conv.userId);
    setSelectedUserName(conv.name);
    setMobileShowChat(true);
    loadMessages(conv.userId);
  };

  // Envoyer un message
  const handleSend = async () => {
    if (!user || !selectedUserId || !newMessage.trim()) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: selectedUserId,
      content,
    });

    if (error) {
      toast.error("Erreur lors de l'envoi du message");
      setNewMessage(content);
    } else {
      // Ajouter le message localement
      const optimisticMsg: Message = {
        id: crypto.randomUUID(),
        sender_id: user.id,
        receiver_id: selectedUserId,
        content,
        read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // Mettre à jour la conversation dans la liste
      setConversations((prev) => {
        const existing = prev.find((c) => c.userId === selectedUserId);
        if (existing) {
          return prev
            .map((c) =>
              c.userId === selectedUserId
                ? {
                    ...c,
                    lastMessage: content,
                    lastMessageAt: optimisticMsg.created_at,
                  }
                : c
            )
            .sort(
              (a, b) =>
                new Date(b.lastMessageAt).getTime() -
                new Date(a.lastMessageAt).getTime()
            );
        }
        return [
          {
            userId: selectedUserId,
            name: selectedUserName,
            avatarUrl: null,
            lastMessage: content,
            lastMessageAt: optimisticMsg.created_at,
            unreadCount: 0,
          },
          ...prev,
        ];
      });
    }

    setSending(false);
  };

  // Recherche d'utilisateurs
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .ilike("full_name", `%${query}%`)
      .neq("id", user?.id ?? "")
      .limit(5);

    setSearchResults(data ?? []);
    setSearching(false);
  };

  const startConversation = (profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  }) => {
    setSelectedUserId(profile.id);
    setSelectedUserName(profile.full_name || "Utilisateur");
    setSearchQuery("");
    setSearchResults([]);
    setMobileShowChat(true);
    loadMessages(profile.id);
  };

  const handleMobileBack = () => {
    setMobileShowChat(false);
  };

  /* ── Total unread count ── */
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  /* ── Sidebar content (shared between mobile & desktop) ── */
  const renderSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            Messages
            {totalUnread > 0 && (
              <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-accent text-[11px] font-bold text-bg-primary">
                {totalUnread}
              </span>
            )}
          </h2>
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-bg-tertiary border border-border-default/50 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none transition-colors"
          />
        </div>

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <div className="mt-2 rounded-xl border border-border-default/50 bg-bg-tertiary overflow-hidden">
            {searchResults.map((profile, i) => (
              <button
                key={profile.id}
                onClick={() => startConversation(profile)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 hover:bg-accent/5 transition-all text-left",
                  i < searchResults.length - 1 &&
                    "border-b border-border-default/30"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent/10 text-accent text-xs font-medium">
                    {(profile.full_name || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-text-primary font-medium">
                  {profile.full_name}
                </span>
              </button>
            ))}
          </div>
        )}
        {searching && (
          <div className="mt-3 text-center">
            <Loader2 className="h-4 w-4 animate-spin text-text-muted mx-auto" />
          </div>
        )}
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/5 border border-accent/10 mb-4">
              <Users className="h-6 w-6 text-accent/40" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">
              Aucune conversation
            </p>
            <p className="text-xs text-text-muted max-w-[200px]">
              Recherche un membre pour démarrer une conversation.
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.userId}
              onClick={() => selectConversation(conv)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3.5 transition-all text-left border-b border-border-default/30",
                selectedUserId === conv.userId
                  ? "bg-accent/5 border-l-2 border-l-accent"
                  : "hover:bg-bg-tertiary/50"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-11 w-11">
                  <AvatarFallback
                    className={cn(
                      "text-sm font-medium",
                      selectedUserId === conv.userId
                        ? "bg-accent/15 text-accent"
                        : "bg-bg-tertiary text-text-secondary"
                    )}
                  >
                    {conv.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-accent text-bg-primary text-[10px] font-bold flex items-center justify-center ring-2 ring-bg-secondary">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm truncate",
                      conv.unreadCount > 0
                        ? "font-semibold text-text-primary"
                        : "font-medium text-text-primary"
                    )}
                  >
                    {conv.name}
                  </span>
                  <span className="text-[10px] text-text-muted shrink-0">
                    {formatDistanceToNow(new Date(conv.lastMessageAt), {
                      addSuffix: false,
                      locale: fr,
                    })}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-xs truncate mt-0.5",
                    conv.unreadCount > 0
                      ? "text-text-secondary font-medium"
                      : "text-text-muted"
                  )}
                >
                  {conv.lastMessage}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  /* ── Chat panel content ── */
  const renderChatPanel = () => (
    <div className="flex-1 flex flex-col h-full">
      {!selectedUserId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/5 border border-accent/10 mb-5">
            <MessageSquare className="h-7 w-7 text-accent/30" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">
            Sélectionne une conversation
          </p>
          <p className="text-xs text-text-muted max-w-[240px]">
            Choisis un contact dans la liste ou recherche un membre pour
            commencer à discuter.
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-default/50 bg-bg-secondary/50 backdrop-blur-sm">
            {/* Mobile back button */}
            <button
              onClick={handleMobileBack}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-accent/10 text-accent text-xs font-medium">
                {selectedUserName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-semibold text-text-primary block">
                {selectedUserName}
              </span>
              <span className="text-[11px] text-text-muted">En ligne</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loadingMessages ? (
              <MessagesSkeleton />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/5 mb-3">
                  <Send className="h-5 w-5 text-accent/30" />
                </div>
                <p className="text-sm text-text-muted">
                  Aucun message. Envoie le premier !
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      isMine ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 transition-all",
                        isMine
                          ? "bg-accent text-white rounded-br-md"
                          : "bg-bg-tertiary text-text-primary rounded-bl-md border border-border-default/30"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1",
                          isMine ? "justify-end" : "justify-start"
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px]",
                            isMine ? "text-white/50" : "text-text-muted"
                          )}
                        >
                          {new Date(msg.created_at).toLocaleTimeString(
                            "fr-FR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {isMine &&
                          (msg.read ? (
                            <CheckCheck className="h-3 w-3 text-white/50" />
                          ) : (
                            <Check className="h-3 w-3 text-white/50" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Écris ton message..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border-default/50 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none transition-colors"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="rounded-xl h-10 w-10 shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Card className="overflow-hidden p-0">
      {/* Desktop layout: side-by-side */}
      <div className="hidden md:flex h-[560px]">
        {/* Sidebar */}
        <div className="w-80 border-r border-border-default/50 shrink-0">
          {renderSidebar()}
        </div>
        {/* Chat panel */}
        {renderChatPanel()}
      </div>

      {/* Mobile layout: stacked with slide */}
      <div className="md:hidden h-[calc(100dvh-200px)] min-h-[400px]">
        {!mobileShowChat ? (
          renderSidebar()
        ) : (
          renderChatPanel()
        )}
      </div>
    </Card>
  );
}
