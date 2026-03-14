"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import {
  Sparkles,
  Presentation,
  Eye,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { PitchDeckResult } from "@/lib/ai/prompts/pitch-deck";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface PitchDeckGeneratorProps {
  className?: string;
  initialData?: PitchDeckResult;
}

const AUDIENCES = ["Investisseurs", "Clients", "Partenaires"] as const;
const SLIDE_COUNTS = [5, 8, 10, 15] as const;

export function PitchDeckGenerator({ className, initialData }: PitchDeckGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [deck, setDeck] = React.useState<PitchDeckResult | null>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [audience, setAudience] = React.useState<string>("Investisseurs");
  const [slideCount, setSlideCount] = React.useState<number>(10);

  React.useEffect(() => {
    if (initialData) setDeck(initialData);
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pitch_deck", audience, slideCount }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      const raw = data.ai_raw_response || data;
      setDeck(raw as PitchDeckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return (
      <AILoading text="Création de ton pitch deck" className={className} />
    );
  }

  if (!deck) {
    return (
      <div className={cn("max-w-xl mx-auto py-8", className)}>
        {error && <p className="text-sm text-danger mb-4 text-center">{error}</p>}
        <Card>
          <CardHeader>
            <CardTitle>Pitch Deck</CardTitle>
            <CardDescription>Slides professionnelles avec notes speaker</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audience */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Audience</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      audience === a
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide count */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Nombre de slides</label>
              <div className="flex flex-wrap gap-2">
                {SLIDE_COUNTS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setSlideCount(count)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      slideCount === count
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le pitch deck
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slides = deck.slides || [];
  const current = slides[activeSlide];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Slide counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="blue">
            <Presentation className="h-3 w-3 mr-1" />
            {slides.length} slides
          </Badge>
          <span className="text-sm text-text-secondary">
            Slide {activeSlide + 1} / {slides.length}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDeck(null)}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Nouveau brief
        </Button>
      </div>

      {/* Slide navigator — numbered tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg text-xs font-semibold transition-all",
              activeSlide === i
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {s.slide_number || i + 1}
          </button>
        ))}
      </div>

      {/* Active slide card */}
      {current && (
        <GlowCard glowColor="purple">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Presentation className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-text-primary">
                {current.title}
              </h3>
            </div>
            <Badge variant="muted">
              Slide {current.slide_number || activeSlide + 1}
            </Badge>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p className="text-text-secondary text-sm whitespace-pre-wrap">
              {current.content}
            </p>
          </div>

          {/* Speaker notes */}
          {current.speaker_notes && (
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default mb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquareText className="h-3 w-3 text-text-muted" />
                <p className="text-xs text-text-muted font-medium">
                  Notes speaker
                </p>
              </div>
              <p className="text-xs text-text-secondary">
                {current.speaker_notes}
              </p>
            </div>
          )}

          {/* Visual suggestion */}
          {current.visual_suggestion && (
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="h-3 w-3 text-text-muted" />
                <p className="text-xs text-text-muted font-medium">
                  Suggestion visuelle
                </p>
              </div>
              <p className="text-xs text-text-secondary">
                {current.visual_suggestion}
              </p>
            </div>
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-default">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeSlide === 0}
              onClick={() => setActiveSlide((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={activeSlide === slides.length - 1}
              onClick={() => setActiveSlide((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </GlowCard>
      )}
    </div>
  );
}
