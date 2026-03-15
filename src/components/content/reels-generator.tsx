"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Copy, ChevronDown, ChevronUp, Clock, Pencil, Check, Film, Send, Save, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ReelsScriptsResult } from "@/lib/ai/prompts/reels-scripts";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { UnipilePublishDialog } from "@/components/shared/unipile-publish-dialog";
import { GenerateButton } from "@/components/shared/generate-button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

const HOOK_STYLES = [
  { key: "curiosite", label: "Curiosité" },
  { key: "controverse", label: "Controversé" },
  { key: "benefice", label: "Bénéfice direct" },
  { key: "storytelling", label: "Storytelling" },
  { key: "choc", label: "Choc / Surprise" },
] as const;

interface ReelsGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const PILIER_BADGE: Record<string, "default" | "blue" | "cyan" | "purple" | "yellow"> = {
  know: "blue",
  like: "purple",
  trust: "default",
  convert: "yellow",
};

export function ReelsGenerator({ className, initialData }: ReelsGeneratorProps) {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(false);
  const [scripts, setScripts] = React.useState<ReelsScriptsResult["scripts"]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [batchNumber, setBatchNumber] = React.useState(1);
  const [expandedScript, setExpandedScript] = React.useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishContent, setPublishContent] = React.useState("");
  const [savedIds, setSavedIds] = React.useState<string[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [hookStyle, setHookStyle] = React.useState("curiosite");
  const [reelsTopic, setReelsTopic] = React.useState("");
  const [showForm, setShowForm] = React.useState(true);

  React.useEffect(() => {
    if (initialData) {
      const result = initialData as ReelsScriptsResult;
      setScripts(result.scripts || []);
      setShowForm(false);
    }
  }, [initialData]);

  const handleGenerate = async (batch?: number) => {
    setLoading(true);
    setError(null);
    const currentBatch = batch || batchNumber;

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "reels",
          batchNumber: currentBatch,
          hookStyle,
          topic: reelsTopic || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      const result = data.result as ReelsScriptsResult;
      const generatedScripts = result.scripts || [];
      setScripts(generatedScripts);
      setShowForm(false);
      setIsDirty(false);
      // Fetch the IDs of the recently saved content_pieces
      if (generatedScripts.length > 0) {
        try {
          const supabase = createClient();
          const { data: pieces } = await supabase
            .from("content_pieces")
            .select("id")
            .eq("content_type", "instagram_reel")
            .order("created_at", { ascending: false })
            .limit(generatedScripts.length);
          if (pieces) {
            // Reverse to match generation order (oldest first = index 0)
            setSavedIds(pieces.reverse().map((p: { id: string }) => p.id));
          }
        } catch { /* non-blocking */ }
      }
      toast.success(`${generatedScripts.length} scripts Reels générés !`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNextBatch = () => {
    const next = batchNumber + 1;
    setBatchNumber(next);
    handleGenerate(next);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Copié !");
  };

  const updateScript = (index: number, field: string, value: string) => {
    setScripts((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
    setIsDirty(true);
  };

  const handleSaveEdits = async () => {
    if (!user || savedIds.length === 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      let hasError = false;
      for (let i = 0; i < scripts.length; i++) {
        const id = savedIds[i];
        if (!id) continue;
        const s = scripts[i];
        const { error } = await supabase
          .from("content_pieces")
          .update({
            hook: s.hook,
            content: s.corps,
            hashtags: s.hashtags,
          })
          .eq("id", id)
          .eq("user_id", user.id);
        if (error) hasError = true;
      }
      if (hasError) {
        toast.error("Erreur lors de la sauvegarde");
      } else {
        toast.success("Modifications sauvegardées");
        setIsDirty(false);
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading variant="immersive" text="Génération des scripts Reels" className={className} />;
  }

  if (scripts.length === 0 || showForm) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-accent" />
              Paramètres Reels / Shorts
            </CardTitle>
            <CardDescription>
              Configure le style de hooks et le thème pour tes scripts vidéo courts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Hook style */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Style de hook</label>
              <div className="flex flex-wrap gap-2">
                {HOOK_STYLES.map((h) => (
                  <button
                    key={h.key}
                    onClick={() => setHookStyle(h.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      hookStyle === h.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Thème principal <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={reelsTopic}
                onChange={(e) => setReelsTopic(e.target.value)}
                placeholder="Ex: productivité, revenus passifs, erreurs débutants..."
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <GenerateButton onClick={() => handleGenerate()} className="w-full" icon={<Film className="h-4 w-4 mr-2" />}>
              Générer 12 scripts Reels
            </GenerateButton>
            <p className="text-xs text-text-muted text-center">
              Scripts optimisés pour Instagram Reels, TikTok et YouTube Shorts
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Badge variant="default">{scripts.length} scripts (batch #{batchNumber})</Badge>
        <div className="flex items-center gap-2">
          {isDirty && savedIds.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveEdits}
              disabled={saving}
              className="bg-gradient-to-r from-accent to-emerald-400 hover:from-accent/90 hover:to-emerald-400/90 text-white shadow-md shadow-accent/20"
            >
              {saving ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Sauvegarde...</>
              ) : (
                <><Save className="h-3 w-3 mr-1" /> Sauvegarder</>
              )}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            Nouveau brief
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextBatch}>
            <Sparkles className="h-3 w-3 mr-1" />
            Nouveau batch
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scripts.map((script, i) => {
          const isExpanded = expandedScript === i;
          const isEditing = editingIndex === i;
          return (
            <GlowCard key={i} glowColor={i % 2 === 0 ? "orange" : "blue"}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={PILIER_BADGE[script.pilier]}>{script.pilier}</Badge>
                  <div className="flex items-center gap-1 text-text-muted">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{script.duree_estimee}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        setEditingIndex(null);
                        toast.success("Modifications sauvegardées");
                      } else {
                        setEditingIndex(i);
                        setExpandedScript(i);
                      }
                    }}
                  >
                    {isEditing ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Pencil className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `Hook: ${script.hook}\n\n${script.corps}\n\nCTA: ${script.cta}\n\n${script.hashtags.join(" ")}`,
                        i
                      )
                    }
                    className={cn(copiedIndex === i && "text-accent")}
                  >
                    {copiedIndex === i ? (
                      <><Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" /> Copié !</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" /> Copier</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Publier via Unipile"
                    onClick={() => {
                      setPublishContent(`Hook: ${script.hook}\n\n${script.corps}\n\nCTA: ${script.cta}\n\n${script.hashtags.join(" ")}`);
                      setPublishDialogOpen(true);
                    }}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Numéro + angle */}
              <p className="text-xs text-text-muted mb-2">
                #{script.numero} - {script.angle}
              </p>

              {/* Hook */}
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-0.5">Hook</p>
                {isEditing ? (
                  <textarea
                    value={script.hook}
                    onChange={(e) => updateScript(i, "hook", e.target.value)}
                    className="w-full rounded-lg border border-accent/30 bg-bg-secondary px-2 py-1.5 text-sm font-medium text-accent resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm font-medium text-accent">{script.hook}</p>
                )}
              </div>

              {/* Corps (expandable) */}
              <button
                className="w-full text-left"
                onClick={() => setExpandedScript(isExpanded ? null : i)}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-text-muted">Script</p>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-text-muted" />
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={script.corps}
                    onChange={(e) => updateScript(i, "corps", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded-lg border border-border-default bg-bg-secondary px-2 py-1.5 text-sm text-text-secondary resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                    rows={6}
                  />
                ) : (
                  <p
                    className={cn(
                      "text-sm text-text-secondary whitespace-pre-wrap",
                      !isExpanded && "line-clamp-3"
                    )}
                  >
                    {script.corps}
                  </p>
                )}
              </button>

              {/* CTA */}
              <div className="mt-3 p-2 rounded-lg bg-accent/10 border border-accent/20">
                {isEditing ? (
                  <input
                    type="text"
                    value={script.cta}
                    onChange={(e) => updateScript(i, "cta", e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-accent text-center focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-accent text-center">{script.cta}</p>
                )}
              </div>

              {/* Hashtags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {script.hashtags.map((h, j) => (
                  <span key={j} className="text-xs text-info">
                    {h.startsWith("#") ? h : `#${h}`}
                  </span>
                ))}
              </div>
            </GlowCard>
          );
        })}
      </div>

      <UnipilePublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={publishContent}
      />
    </div>
  );
}
