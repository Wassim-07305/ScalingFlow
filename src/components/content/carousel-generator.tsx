"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, Hash, Layers } from "lucide-react";
import { toast } from "sonner";
import type { CarouselResult } from "@/lib/ai/prompts/carousel-content";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface CarouselGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function CarouselGenerator({ className, initialData }: CarouselGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CarouselResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [topic, setTopic] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setResult(initialData as CarouselResult);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Entre un sujet pour le carousel");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "carousel", topic }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      setResult(data.result as CarouselResult);
      toast.success("Carousel généré !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copie !");
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Génération du carousel" className={className} />;
  }

  if (!result) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="max-w-md mx-auto space-y-3">
          <div>
            <Label htmlFor="carousel-topic">Sujet du carousel</Label>
            <Input
              id="carousel-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: 5 erreurs en prospection"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button size="lg" className="w-full" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer le carousel
          </Button>
          <p className="text-sm text-text-secondary text-center">
            Carousel 8-10 slides avec cover, contenu et CTA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium text-text-primary">{result.titre}</span>
        </div>
        <div className="flex gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Nouveau sujet..."
            className="w-64"
          />
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            Régénérer
          </Button>
        </div>
      </div>

      {/* Cover slide */}
      <GlowCard glowColor="orange">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="default">Cover</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(result.hook_cover, "cover")}
          >
            <Copy className="h-3 w-3 mr-1" />
            {copiedField === "cover" ? "Copie !" : "Copier"}
          </Button>
        </div>
        <p className="text-lg font-semibold text-accent">{result.hook_cover}</p>
      </GlowCard>

      {/* Slides */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {result.slides.map((slide) => (
          <Card key={slide.numero}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="muted">Slide {slide.numero}</Badge>
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                {slide.texte_principal}
              </p>
              <p className="text-xs text-text-secondary mb-2">
                {slide.texte_secondaire}
              </p>
              <p className="text-xs text-text-muted italic">{slide.design_direction}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA final */}
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-center">
        <p className="text-xs text-text-muted mb-1">Slide finale - CTA</p>
        <p className="text-base font-semibold text-accent">{result.cta_final}</p>
      </div>

      {/* Caption */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-primary">Caption</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(result.caption, "caption")}
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedField === "caption" ? "Copie !" : "Copier"}
            </Button>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{result.caption}</p>
        </CardContent>
      </Card>

      {/* Hashtags */}
      <div className="flex flex-wrap gap-1">
        {result.hashtags.map((h, i) => (
          <Badge key={i} variant="muted" className="cursor-pointer" onClick={() => copyToClipboard(h, `hash-${i}`)}>
            <Hash className="h-3 w-3 mr-0.5" />
            {h.replace("#", "")}
          </Badge>
        ))}
      </div>
    </div>
  );
}
