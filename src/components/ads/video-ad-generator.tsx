"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { GenerateButton } from "@/components/shared/generate-button";
import { Copy, Check, Video } from "lucide-react";
import { toast } from "sonner";
import type { VideoAdScriptResult } from "@/lib/ai/prompts/video-ad-scripts";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

const VIDEO_DURATIONS = [
  { key: "15s", label: "15s" },
  { key: "30s", label: "30s" },
  { key: "60s", label: "60s" },
  { key: "90s", label: "90s" },
] as const;

const VIDEO_STYLES = [
  { key: "temoignage", label: "Témoignage" },
  { key: "educatif", label: "Éducatif" },
  { key: "urgence", label: "Urgence" },
  { key: "storytelling", label: "Storytelling" },
] as const;

interface VideoAdGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const DURATION_CONFIG: Record<string, { label: string; badge: "cyan" | "blue" | "purple" | "yellow"; platform: string }> = {
  "15s": { label: "15 secondes", badge: "cyan", platform: "TikTok / Reels Ads" },
  "30s": { label: "30 secondes", badge: "blue", platform: "Meta Ads" },
  "60s": { label: "60 secondes", badge: "purple", platform: "YouTube Ads" },
  "90s": { label: "90 secondes", badge: "yellow", platform: "YouTube / VSL" },
};

export function VideoAdGenerator({ className, initialData }: VideoAdGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [scripts, setScripts] = React.useState<VideoAdScriptResult["scripts"]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  // Form state
  const [videoDuration, setVideoDuration] = React.useState("30s");
  const [videoStyle, setVideoStyle] = React.useState("temoignage");
  const [angleTheme, setAngleTheme] = React.useState("");
  const [showForm, setShowForm] = React.useState(true);

  React.useEffect(() => {
    if (initialData) {
      const result = initialData as VideoAdScriptResult;
      setScripts(result.scripts || []);
      setShowForm(false);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adType: "video_ad",
          videoDuration,
          videoStyle,
          angle: angleTheme || undefined,
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
      const result = data.result as VideoAdScriptResult;
      setScripts(result.scripts || []);
      setShowForm(false);
      toast.success("Scripts vidéo publicitaires générés !");
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
    toast.success("Copié dans le presse-papiers");
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading variant="immersive" text="Génération des scripts vidéo" className={className} />;
  }

  if (scripts.length === 0 || showForm) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-accent" />
              Scripts vidéo publicitaires
            </CardTitle>
            <CardDescription>
              Configurez la durée, le style et l&apos;angle pour générer des scripts vidéo optimisés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Video duration */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Durée de la vidéo</label>
              <p className="text-xs text-text-muted mb-2">La durée impacte la plateforme optimale</p>
              <div className="flex flex-wrap gap-2">
                {VIDEO_DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setVideoDuration(d.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                      videoDuration === d.key
                        ? "bg-accent text-white shadow-md shadow-accent/25"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video style */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Style de vidéo</label>
              <p className="text-xs text-text-muted mb-2">L&apos;approche créative du script</p>
              <div className="flex flex-wrap gap-2">
                {VIDEO_STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setVideoStyle(s.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                      videoStyle === s.key
                        ? "bg-accent text-white shadow-md shadow-accent/25"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Angle / theme */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Angle ou thème <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <p className="text-xs text-text-muted mb-2">Précise un angle pour des scripts plus ciblés</p>
              <input
                type="text"
                value={angleTheme}
                onChange={(e) => setAngleTheme(e.target.value)}
                placeholder="Ex: preuve sociale, résultat rapide, problème douloureux..."
                className="w-full rounded-xl border border-border-default bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <GenerateButton onClick={handleGenerate} className="w-full">
              Générer des scripts vidéo
            </GenerateButton>
            <p className="text-xs text-text-muted text-center">
              Scripts optimisés pour les publicités vidéo
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge variant="default" className="text-xs">{scripts.length} scripts vidéo générés</Badge>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            Nouveau brief
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            Régénérer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scripts.map((script, i) => {
          const config = DURATION_CONFIG[script.duree] || DURATION_CONFIG["30s"];
          return (
            <GlowCard key={i} glowColor={i === 0 ? "cyan" : i === 1 ? "blue" : "purple"}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-muted">#{i + 1}</span>
                  <Video className="h-4 w-4 text-text-muted" />
                  <Badge variant={config.badge}>{config.label}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(script, i)}
                  className={cn(copiedIndex === i && "text-accent")}
                >
                  {copiedIndex === i ? (
                    <><Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" /> Copié !</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-1" /> Copier</>
                  )}
                </Button>
              </div>

              {/* Platform */}
              <p className="text-xs text-text-muted mb-3">
                <span className="inline-block px-2 py-0.5 rounded-md bg-bg-tertiary">{config.platform}</span>
              </p>

              {/* Angle */}
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-0.5 font-medium">Angle</p>
                <p className="text-sm text-text-secondary">{script.angle}</p>
              </div>

              {/* Hook */}
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-0.5 font-medium">Hook</p>
                <p className="text-sm font-medium text-accent">{script.hook}</p>
              </div>

              {/* Corps */}
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-0.5 font-medium">Script</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{script.corps}</p>
              </div>

              {/* CTA */}
              <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 mb-3">
                <p className="text-sm font-medium text-accent text-center">{script.cta}</p>
              </div>

              {/* Visual notes */}
              <div className="pt-3 border-t border-border-default">
                <p className="text-xs text-text-muted mb-1 font-medium">Notes de production</p>
                <p className="text-xs text-text-secondary">{script.visual_notes}</p>
              </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
