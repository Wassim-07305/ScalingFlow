"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, Check, Hash, Layers, Send, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { CarouselResult } from "@/lib/ai/prompts/carousel-content";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { UnipilePublishDialog } from "@/components/shared/unipile-publish-dialog";
import { GenerateButton } from "@/components/shared/generate-button";

const CAROUSEL_TOPICS = [
  "Erreurs courantes en prospection",
  "Étapes pour scaler son business",
  "Mindset entrepreneurial",
  "Stratégie de pricing",
  "Automatisation IA",
  "Funnel de vente",
  "Personal branding",
  "Gestion du temps",
  "Acquisition clients",
  "Storytelling en marketing",
];

interface CarouselGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function CarouselGenerator({ className, initialData }: CarouselGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<CarouselResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [topic, setTopic] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishContent, setPublishContent] = React.useState("");

  // Massive mode state
  const [massiveMode, setMassiveMode] = React.useState(false);
  const [massiveLoading, setMassiveLoading] = React.useState(false);
  const [massiveProgress, setMassiveProgress] = React.useState({ current: 0, total: 4 });
  const [collapsedCarousels, setCollapsedCarousels] = React.useState<Record<number, boolean>>({});
  const [expandedCarousel, setExpandedCarousel] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setResults([initialData as CarouselResult]);
    }
  }, [initialData]);

  const handleGenerate = async (customTopic?: string) => {
    const topicToUse = customTopic || topic;
    if (!topicToUse.trim()) {
      toast.error("Entre un sujet pour le carousel");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "carousel", topic: topicToUse }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      const result = data.result as CarouselResult;
      setResults([result]);
      toast.success("Carousel généré !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMassiveGenerate = async () => {
    setMassiveLoading(true);
    setError(null);
    setResults([]);

    // Utiliser les topics prédéfinis + le topic personnalisé s'il existe
    const topics = [...CAROUSEL_TOPICS];
    if (topic.trim() && !topics.includes(topic.trim())) {
      topics.unshift(topic.trim());
    }
    // Prendre les 4 premiers batches de 10 sujets = 40 carousels, mais on fait 4 batches de 10
    // En pratique, on fait 4 appels séquentiels avec des sujets différents
    const totalBatches = 4;
    const topicsPerBatch = Math.ceil(topics.length / totalBatches);
    const allResults: CarouselResult[] = [];

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      setMassiveProgress({ current: batchIdx + 1, total: totalBatches });

      // Chaque batch génère plusieurs carousels séquentiellement
      const batchTopics = topics.slice(batchIdx * topicsPerBatch, (batchIdx + 1) * topicsPerBatch);
      if (batchTopics.length === 0) {
        // Generate with variations of the main topic
        batchTopics.push(
          topic.trim() || "Stratégie business",
          `${topic.trim() || "Business"} — erreurs à éviter`,
          `${topic.trim() || "Business"} — guide étape par étape`
        );
      }

      for (const t of batchTopics) {
        try {
          const response = await fetch("/api/ai/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentType: "carousel", topic: t }),
          });

          if (!response.ok) {
            if (response.status === 403) {
              const errData = await response.json();
              if (errData.usage) { setUsageLimited(errData.usage); setMassiveLoading(false); return; }
            }
            console.warn(`Carousel "${t}" échoué, on continue...`);
            continue;
          }

          const data = await response.json();
          const result = data.result as CarouselResult;
          allResults.push(result);
          // Affichage progressif
          setResults([...allResults]);
        } catch (err) {
          console.warn(`Carousel "${t}" erreur:`, err);
          continue;
        }
      }
    }

    setMassiveLoading(false);
    toast.success(`${allResults.length} carousels générés !`);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copié !");
  };

  const toggleCarouselCollapse = (index: number) => {
    setCollapsedCarousels((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const resetAll = () => {
    setResults([]);
    setMassiveMode(false);
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading variant="immersive" text="Génération du carousel" className={className} />;
  }

  if (massiveLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <AILoading variant="immersive" text={`Génération massive — Batch ${massiveProgress.current}/${massiveProgress.total}`} className="mb-4" />

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text-primary">
                Batch {massiveProgress.current} / {massiveProgress.total}
              </p>
              <Badge variant="default" className="bg-gradient-to-r from-accent to-emerald-400 text-white">
                {results.length} carousels générés
              </Badge>
            </div>
            <div className="w-full h-2 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-500"
                style={{ width: `${(massiveProgress.current / massiveProgress.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Show generated carousel titles */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary/50">
                <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="text-xs text-text-primary truncate">{r.titre}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Form view ───
  if (results.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent" />
              Générateur de Carousels
            </CardTitle>
            <CardDescription>
              Crée des carousels Instagram/LinkedIn optimisés pour les saves et partages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="carousel-topic">Sujet du carousel</Label>
              <Input
                id="carousel-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: 5 erreurs en prospection"
                onKeyDown={(e) => e.key === "Enter" && !massiveMode && handleGenerate()}
              />
            </div>

            {/* Mode selector */}
            <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-default">
              <label className="text-sm font-medium text-text-primary mb-2 block">Mode de génération</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setMassiveMode(false)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all duration-200",
                    !massiveMode
                      ? "border-accent bg-accent/10 shadow-md shadow-accent/10"
                      : "border-border-default bg-bg-secondary hover:border-border-default/80"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold text-text-primary">Unitaire</span>
                    <Badge variant="muted" className="text-[10px]">1 carousel</Badge>
                  </div>
                  <p className="text-xs text-text-muted">Carousel 8-10 slides avec cover, contenu et CTA</p>
                </button>
                <button
                  onClick={() => setMassiveMode(true)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all duration-200",
                    massiveMode
                      ? "border-accent bg-accent/10 shadow-md shadow-accent/10"
                      : "border-border-default bg-bg-secondary hover:border-border-default/80"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-text-primary">Pack complet</span>
                    <Badge variant="default" className="text-[10px] bg-gradient-to-r from-accent to-emerald-400 text-white">40+ carousels</Badge>
                  </div>
                  <p className="text-xs text-text-muted">10+ sujets variés = 40+ carousels prêts à poster</p>
                </button>
              </div>
            </div>

            {/* Massive mode: show topics that will be generated */}
            {massiveMode && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-text-primary">Sujets qui seront générés :</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CAROUSEL_TOPICS.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-bg-tertiary/30">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                      <span className="text-[10px] text-text-muted truncate">{t}</span>
                    </div>
                  ))}
                </div>
                {topic.trim() && (
                  <p className="text-[10px] text-accent">+ ton sujet personnalisé : &quot;{topic.trim()}&quot;</p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            {massiveMode ? (
              <GenerateButton onClick={handleMassiveGenerate} className="w-full" icon={<Zap className="h-4 w-4 mr-2" />}>
                Générer 40+ carousels
              </GenerateButton>
            ) : (
              <GenerateButton onClick={() => handleGenerate()} className="w-full" icon={<Layers className="h-4 w-4 mr-2" />}>
                Générer le carousel
              </GenerateButton>
            )}
            <p className="text-sm text-text-secondary text-center">
              {massiveMode ? "Génération massive — plusieurs minutes de traitement" : "Carousel 8-10 slides avec cover, contenu et CTA"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Single result view ───
  if (results.length === 1) {
    const result = results[0];
    return (
      <div className={cn("space-y-4", className)}>
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
            <Button variant="outline" size="sm" onClick={() => handleGenerate()}>
              Régénérer
            </Button>
            <Button
              variant="outline"
              size="sm"
              title="Publier via Unipile"
              onClick={() => {
                const fullText = [
                  result.hook_cover,
                  ...result.slides.map((s) => `Slide ${s.numero}: ${s.texte_principal}\n${s.texte_secondaire}`),
                  `CTA: ${result.cta_final}`,
                  result.caption,
                ].join("\n\n");
                setPublishContent(fullText);
                setPublishDialogOpen(true);
              }}
            >
              <Send className="h-3 w-3 mr-1" />
              Publier
            </Button>
          </div>
        </div>

        {renderCarouselDetail(result, "single")}

        <UnipilePublishDialog
          open={publishDialogOpen}
          onOpenChange={setPublishDialogOpen}
          content={publishContent}
        />
      </div>
    );
  }

  // ─── Multiple results view (massive mode) ───
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs bg-gradient-to-r from-accent to-emerald-400 text-white">
            {results.length} carousels générés
          </Badge>
          <Badge variant="muted" className="text-xs">
            {results.reduce((s, r) => s + r.slides.length, 0)} slides au total
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Nouveau brief
          </Button>
          <Button variant="outline" size="sm" onClick={handleMassiveGenerate}>
            Régénérer tout
          </Button>
        </div>
      </div>

      {results.map((result, idx) => {
        const isCollapsed = collapsedCarousels[idx] !== false && idx !== 0; // First one open by default
        const isExpanded = expandedCarousel === idx;

        return (
          <div key={idx} className="space-y-3">
            <button
              onClick={() => {
                if (isExpanded) {
                  setExpandedCarousel(null);
                } else {
                  setExpandedCarousel(idx);
                }
                toggleCarouselCollapse(idx);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-tertiary/50 border border-border-default hover:bg-bg-tertiary/80 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent">#{idx + 1}</span>
                <span className="text-sm font-medium text-text-primary truncate">{result.titre}</span>
                <Badge variant="muted" className="text-[10px] shrink-0">{result.slides.length} slides</Badge>
              </div>
              {!isCollapsed ? (
                <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
              )}
            </button>

            {!isCollapsed && renderCarouselDetail(result, `carousel-${idx}`)}
          </div>
        );
      })}

      <UnipilePublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={publishContent}
      />
    </div>
  );

  function renderCarouselDetail(result: CarouselResult, prefix: string) {
    return (
      <>
        {/* Cover slide */}
        <GlowCard glowColor="orange">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="default">Cover</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(result.hook_cover, `${prefix}-cover`)}
            >
              {copiedField === `${prefix}-cover` ? <Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" /> : <Copy className="h-3 w-3 mr-1" />}
              {copiedField === `${prefix}-cover` ? "Copié !" : "Copier"}
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
                onClick={() => copyToClipboard(result.caption, `${prefix}-caption`)}
              >
                {copiedField === `${prefix}-caption` ? <Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" /> : <Copy className="h-3 w-3 mr-1" />}
                {copiedField === `${prefix}-caption` ? "Copié !" : "Copier"}
              </Button>
            </div>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{result.caption}</p>
          </CardContent>
        </Card>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1">
          {result.hashtags.map((h, i) => (
            <Badge key={i} variant="muted" className="cursor-pointer" onClick={() => copyToClipboard(h, `${prefix}-hash-${i}`)}>
              <Hash className="h-3 w-3 mr-0.5" />
              {h.replace("#", "")}
            </Badge>
          ))}
        </div>
      </>
    );
  }
}
