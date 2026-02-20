"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Image, Video, Target, Copy } from "lucide-react";

interface CreativeGeneratorProps {
  className?: string;
}

export function CreativeGenerator({ className }: CreativeGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [variations, setVariations] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();
      const raw = data.ai_raw_response || data;
      setVariations(raw.variations || []);
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

  if (loading) {
    return <AILoading text="Création de tes publicités" className={className} />;
  }

  if (variations.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-neon-red mb-4">{error}</p>}
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
                <p className="text-sm font-medium text-neon-orange">{v.hook}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Body</p>
                <p className="text-sm text-text-secondary">{v.body}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Headline</p>
                <p className="text-sm font-medium text-text-primary">{v.headline}</p>
              </div>
              <div className="p-2 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                <p className="text-sm font-medium text-neon-orange text-center">{v.cta}</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Target className="h-3 w-3 text-text-muted" />
                <p className="text-xs text-text-muted">{v.angle} &middot; {v.target_audience}</p>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
