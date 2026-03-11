"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Image, Video, Target, Copy, Loader2, ImagePlus } from "lucide-react";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { toast } from "sonner";

interface CreativeGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function CreativeGenerator({ className, initialData }: CreativeGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [variations, setVariations] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [generatingImage, setGeneratingImage] = React.useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = React.useState<Record<number, string[]>>({});

  React.useEffect(() => {
    if (initialData) {
      const creatives = initialData.ad_creatives || initialData.variations || (Array.isArray(initialData) ? initialData : []);
      setVariations(creatives.map((c: Record<string, unknown>) => ({
        hook: c.hook || "",
        body: c.ad_copy || c.body || "",
        headline: c.headline || "",
        cta: c.cta || "",
        estimated_format: c.creative_type || c.estimated_format || "image",
        angle: c.angle || "",
      })));
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
      }
      const data = await response.json();
      const raw = data.ai_raw_response || data;
      const creatives = raw.ad_creatives || raw.variations || [];
      // Map API fields to component expected fields
      setVariations(creatives.map((c: Record<string, unknown>) => ({
        hook: c.hook || "",
        body: c.ad_copy || c.body || "",
        headline: c.headline || "",
        cta: c.cta || "",
        estimated_format: c.creative_type || c.estimated_format || "image",
        angle: c.angle || "",
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const generateAdImage = async (index: number) => {
    const v = variations[index];
    if (!v) return;
    setGeneratingImage(index);
    try {
      const res = await fetch("/api/ai/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: v.headline || "Ad",
          concept: `Social media advertisement visual. "${v.hook}". Style: bold, eye-catching, scroll-stopping social media ad. Modern marketing aesthetic with strong contrast.`,
          style: "social media advertisement, eye-catching, bold typography overlay, marketing creative",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }
      const data = await res.json();
      setGeneratedImages((prev) => ({ ...prev, [index]: data.images || [] }));
      toast.success("Visuels generes !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la generation");
    } finally {
      setGeneratingImage(null);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Création de tes publicités" className={className} />;
  }

  if (variations.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Générer 5 variations
        </Button>
        <p className="text-sm text-text-secondary mt-2">Copy + hooks pour tes campagnes</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Badge variant="default">{variations.length} variations</Badge>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          Régénérer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {variations.map((v, i) => (
          <GlowCard key={i} glowColor={i % 2 === 0 ? "orange" : "blue"}>
            <div className="flex items-center justify-between mb-3">
              <Badge variant={v.estimated_format === "video" ? "blue" : "cyan"}>
                {v.estimated_format === "video" ? (
                  <><Video className="h-3 w-3 mr-1" /> Vidéo</>
                ) : (
                  <><Image className="h-3 w-3 mr-1" /> Image</>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`${v.hook}\n\n${v.body}\n\n${v.headline}\n\nCTA: ${v.cta}`, i)}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedIndex === i ? "Copié !" : "Copier"}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-1">Hook</p>
                <p className="text-sm font-medium text-accent">{v.hook}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Body</p>
                <p className="text-sm text-text-secondary">{v.body}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Headline</p>
                <p className="text-sm font-medium text-text-primary">{v.headline}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm font-medium text-accent text-center">{v.cta}</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Target className="h-3 w-3 text-text-muted" />
                <p className="text-xs text-text-muted">{v.angle} &middot; {v.target_audience}</p>
              </div>

              {/* Generated images */}
              {generatedImages[i] && generatedImages[i].length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {generatedImages[i].map((url, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={j} src={url} alt={`Visual ${j + 1}`} className="rounded-lg w-full aspect-square object-cover" />
                  ))}
                </div>
              )}

              {/* Generate image button */}
              {v.estimated_format !== "video" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  disabled={generatingImage === i}
                  onClick={() => generateAdImage(i)}
                >
                  {generatingImage === i ? (
                    <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Generation...</>
                  ) : generatedImages[i] ? (
                    <><ImagePlus className="h-3 w-3 mr-1" /> Regenerer visuels</>
                  ) : (
                    <><ImagePlus className="h-3 w-3 mr-1" /> Generer visuels IA</>
                  )}
                </Button>
              )}
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
