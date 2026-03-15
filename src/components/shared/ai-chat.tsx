"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Send, Bot, User, Loader2, Plus, MessageSquare, Trash2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string;
}

function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
      const code = match?.[2]?.trim() || part.slice(3, -3).trim();
      return (
        <pre key={i} className="bg-bg-primary rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono border border-border-default">
          <code>{code}</code>
        </pre>
      );
    }

    const lines = part.split("\n");
    return lines.map((line, j) => {
      const key = `${i}-${j}`;

      if (line.startsWith("### ")) return <h4 key={key} className="font-semibold text-text-primary mt-3 mb-1">{line.slice(4)}</h4>;
      if (line.startsWith("## ")) return <h3 key={key} className="font-bold text-text-primary mt-3 mb-1">{line.slice(3)}</h3>;

      if (/^[-*] /.test(line)) {
        return <div key={key} className="flex gap-2 ml-2"><span className="text-accent">&#x2022;</span><span>{formatInline(line.slice(2))}</span></div>;
      }
      const numMatch = line.match(/^(\d+)\. /);
      if (numMatch) {
        return <div key={key} className="flex gap-2 ml-2"><span className="text-accent font-medium">{numMatch[1]}.</span><span>{formatInline(line.slice(numMatch[0].length))}</span></div>;
      }

      if (!line.trim()) return <br key={key} />;

      return <span key={key}>{formatInline(line)}{j < lines.length - 1 ? "\n" : ""}</span>;
    });
  });
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-semibold text-text-primary">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="bg-bg-primary px-1.5 py-0.5 rounded text-xs font-mono text-accent">{p.slice(1, -1)}</code>;
    return p;
  });
}

interface AIChatProps {
  agentType: string;
  agentName: string;
  conversationId?: string | null;
  initialMessages?: ChatMessage[];
  suggestedQuestions?: string[];
  onConversationSaved?: (id: string, title: string) => void;
  className?: string;
}

export function AIChat({
  agentType,
  agentName,
  conversationId: initialConversationId,
  initialMessages,
  suggestedQuestions,
  onConversationSaved,
  className,
}: AIChatProps) {
  const { user } = useUser();
  const supabase = createClient();

  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages || []);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(initialConversationId || null);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset when loading a new conversation
  useEffect(() => {
    setMessages(initialMessages || []);
    setConversationId(initialConversationId || null);
  }, [initialConversationId, initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveConversation = useCallback(
    async (msgs: ChatMessage[]) => {
      if (msgs.length < 2) return;

      // Auto-title from first user message
      const firstUserMsg = msgs.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "..." : "")
        : "Conversation";

      try {
        const res = await fetch("/api/ai/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            agentType,
            title,
            messages: msgs,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (!conversationId) {
            setConversationId(data.id);
          }
          onConversationSaved?.(data.id, title);
          loadConversations();
        }
      } catch {
        // Fail silently — conversation save is non-blocking
      }
    },
    [conversationId, agentType, onConversationSaved]
  );

  // Charger la liste des conversations existantes
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("agent_conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .eq("agent_type", agentType)
      .order("updated_at", { ascending: false })
      .limit(20);

    setConversations((data as Conversation[]) ?? []);
  }, [user, agentType, supabase]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Charger une conversation spécifique
  const loadConversation = useCallback(async (id: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("agent_conversations")
      .select("id, title, messages")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (data) {
      setConversationId(data.id);
      setMessages((data.messages as ChatMessage[]) ?? []);
      setShowHistory(false);
    }
  }, [user, supabase]);

  // Sauvegarder les messages dans la conversation (direct Supabase fallback)
  const saveMessages = useCallback(async (msgs: ChatMessage[], convId: string | null) => {
    if (!user || msgs.length === 0) return;

    const title = msgs[0].content.slice(0, 80);

    if (convId) {
      await supabase
        .from("agent_conversations")
        .update({ messages: msgs as unknown as Record<string, unknown>[], updated_at: new Date().toISOString() })
        .eq("id", convId);
    } else {
      const { data } = await supabase
        .from("agent_conversations")
        .insert({
          user_id: user.id,
          agent_type: agentType,
          title,
          messages: msgs as unknown as Record<string, unknown>[],
        })
        .select("id")
        .single();

      if (data) {
        setConversationId(data.id);
      }
    }
  }, [user, agentType, supabase]);

  // Supprimer une conversation
  const deleteConversation = async (id: string) => {
    await supabase.from("agent_conversations").delete().eq("id", id);
    if (conversationId === id) {
      setConversationId(null);
      setMessages([]);
    }
    loadConversations();
  };

  // Nouvelle conversation
  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          agentType,
          conversationId,
        }),
      });

      if (!response.ok) throw new Error("Erreur de reponse");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Pas de stream");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return updated;
        });
      }

      // Save after streaming completes
      const finalMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: assistantContent },
      ];
      setMessages(finalMessages);
      saveConversation(finalMessages);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une erreur est survenue. Réessaie.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "flex h-[calc(100vh-200px)] max-h-[700px] rounded-2xl border border-border-default/50 bg-bg-secondary/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/10 animate-in fade-in duration-500",
        className
      )}
    >
      {/* Sidebar historique */}
      {showHistory && (
        <div className="w-64 border-r border-border-default bg-bg-primary flex flex-col shrink-0">
          <div className="p-3 border-b border-border-default">
            <Button
              size="sm"
              onClick={startNewConversation}
              className="w-full gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouvelle conversation
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6 px-3">
                Aucune conversation précédente.
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-xs cursor-pointer transition-colors group",
                    conversationId === conv.id
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary"
                  )}
                >
                  <button
                    onClick={() => loadConversation(conv.id)}
                    className="flex-1 text-left truncate"
                  >
                    {conv.title || "Conversation sans titre"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header chat */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border-default">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            aria-label="Historique des conversations"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <span className="text-xs text-text-muted flex-1 truncate">
            {conversationId ? (conversations.find((c) => c.id === conversationId)?.title || agentName) : agentName}
          </span>
          <button
            onClick={startNewConversation}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            aria-label="Nouvelle conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4" aria-hidden="true">
                <Bot className="h-8 w-8 text-accent" />
              </div>
              <p className="text-text-secondary font-medium">
                {agentName}
              </p>
              <p className="text-sm text-text-muted mt-1 mb-4">
                Pose-moi une question pour commencer.
              </p>
              {suggestedQuestions && suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="text-xs px-3 py-2 rounded-xl bg-bg-tertiary text-text-secondary hover:text-accent hover:bg-accent/10 border border-border-default hover:border-accent/20 transition-all duration-200 text-left hover:shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-md shadow-accent/10"
                    : "bg-bg-tertiary text-text-primary rounded-bl-md"
                )}
              >
                <div className="whitespace-pre-wrap">
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
                {msg.role === "assistant" &&
                  msg.content === "" &&
                  isStreaming && (
                    <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                  )}
              </div>
              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                  <User className="h-4 w-4 text-text-secondary" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border-default p-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écris ton message..."
              aria-label="Entre ton message"
              rows={1}
              className="flex-1 resize-none rounded-lg bg-bg-tertiary border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              aria-label={isStreaming ? "En cours de traitement" : "Envoyer le message"}
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
