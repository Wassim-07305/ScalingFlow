"use client";

import React from "react";
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
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  Layers,
  MessageSquareWarning,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ObjectionContentResult,
  ObjectionContentPiece,
} from "@/lib/ai/prompts/objection-content";

interface ObjectionContentProps {
  className?: string;
}

interface ObjectionInput {
  id: number;
  text: string;
  frequency: number;
}

export function ObjectionContent({ className }: ObjectionContentProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ObjectionContentResult | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);
  const [expandedCard, setExpandedCard] = React.useState<number | null>(null);
  const [expandedType, setExpandedType] = React.useState<
    Record<string, string>
  >({});
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = React.useState(true);
  const [objectionInputs, setObjectionInputs] = React.useState<
    ObjectionInput[]
  >([{ id: 1, text: "", frequency: 5 }]);
  const nextIdRef = React.useRef(2);

  const addObjection = () => {
    setObjectionInputs((prev) => [
      ...prev,
      { id: nextIdRef.current++, text: "", frequency: 5 },
    ]);
  };

  const removeObjection = (id: number) => {
    setObjectionInputs((prev) => prev.filter((o) => o.id !== id));
  };

  const updateObjection = (
    id: number,
    field: "text" | "frequency",
    value: string | number,
  ) => {
    setObjectionInputs((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    );
  };

  const handleGenerate = async () => {
    const validObjections = objectionInputs.filter((o) => o.text.trim());
    if (validObjections.length === 0) {
      toast.error("Ajoute au moins une objection de vente");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/objections-to-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objections: validObjections.map((o) => ({
            text: o.text,
            frequency: o.frequency,
          })),
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la génération");
      }

      const data = await response.json();
      setResult(data.result as ObjectionContentResult);
      setShowForm(false);
      toast.success("Contenus anti-objections générés !");
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
    toast.success("Copié !");
  };

  const copyReelScript = (piece: ObjectionContentPiece, index: number) => {
    const text = `Hook: ${piece.reel.hook}\n\n${piece.reel.script}\n\nCTA: ${piece.reel.cta}\n\nHashtags: ${piece.reel.hashtags.join(" ")}`;
    copyToClipboard(text, `reel-${index}`);
  };

  const copyCarousel = (piece: ObjectionContentPiece, index: number) => {
    const slidesText = piece.carousel.slides
      .map(
        (s) => `Slide ${s.numero}: ${s.texte_principal}\n${s.texte_secondaire}`,
      )
      .join("\n\n");
    const text = `Cover: ${piece.carousel.hook_cover}\n\n${slidesText}\n\nCTA: ${piece.carousel.cta_final}\n\nCaption: ${piece.carousel.caption}\n\nHashtags: ${piece.carousel.hashtags.join(" ")}`;
    copyToClipboard(text, `carousel-${index}`);
  };

  if (usageLimited) {
    return (
      <UpgradeWall
        currentUsage={usageLimited.currentUsage}
        limit={usageLimited.limit}
        className={className}
      />
    );
  }

  if (loading) {
    return (
      <AILoading
        text="Transformation des objections en contenu"
        className={className}
      />
    );
  }

  if (!result || showForm) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-accent" />
              {"Objections → Contenu"}
            </CardTitle>
            <CardDescription>
              Transforme tes objections de vente fréquentes en Reels et
              carousels qui les adressent de manière subtile et éducative.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Objection inputs */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-primary block">
                Objections de vente
              </label>
              {objectionInputs.map((obj) => (
                <div key={obj.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={obj.text}
                      onChange={(e) =>
                        updateObjection(obj.id, "text", e.target.value)
                      }
                      placeholder={
                        'Ex: "C\'est trop cher", "Je n\'ai pas le temps"...'
                      }
                      className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div className="w-24">
                    <select
                      value={obj.frequency}
                      onChange={(e) =>
                        updateObjection(
                          obj.id,
                          "frequency",
                          Number(e.target.value),
                        )
                      }
                      className="w-full rounded-lg border border-border-default bg-bg-secondary px-2 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n}/10
                        </option>
                      ))}
                    </select>
                  </div>
                  {objectionInputs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeObjection(obj.id)}
                      className="text-text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={addObjection}
                className="text-accent"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une objection
              </Button>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button size="lg" onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Transformer en contenu
            </Button>
            <p className="text-xs text-text-muted text-center">
              Pour chaque objection : 1 script Reel + 1 carousel complet
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {result.total_objections} objection
            {result.total_objections > 1 ? "s" : ""} {"transformée"}
            {result.total_objections > 1 ? "s" : ""} en contenu
          </h3>
          <p className="text-sm text-text-secondary mt-0.5">
            {result.total_objections * 2} pièces de contenu générées
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            Nouvelles objections
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            <Sparkles className="h-3 w-3 mr-1" />
            Régénérer
          </Button>
        </div>
      </div>

      {/* Objection cards */}
      <div className="space-y-8">
        {(result.contenus ?? []).map((piece, i) => {
          const isExpanded = expandedCard === i;
          const viewingType = expandedType[i] || "reel";

          return (
            <div key={i} className="space-y-4">
              {/* Objection header */}
              <button
                className="w-full text-left"
                onClick={() => setExpandedCard(isExpanded ? null : i)}
              >
                <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border-default hover:border-accent/30 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {"\u00AB"} {piece.objection} {"\u00BB"}
                    </p>
                    <p className="text-xs text-text-muted">
                      Fréquence : {piece.frequency}/10
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan">1 Reel + 1 Carousel</Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-4 pl-4 border-l-2 border-accent/20">
                  {/* Toggle between Reel and Carousel */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setExpandedType((prev) => ({ ...prev, [i]: "reel" }))
                      }
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        viewingType === "reel"
                          ? "bg-accent text-white"
                          : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                      )}
                    >
                      <Film className="h-3.5 w-3.5" />
                      Script Reel
                    </button>
                    <button
                      onClick={() =>
                        setExpandedType((prev) => ({
                          ...prev,
                          [i]: "carousel",
                        }))
                      }
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        viewingType === "carousel"
                          ? "bg-accent text-white"
                          : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                      )}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Carousel
                    </button>
                  </div>

                  {/* Reel view */}
                  {viewingType === "reel" && (
                    <GlowCard glowColor="orange">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Film className="h-4 w-4 text-orange-400" />
                          <span className="text-sm font-medium text-text-primary">
                            Script Reel
                          </span>
                          <Badge variant="muted">
                            {piece.reel.duree_estimee}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyReelScript(piece, i)}
                        >
                          {copiedField === `reel-${i}` ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          {copiedField === `reel-${i}` ? "Copié !" : "Copier"}
                        </Button>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-text-muted mb-0.5">Hook</p>
                        <p className="text-sm font-medium text-accent">
                          {piece.reel.hook}
                        </p>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-text-muted mb-0.5">Script</p>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">
                          {piece.reel.script}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mb-3">
                        <p className="text-sm font-medium text-accent text-center">
                          {piece.reel.cta}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(piece.reel?.hashtags ?? []).map((h, j) => (
                          <span key={j} className="text-xs text-info">
                            {h.startsWith("#") ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                    </GlowCard>
                  )}

                  {/* Carousel view */}
                  {viewingType === "carousel" && (
                    <div className="space-y-3">
                      {/* Cover */}
                      <GlowCard glowColor="blue">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-blue-400" />
                            <Badge variant="default">Cover</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCarousel(piece, i)}
                          >
                            {copiedField === `carousel-${i}` ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            {copiedField === `carousel-${i}`
                              ? "Copié !"
                              : "Tout copier"}
                          </Button>
                        </div>
                        <p className="text-lg font-semibold text-accent">
                          {piece.carousel.hook_cover}
                        </p>
                      </GlowCard>

                      {/* Slides */}
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {(piece.carousel?.slides ?? []).map((slide) => (
                          <Card key={slide.numero}>
                            <CardContent className="pt-4">
                              <Badge variant="muted" className="mb-2">
                                Slide {slide.numero}
                              </Badge>
                              <p className="text-sm font-medium text-text-primary mb-1">
                                {slide.texte_principal}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {slide.texte_secondaire}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* CTA final */}
                      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-center">
                        <p className="text-xs text-text-muted mb-1">
                          Slide finale - CTA
                        </p>
                        <p className="text-base font-semibold text-accent">
                          {piece.carousel.cta_final}
                        </p>
                      </div>

                      {/* Caption */}
                      <Card>
                        <CardContent className="pt-5">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-text-primary">
                              Caption
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  piece.carousel.caption,
                                  `caption-${i}`,
                                )
                              }
                            >
                              {copiedField === `caption-${i}` ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {copiedField === `caption-${i}`
                                ? "Copié !"
                                : "Copier"}
                            </Button>
                          </div>
                          <p className="text-sm text-text-secondary whitespace-pre-wrap">
                            {piece.carousel.caption}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-1">
                        {(piece.carousel?.hashtags ?? []).map((h, j) => (
                          <span key={j} className="text-xs text-info">
                            {h.startsWith("#") ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
