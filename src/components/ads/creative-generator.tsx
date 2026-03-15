"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Image, Video, Target, Copy, Loader2, ImagePlus, Pencil, Check, Save } from "lucide-react";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

const TONES = [
  { key: "urgente", label: "Urgente" },
  { key: "educative", label: "Éducative" },
  { key: "inspirante", label: "Inspirante" },
  { key: "provocante", label: "Provocante" },
  { key: "storytelling", label: "Storytelling" },
] as const;

const OBJECTIVES = [
  { key: "ventes", label: "Ventes directes" },
  { key: "leads", label: "Génération de leads" },
  { key: "notoriete", label: "Notoriété" },
  { key: "engagement", label: "Engagement" },
] as const;

interface CreativeGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function CreativeGenerator({ className, initialData }: CreativeGeneratorProps) {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [variations, setVariations] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [generatingImage, setGeneratingImage] = React.useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = React.useState<Record<number, string[]>>({});
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [savedIds, setSavedIds] = React.useState<string[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [tone, setTone] = React.useState("urgente");
  const [objective, setObjective] = React.useState("ventes");
  const [targetAudience, setTargetAudience] = React.useState("");
  const [productContext, setProductContext] = React.useState("");

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
        body: JSON.stringify({
          tone,
          objective,
          targetAudience: targetAudience || undefined,
          productContext: productContext || undefined,
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
      const raw = data.ai_raw_response || data;
      const creatives = raw.ad_creatives || raw.variations || [];
      // Capture saved IDs from API response (ad_creatives have id from DB)
      const ids = (data.ad_creatives || []).map((c: Record<string, unknown>) => c.id).filter(Boolean);
      setSavedIds(ids);
      setIsDirty(false);
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

  const updateVariation = (index: number, field: string, value: string) => {
    setVariations((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
    setIsDirty(true);
  };

  const handleSaveEdits = async () => {
    if (!user || savedIds.length === 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      let hasError = false;
      for (let i = 0; i < variations.length; i++) {
        const id = savedIds[i];
        if (!id) continue;
        const v = variations[i];
        const { error } = await supabase
          .from("ad_creatives")
          .update({
            hook: v.hook,
            ad_copy: v.body,
            headline: v.headline,
            cta: v.cta,
          })
          .eq("id", id)
          .eq("user_id", user.id);
        if (error) hasError = true;
      }
      if (hasError) {
        toast.error("Erreur lors de la sauvegarde");
      } else {
        toast.success("Modifications sauvegardées");
        setIsDirty(false);
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
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
      toast.success("Visuels générés !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la génération");
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
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Paramètres de génération
            </CardTitle>
            <CardDescription>
              Configure le style et l&apos;objectif de tes publicités avant de générer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Tone selector */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Tonalité</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTone(t.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      tone === t.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Objective selector */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Objectif</label>
              <div className="flex flex-wrap gap-2">
                {OBJECTIVES.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => setObjective(o.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      objective === o.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target audience */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Audience cible <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: entrepreneurs 25-45 ans, coaches, e-commerçants..."
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Product context */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Contexte produit <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <textarea
                value={productContext}
                onChange={(e) => setProductContext(e.target.value)}
                placeholder="Décris brièvement ton produit/service pour des résultats plus pertinents..."
                rows={2}
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button size="lg" onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer 5 variations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Badge variant="default">{variations.length} variations</Badge>
        <div className="flex items-center gap-2">
          {isDirty && savedIds.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveEdits}
              disabled={saving}
              className="bg-accent hover:bg-accent/90"
            >
              {saving ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Sauvegarde...</>
              ) : (
                <><Save className="h-3 w-3 mr-1" /> Sauvegarder les modifications</>
              )}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setVariations([])}>
            Nouveau brief
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            Régénérer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {variations.map((v, i) => {
          const isEditing = editingIndex === i;
          return (
            <GlowCard key={i} glowColor={i % 2 === 0 ? "orange" : "blue"}>
              <div className="flex items-center justify-between mb-3">
                <Badge variant={v.estimated_format === "video" ? "blue" : "cyan"}>
                  {v.estimated_format === "video" ? (
                    <><Video className="h-3 w-3 mr-1" /> Vidéo</>
                  ) : (
                    <><Image className="h-3 w-3 mr-1" /> Image</>
                  )}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        setEditingIndex(null);
                        toast.success("Modifications sauvegardées");
                      } else {
                        setEditingIndex(i);
                      }
                    }}
                  >
                    {isEditing ? (
                      <><Check className="h-3 w-3 mr-1" /> OK</>
                    ) : (
                      <><Pencil className="h-3 w-3 mr-1" /> Modifier</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${v.hook}\n\n${v.body}\n\n${v.headline}\n\nCTA: ${v.cta}`, i)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedIndex === i ? "Copié !" : "Copier"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-muted mb-1">Hook</p>
                  {isEditing ? (
                    <textarea
                      value={v.hook}
                      onChange={(e) => updateVariation(i, "hook", e.target.value)}
                      className="w-full rounded-lg border border-accent/30 bg-bg-secondary px-2 py-1.5 text-sm font-medium text-accent resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-medium text-accent">{v.hook}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Body</p>
                  {isEditing ? (
                    <textarea
                      value={v.body}
                      onChange={(e) => updateVariation(i, "body", e.target.value)}
                      className="w-full rounded-lg border border-border-default bg-bg-secondary px-2 py-1.5 text-sm text-text-secondary resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-text-secondary">{v.body}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Headline</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={v.headline}
                      onChange={(e) => updateVariation(i, "headline", e.target.value)}
                      className="w-full rounded-lg border border-border-default bg-bg-secondary px-2 py-1.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-text-primary">{v.headline}</p>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                  {isEditing ? (
                    <input
                      type="text"
                      value={v.cta}
                      onChange={(e) => updateVariation(i, "cta", e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-accent text-center focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm font-medium text-accent text-center">{v.cta}</p>
                  )}
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
                      <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Génération...</>
                    ) : generatedImages[i] ? (
                      <><ImagePlus className="h-3 w-3 mr-1" /> Régénérer visuels</>
                    ) : (
                      <><ImagePlus className="h-3 w-3 mr-1" /> Générer visuels IA</>
                    )}
                  </Button>
                )}
              </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
