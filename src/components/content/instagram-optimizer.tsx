"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, Instagram, User, Link, LayoutGrid, Star, Bookmark } from "lucide-react";
import { toast } from "sonner";
import type { InstagramProfileResult } from "@/lib/ai/prompts/instagram-profile";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

const OPTIMIZATION_FOCUS = [
  { key: "bio", label: "Bio" },
  { key: "feed", label: "Feed" },
  { key: "stories", label: "Stories" },
  { key: "hashtags", label: "Hashtags" },
  { key: "engagement", label: "Engagement" },
] as const;

interface InstagramOptimizerProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function InstagramOptimizer({ className, initialData }: InstagramOptimizerProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<InstagramProfileResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  // Form state
  const [focus, setFocus] = React.useState("bio");
  const [handle, setHandle] = React.useState("");
  const [showForm, setShowForm] = React.useState(true);

  React.useEffect(() => {
    if (initialData) {
      setResult(initialData as InstagramProfileResult);
      setShowForm(false);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/optimize-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus,
          handle: handle || undefined,
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
      setResult(data.result as InstagramProfileResult);
      setShowForm(false);
      toast.success("Profil Instagram optimisé !");
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

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Optimisation du profil Instagram" className={className} />;
  }

  if (!result || showForm) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-[#E1306C]" />
              Optimiser mon profil Instagram
            </CardTitle>
            <CardDescription>
              Sélectionne le focus de l&apos;optimisation pour obtenir des recommandations ciblées.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Optimization focus */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Focus de l&apos;optimisation</label>
              <div className="flex flex-wrap gap-2">
                {OPTIMIZATION_FOCUS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFocus(f.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      focus === f.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Instagram handle */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Nom d&apos;utilisateur Instagram <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Ex: @moncompte"
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button size="lg" onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Optimiser mon profil Instagram
            </Button>
            <p className="text-xs text-text-muted text-center">
              Bio, highlights, stratégie de grille et CTA
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Instagram className="h-5 w-5 text-[#E1306C]" />
          <span className="text-sm font-medium text-text-primary">Profil optimisé</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            Nouveau brief
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            Régénérer
          </Button>
        </div>
      </div>

      {/* Nom affiché */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-text-muted" />
              <p className="text-sm font-medium text-text-primary">Nom affiché</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(result.nom_affiche, "nom")}
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedField === "nom" ? "Copié !" : "Copier"}
            </Button>
          </div>
          <p className="text-base font-semibold text-accent">{result.nom_affiche}</p>
        </CardContent>
      </Card>

      {/* Bio principale */}
      <GlowCard glowColor="purple">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-text-primary">Bio</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(result.bio, "bio")}
          >
            <Copy className="h-3 w-3 mr-1" />
            {copiedField === "bio" ? "Copié !" : "Copier"}
          </Button>
        </div>
        <p className="text-sm text-text-secondary whitespace-pre-wrap">{result.bio}</p>
      </GlowCard>

      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Stories à la une
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {result.highlights.map((h, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-tertiary border border-border-default"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{h.icon_suggestion}</span>
                  <p className="text-sm font-medium text-text-primary">{h.name}</p>
                </div>
                <p className="text-xs text-text-secondary">{h.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA Lien */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-3">
            <Link className="h-4 w-4 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">Lien dans la bio</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm font-medium text-accent">{result.cta_lien.texte}</p>
            <p className="text-xs text-text-muted mt-1">{result.cta_lien.url_suggestion}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stratégie de grille */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="h-4 w-4 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">Stratégie de grille</p>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {result.grille_strategy}
          </p>
        </CardContent>
      </Card>

      {/* Bio alternatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Bio alternatives (A/B test)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.bio_alternatives.map((alt, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-tertiary border border-border-default"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="muted">Version {i + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(alt, `alt-${i}`)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedField === `alt-${i}` ? "Copié !" : "Copier"}
                  </Button>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{alt}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
