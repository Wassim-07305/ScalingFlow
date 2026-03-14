"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ReelsScriptsResult } from "@/lib/ai/prompts/reels-scripts";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

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
  const [loading, setLoading] = React.useState(false);
  const [scripts, setScripts] = React.useState<ReelsScriptsResult["scripts"]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [batchNumber, setBatchNumber] = React.useState(1);
  const [expandedScript, setExpandedScript] = React.useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  React.useEffect(() => {
    if (initialData) {
      const result = initialData as ReelsScriptsResult;
      setScripts(result.scripts || []);
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
        body: JSON.stringify({ contentType: "reels", batchNumber: currentBatch }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
      }
      const data = await response.json();
      const result = data.result as ReelsScriptsResult;
      setScripts(result.scripts || []);
      toast.success(`${(result.scripts || []).length} scripts Reels generes !`);
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
    toast.success("Copie !");
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Generation des scripts Reels" className={className} />;
  }

  if (scripts.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={() => handleGenerate()}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer 12 scripts Reels
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          Scripts optimises pour Instagram Reels, TikTok et YouTube Shorts
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Badge variant="default">{scripts.length} scripts (batch #{batchNumber})</Badge>
        <Button variant="outline" size="sm" onClick={handleNextBatch}>
          <Sparkles className="h-3 w-3 mr-1" />
          Nouveau batch
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scripts.map((script, i) => {
          const isExpanded = expandedScript === i;
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `Hook: ${script.hook}\n\n${script.corps}\n\nCTA: ${script.cta}\n\n${script.hashtags.join(" ")}`,
                      i
                    )
                  }
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedIndex === i ? "Copie !" : "Copier"}
                </Button>
              </div>

              {/* Numero + angle */}
              <p className="text-xs text-text-muted mb-2">
                #{script.numero} - {script.angle}
              </p>

              {/* Hook */}
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-0.5">Hook</p>
                <p className="text-sm font-medium text-accent">{script.hook}</p>
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
                <p
                  className={cn(
                    "text-sm text-text-secondary whitespace-pre-wrap",
                    !isExpanded && "line-clamp-3"
                  )}
                >
                  {script.corps}
                </p>
              </button>

              {/* CTA */}
              <div className="mt-3 p-2 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm font-medium text-accent text-center">{script.cta}</p>
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
    </div>
  );
}
