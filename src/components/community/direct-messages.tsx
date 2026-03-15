"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Search, MessageSquare, Check, CheckCheck } from "lucide-react";
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
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string; avatar_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
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
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
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

    type ProfileData = { id: string; full_name: string | null; avatar_url: string | null };
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

    convList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
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
  const loadMessages = useCallback(async (otherUserId: string) => {
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
      prev.map((c) => (c.userId === otherUserId ? { ...c, unreadCount: 0 } : c))
    );
  }, [user, supabase]);

  // Scroll en bas quand les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sélectionner une conversation
  const selectConversation = (conv: Conversation) => {
    setSelectedUserId(conv.userId);
    setSelectedUserName(conv.name);
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
                ? { ...c, lastMessage: content, lastMessageAt: optimisticMsg.created_at }
                : c
            )
            .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
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

  const startConversation = (profile: { id: string; full_name: string; avatar_url: string | null }) => {
    setSelectedUserId(profile.id);
    setSelectedUserName(profile.full_name || "Utilisateur");
    setSearchQuery("");
    setSearchResults([]);
    loadMessages(profile.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex h-[500px]">
        {/* Sidebar — Liste des conversations */}
        <div className="w-80 border-r border-border-default flex flex-col shrink-0">
          {/* Recherche */}
          <div className="p-3 border-b border-border-default">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Rechercher un membre..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg-tertiary border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => startConversation(profile)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent/10 text-accent text-xs">
                        {(profile.full_name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-text-primary">{profile.full_name}</span>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <div className="mt-2 text-center">
                <Loader2 className="h-4 w-4 animate-spin text-text-muted mx-auto" />
              </div>
            )}
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="h-8 w-8 text-text-muted/30 mb-3" />
                <p className="text-sm text-text-muted">
                  Aucune conversation pour le moment.
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Recherche un membre pour démarrer.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => selectConversation(conv)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 transition-colors text-left border-b border-border-default/50",
                    selectedUserId === conv.userId
                      ? "bg-accent/5"
                      : "hover:bg-bg-tertiary"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-accent/10 text-accent text-sm">
                        {conv.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {conv.name}
                      </span>
                      <span className="text-[10px] text-text-muted shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), {
                          addSuffix: false,
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel — Messages */}
        <div className="flex-1 flex flex-col">
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <MessageSquare className="h-12 w-12 text-text-muted/20 mb-4" />
              <p className="text-text-muted text-sm">
                Sélectionne une conversation ou recherche un membre pour commencer.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent/10 text-accent text-xs">
                    {selectedUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-text-primary">
                  {selectedUserName}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
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
                            "max-w-[70%] rounded-2xl px-4 py-2.5",
                            isMine
                              ? "bg-accent text-white rounded-br-md"
                              : "bg-bg-tertiary text-text-primary rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
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
                                isMine ? "text-white/60" : "text-text-muted"
                              )}
                            >
                              {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMine && (
                              msg.read ? (
                                <CheckCheck className="h-3 w-3 text-white/60" />
                              ) : (
                                <Check className="h-3 w-3 text-white/60" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border-default">
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
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
      </div>
    </Card>
  );
}
