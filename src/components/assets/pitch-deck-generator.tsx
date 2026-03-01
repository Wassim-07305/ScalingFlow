"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import {
  Sparkles,
  Presentation,
  Eye,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { PitchDeckResult } from "@/lib/ai/prompts/pitch-deck";

interface PitchDeckGeneratorProps {
  className?: string;
  initialData?: PitchDeckResult;
}

export function PitchDeckGenerator({ className, initialData }: PitchDeckGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [deck, setDeck] = React.useState<PitchDeckResult | null>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSlide, setActiveSlide] = React.useState(0);

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
        body: JSON.stringify({ type: "pitch_deck" }),
      });

      if (!response.ok) throw new Error("Erreur lors de la generation");
      const data = await response.json();
      const raw = data.ai_raw_response || data;
      setDeck(raw as PitchDeckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AILoading text="Creation de ton pitch deck" className={className} />
    );
  }

  if (!deck) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer le pitch deck
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          11 slides professionnelles avec notes speaker
        </p>
      </div>
    );
  }

  const slides = deck.slides || [];
  const current = slides[activeSlide];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Slide counter */}
      <div className="flex items-center gap-4">
        <Badge variant="blue">
          <Presentation className="h-3 w-3 mr-1" />
          {slides.length} slides
        </Badge>
        <span className="text-sm text-text-secondary">
          Slide {activeSlide + 1} / {slides.length}
        </span>
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
              Precedent
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
