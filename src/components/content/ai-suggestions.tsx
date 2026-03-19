"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Check,
  X,
  Pencil,
  ChevronDown,
  ChevronUp,
  Film,
  Layers,
  BookImage,
  FileText,
  Youtube,
  Clock,
  Lightbulb,
  History,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface SuggestionScript {
  title?: string;
  hook?: string;
  script?: string;
  hashtags?: string[];
  best_posting_time?: string;
  duration?: string;
  chapters?: string;
}

interface ContentSuggestion {
  id: string;
  content_type: string;
  script: SuggestionScript;
  source_insight: string | null;
  angle: string | null;
  pillar: string | null;
  reasoning: string | null;
  week_of: string;
  status: "suggested" | "accepted" | "rejected" | "published";
  created_at: string;
  accepted_at: string | null;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string; badge: string }
> = {
  reel: {
    icon: Film,
    label: "Reel",
    color: "text-orange-400",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  carousel: {
    icon: Layers,
    label: "Carousel",
    color: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  story: {
    icon: BookImage,
    label: "Story",
    color: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  youtube: {
    icon: Youtube,
    label: "YouTube",
    color: "text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  post: {
    icon: FileText,
    label: "Post",
    color: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

const PILLAR_COLORS: Record<string, string> = {
  know: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  like: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  trust: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  conversion: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const ANGLE_LABELS: Record<string, string> = {
  educatif: "Éducatif",
  objection: "Objection",
  backstage: "Backstage",
  cas_client: "Cas client",
  hook_viral: "Hook viral",
};

function getMondayLabel(weekOf: string): string {
  const d = new Date(weekOf + "T00:00:00Z");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// ─── Single suggestion card ────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onAction,
}: {
  suggestion: ContentSuggestion;
  onAction: (id: string, action: "accepted" | "rejected", script?: SuggestionScript) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editScript, setEditScript] = useState(
    suggestion.script?.script ?? "",
  );
  const [editHook, setEditHook] = useState(suggestion.script?.hook ?? "");
  const [loading, setLoading] = useState<"accept" | "reject" | "save" | null>(null);
  const [copied, setCopied] = useState(false);

  const typeConfig =
    TYPE_CONFIG[suggestion.content_type] ?? TYPE_CONFIG.post;
  const Icon = typeConfig.icon;

  async function handleAction(action: "accepted" | "rejected") {
    setLoading(action === "accepted" ? "accept" : "reject");
    await onAction(suggestion.id, action);
    setLoading(null);
  }

  async function handleSaveEdit() {
    setLoading("save");
    const updatedScript: SuggestionScript = {
      ...suggestion.script,
      hook: editHook,
      script: editScript,
    };
    await onAction(suggestion.id, "accepted", updatedScript);
    setLoading(null);
    setEditing(false);
  }

  async function handleCopy() {
    const text = [
      suggestion.script?.hook && `Hook: ${suggestion.script.hook}`,
      suggestion.script?.script,
      suggestion.script?.hashtags?.join(" "),
    ]
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const preview = suggestion.script?.script?.slice(0, 200) ?? "";
  const hasMore = (suggestion.script?.script?.length ?? 0) > 200;

  return (
    <Card className="border-[#2A2F35] bg-[#141719] transition-colors hover:border-[#3A3F45]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Format badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                typeConfig.badge,
              )}
            >
              <Icon className="h-3 w-3" />
              {typeConfig.label}
            </span>
            {/* Pillar badge */}
            {suggestion.pillar && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  PILLAR_COLORS[suggestion.pillar] ?? "",
                )}
              >
                {suggestion.pillar.charAt(0).toUpperCase() +
                  suggestion.pillar.slice(1)}
              </span>
            )}
            {/* Angle badge */}
            {suggestion.angle && (
              <span className="inline-flex items-center rounded-full border border-[#2A2F35] bg-[#1C1F23] px-2.5 py-0.5 text-xs text-[#8A919A]">
                {ANGLE_LABELS[suggestion.angle] ?? suggestion.angle}
              </span>
            )}
          </div>
          {/* Posting time */}
          {suggestion.script?.best_posting_time && (
            <span className="flex items-center gap-1 text-xs text-[#8A919A] whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {suggestion.script.best_posting_time}
            </span>
          )}
        </div>

        {/* Title */}
        {suggestion.script?.title && (
          <CardTitle className="mt-1 text-sm font-semibold text-white">
            {suggestion.script.title}
          </CardTitle>
        )}

        {/* Source insight */}
        {suggestion.source_insight && (
          <CardDescription className="flex items-center gap-1.5 text-xs text-emerald-400/80 italic">
            <Lightbulb className="h-3 w-3 flex-shrink-0" />
            {suggestion.source_insight}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Hook */}
        {suggestion.script?.hook && !editing && (
          <p className="text-sm font-medium text-white/90">
            &ldquo;{suggestion.script.hook}&rdquo;
          </p>
        )}

        {/* Script preview / edit mode */}
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editHook}
              onChange={(e) => setEditHook(e.target.value)}
              placeholder="Hook (accroche)"
              className="min-h-[60px] border-[#2A2F35] bg-[#1C1F23] text-sm text-white focus:border-emerald-500"
            />
            <Textarea
              value={editScript}
              onChange={(e) => setEditScript(e.target.value)}
              placeholder="Script complet"
              className="min-h-[140px] border-[#2A2F35] bg-[#1C1F23] text-sm text-white focus:border-emerald-500"
            />
          </div>
        ) : (
          <div className="text-sm text-[#8A919A]">
            <p className="whitespace-pre-line">
              {expanded ? suggestion.script?.script : preview}
              {!expanded && hasMore && "…"}
            </p>
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-1 text-xs text-emerald-400 hover:underline"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Réduire
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Voir tout
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Hashtags */}
        {suggestion.script?.hashtags && suggestion.script.hashtags.length > 0 && !editing && (
          <p className="text-xs text-[#6A717A]">
            {suggestion.script.hashtags.join(" ")}
          </p>
        )}

        {/* Reasoning */}
        {suggestion.reasoning && !editing && (
          <p className="rounded-lg bg-[#1C1F23] px-3 py-2 text-xs text-[#8A919A] italic">
            {suggestion.reasoning}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {editing ? (
            <>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={loading === "save"}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading === "save" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Accepter & enregistrer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
                className="text-[#8A919A] hover:text-white"
              >
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => handleAction("accepted")}
                disabled={loading !== null}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading === "accept" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Accepter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                disabled={loading !== null}
                className="border-[#2A2F35] text-[#8A919A] hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction("rejected")}
                disabled={loading !== null}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {loading === "reject" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Rejeter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="ml-auto text-[#8A919A] hover:text-white"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function AISuggestions({ className }: { className?: string }) {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [history, setHistory] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHandled, setShowHandled] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content/suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      }
    } catch {
      toast.error("Impossible de charger les suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/content/suggestions?history=true");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.suggestions ?? []);
      }
    } catch {
      toast.error("Impossible de charger l'historique");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAction = useCallback(
    async (
      id: string,
      action: "accepted" | "rejected",
      script?: SuggestionScript,
    ) => {
      const body: Record<string, unknown> = { status: action };
      if (script) body.script = script;

      const res = await fetch(`/api/content/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: action, script: script ?? s.script }
              : s,
          ),
        );
        toast.success(
          action === "accepted"
            ? "Suggestion acceptée !"
            : "Suggestion rejetée",
        );
      } else {
        toast.error("Une erreur est survenue");
      }
    },
    [],
  );

  const pending = suggestions.filter((s) => s.status === "suggested");
  const handled = suggestions.filter(
    (s) => s.status === "accepted" || s.status === "rejected",
  );

  const currentWeek =
    suggestions[0]?.week_of
      ? getMondayLabel(suggestions[0].week_of)
      : null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Suggestions IA
            {pending.length > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {pending.length} nouvelle{pending.length > 1 ? "s" : ""}
              </span>
            )}
          </h2>
          {currentWeek && (
            <p className="mt-0.5 text-sm text-[#8A919A]">
              Semaine du {currentWeek}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="current">
        <TabsList className="border border-[#2A2F35] bg-[#1C1F23]">
          <TabsTrigger value="current">Cette semaine</TabsTrigger>
          <TabsTrigger
            value="history"
            onClick={() => {
              if (history.length === 0) fetchHistory();
            }}
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* ── Current week tab ── */}
        <TabsContent value="current" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#8A919A]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement des suggestions…
            </div>
          ) : pending.length === 0 && handled.length === 0 ? (
            <Card className="border-dashed border-[#2A2F35] bg-[#141719]">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Sparkles className="mb-3 h-8 w-8 text-[#3A3F45]" />
                <p className="font-medium text-[#8A919A]">
                  Aucune suggestion pour cette semaine
                </p>
                <p className="mt-1 max-w-xs text-sm text-[#6A717A]">
                  Les suggestions sont générées automatiquement chaque lundi
                  matin. Reviens lundi prochain !
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pending suggestions */}
              {pending.length > 0 && (
                <div className="space-y-3">
                  {pending.map((s) => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={s}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}

              {/* Handled suggestions (collapsible) */}
              {handled.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowHandled(!showHandled)}
                    className="flex items-center gap-2 text-sm text-[#8A919A] hover:text-white transition-colors"
                  >
                    {showHandled ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {handled.length} suggestion{handled.length > 1 ? "s" : ""}{" "}
                    traitée{handled.length > 1 ? "s" : ""}
                  </button>
                  {showHandled && (
                    <div className="mt-3 space-y-3 opacity-60">
                      {handled.map((s) => (
                        <Card
                          key={s.id}
                          className="border-[#2A2F35] bg-[#141719]"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#8A919A]">
                                  {TYPE_CONFIG[s.content_type]?.label ??
                                    s.content_type}
                                </span>
                                <Badge
                                  variant="muted"
                                  className={cn(
                                    "text-xs",
                                    s.status === "accepted"
                                      ? "border-emerald-500/30 text-emerald-400"
                                      : "border-red-500/30 text-red-400",
                                  )}
                                >
                                  {s.status === "accepted"
                                    ? "Acceptée"
                                    : "Rejetée"}
                                </Badge>
                              </div>
                            </div>
                            {s.script?.title && (
                              <p className="text-sm text-white">
                                {s.script.title}
                              </p>
                            )}
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── History tab ── */}
        <TabsContent value="history" className="mt-4">
          {historyLoading ? (
            <div className="flex items-center justify-center py-16 text-[#8A919A]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement de l&apos;historique…
            </div>
          ) : history.length === 0 ? (
            <Card className="border-dashed border-[#2A2F35] bg-[#141719]">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <History className="mb-3 h-8 w-8 text-[#3A3F45]" />
                <p className="text-sm text-[#8A919A]">
                  Pas encore d&apos;historique de suggestions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Group by week */}
              {Object.entries(
                history.reduce(
                  (acc, s) => {
                    if (!acc[s.week_of]) acc[s.week_of] = [];
                    acc[s.week_of].push(s);
                    return acc;
                  },
                  {} as Record<string, ContentSuggestion[]>,
                ),
              )
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([week, items]) => (
                  <div key={week}>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6A717A]">
                      Semaine du {getMondayLabel(week)}
                    </p>
                    <div className="space-y-2">
                      {items.map((s) => (
                        <Card
                          key={s.id}
                          className="border-[#2A2F35] bg-[#141719]"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#8A919A]">
                                {TYPE_CONFIG[s.content_type]?.label ??
                                  s.content_type}
                              </span>
                              <Badge
                                variant="muted"
                                className={cn(
                                  "text-xs",
                                  s.status === "accepted" || s.status === "published"
                                    ? "border-emerald-500/30 text-emerald-400"
                                    : "border-red-500/30 text-red-400",
                                )}
                              >
                                {s.status === "published"
                                  ? "Publié"
                                  : s.status === "accepted"
                                  ? "Accepté"
                                  : "Rejeté"}
                              </Badge>
                            </div>
                            {s.script?.title && (
                              <p className="text-sm text-white">
                                {s.script.title}
                              </p>
                            )}
                            {s.script?.hook && (
                              <p className="text-xs text-[#8A919A] italic">
                                &ldquo;{s.script.hook}&rdquo;
                              </p>
                            )}
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
