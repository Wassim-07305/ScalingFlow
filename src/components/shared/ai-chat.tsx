"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
  onConversationSaved?: (id: string, title: string) => void;
  className?: string;
}

export function AIChat({
  agentType,
  agentName,
  conversationId: initialConversationId,
  initialMessages,
  onConversationSaved,
  className,
}: AIChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages || []);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(initialConversationId || null);
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
        ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
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
        }
      } catch {
        // Fail silently — conversation save is non-blocking
      }
    },
    [conversationId, agentType, onConversationSaved]
  );

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

      if (!response.ok) throw new Error("Erreur de réponse");

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
        "flex flex-col h-[calc(100vh-200px)] max-h-[700px] rounded-xl border border-border-default bg-bg-secondary",
        className
      )}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-text-muted mb-3" />
            <p className="text-text-secondary font-medium">
              {agentName}
            </p>
            <p className="text-sm text-text-muted mt-1">
              Pose-moi une question pour commencer.
            </p>
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
              <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-text-primary"
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
              <div className="h-7 w-7 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0 mt-0.5">
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
            rows={1}
            className="flex-1 resize-none rounded-lg bg-bg-tertiary border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
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
  );
}
