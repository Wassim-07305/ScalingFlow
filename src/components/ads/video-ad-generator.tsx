"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, Video, Clock } from "lucide-react";
import { toast } from "sonner";
import type { VideoAdScriptResult } from "@/lib/ai/prompts/video-ad-scripts";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface VideoAdGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const DURATION_CONFIG = {
  "15s": { label: "15 secondes", badge: "cyan" as const, platform: "TikTok / Reels Ads" },
  "30s": { label: "30 secondes", badge: "blue" as const, platform: "Meta Ads" },
  "60s": { label: "60 secondes", badge: "purple" as const, platform: "YouTube Ads" },
};

export function VideoAdGenerator({ className, initialData }: VideoAdGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [scripts, setScripts] = React.useState<VideoAdScriptResult["scripts"]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  React.useEffect(() => {
    if (initialData) {
      const result = initialData as VideoAdScriptResult;
      setScripts(result.scripts || []);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adType: "video_ad" }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
      }
      const data = await response.json();
      const result = data.result as VideoAdScriptResult;
      setScripts(result.scripts || []);
      toast.success("Scripts video publicitaires generes !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (script: VideoAdScriptResult["scripts"][number], index: number) => {
    const text = `[${script.duree}] ${script.angle}\n\nHook: ${script.hook}\n\n${script.corps}\n\nCTA: ${script.cta}\n\nNotes visuelles: ${script.visual_notes}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Copié !");
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Generation des scripts video" className={className} />;
  }

  if (scripts.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer 3 scripts video
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          Un script par duree : 15s, 30s et 60s
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Badge variant="default">{scripts.length} scripts video</Badge>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          Regenerer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scripts.map((script, i) => {
          const config = DURATION_CONFIG[script.duree] || DURATION_CONFIG["30s"];
          return (
            <GlowCard key={i} glowColor={i === 0 ? "cyan" : i === 1 ? "blue" : "purple"}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-text-muted" />
                  <Badge variant={config.badge}>{config.label}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(script, i)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedIndex === i ? "Copié !" : "Copier"}
                </Button>
              </div>

              {/* Platform */}
              <p className="text-xs text-text-muted mb-3">{config.platform}</p>

              {/* Angle */}
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-0.5">Angle</p>
                <p className="text-sm text-text-secondary">{script.angle}</p>
              </div>

              {/* Hook */}
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-0.5">Hook</p>
                <p className="text-sm font-medium text-accent">{script.hook}</p>
              </div>

              {/* Corps */}
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-0.5">Script</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{script.corps}</p>
              </div>

              {/* CTA */}
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mb-3">
                <p className="text-sm font-medium text-accent text-center">{script.cta}</p>
              </div>

              {/* Visual notes */}
              <div className="pt-3 border-t border-border-default">
                <p className="text-xs text-text-muted mb-1">Notes de production</p>
                <p className="text-xs text-text-secondary">{script.visual_notes}</p>
              </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
