"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import {
  ImagePlus,
  Download,
  RefreshCw,
  Sparkles,
  RectangleVertical,
  Square,
  RectangleHorizontal,
  AlertCircle,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

const FORMATS = [
  {
    key: "feed" as const,
    label: "Feed",
    dimensions: "1080×1080",
    icon: Square,
  },
  {
    key: "story" as const,
    label: "Story",
    dimensions: "1080×1920",
    icon: RectangleVertical,
  },
  {
    key: "facebook" as const,
    label: "Facebook",
    dimensions: "1200×628",
    icon: RectangleHorizontal,
  },
] as const;

const STYLES = [
  { key: "minimal" as const, label: "Minimal" },
  { key: "bold" as const, label: "Bold" },
  { key: "elegant" as const, label: "Élégant" },
] as const;

type AdFormat = "feed" | "story" | "facebook";
type AdStyle = "minimal" | "bold" | "elegant";

interface GeneratedImage {
  url: string;
  variation: number;
}

interface AdImageGeneratorProps {
  className?: string;
}

export function AdImageGenerator({ className }: AdImageGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [images, setImages] = React.useState<GeneratedImage[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = React.useState<
    number | null
  >(null);

  // Form state
  const [headline, setHeadline] = React.useState("");
  const [bodyText, setBodyText] = React.useState("");
  const [format, setFormat] = React.useState<AdFormat>("feed");
  const [style, setStyle] = React.useState<AdStyle>("minimal");
  const [brandName, setBrandName] = React.useState("");
  const [brandColors, setBrandColors] = React.useState<string[]>([
    "#34D399",
    "#0B0E11",
    "#FFFFFF",
  ]);

  const updateColor = (index: number, value: string) => {
    setBrandColors((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const addColor = () => {
    if (brandColors.length < 6) {
      setBrandColors((prev) => [...prev, "#888888"]);
    }
  };

  const removeColor = (index: number) => {
    if (brandColors.length > 1) {
      setBrandColors((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = async () => {
    if (!headline.trim()) {
      setError("Le titre de la publicité est requis.");
      return;
    }

    setLoading(true);
    setError(null);
    setImages([]);

    try {
      const response = await fetch("/api/ai/generate-ad-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_text: { headline, body: bodyText },
          brand_colors: brandColors,
          brand_name: brandName,
          format,
          style,
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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la génération");
      }

      const data = await response.json();
      setImages(data.images || []);
      toast.success(
        `${data.images?.length || 0} créatives générées avec succès !`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    setRegeneratingIndex(index);

    try {
      const response = await fetch("/api/ai/generate-ad-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_text: { headline, body: bodyText },
          brand_colors: brandColors,
          brand_name: brandName,
          format,
          style,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la régénération");
      }

      const data = await response.json();
      const newImages: GeneratedImage[] = data.images || [];
      if (newImages.length > 0) {
        setImages((prev) =>
          prev.map((img, i) => (i === index ? newImages[0] : img))
        );
        toast.success("Image régénérée !");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la régénération"
      );
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `ad-creative-${format}-${style}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Image téléchargée !");
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
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
        text="Génération de tes créatives publicitaires"
        variant="immersive"
        className={className}
      />
    );
  }

  const formatConfig = FORMATS.find((f) => f.key === format);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Form */}
      {images.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-accent" />
              Générateur d&apos;images publicitaires
            </CardTitle>
            <CardDescription>
              Crée des visuels publicitaires statiques adaptés à ta marque en 3
              formats (Feed, Story, Facebook).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Brand name */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Nom de la marque{" "}
                <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ex: ScalingFlow, MonBrand..."
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Headline */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Titre de la publicité
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex: Double ton chiffre d'affaires en 90 jours"
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Body text */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Texte de la publicité{" "}
                <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Décris le message principal de ta publicité..."
                rows={3}
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            {/* Format selector */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Format
              </label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFormat(f.key)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        format === f.key
                          ? "bg-accent text-white"
                          : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {f.label}
                      <span className="text-xs opacity-70">
                        {f.dimensions}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style selector */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Style
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStyle(s.key)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      style === s.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand colors */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4 text-accent" />
                Couleurs de la marque
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {brandColors.map((color, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative group">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateColor(i, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border-default cursor-pointer bg-transparent"
                      />
                    </div>
                    <span className="text-xs text-text-muted font-mono">
                      {color}
                    </span>
                    {brandColors.length > 1 && (
                      <button
                        onClick={() => removeColor(i)}
                        className="text-xs text-text-muted hover:text-danger transition-colors"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                {brandColors.length < 6 && (
                  <button
                    onClick={addColor}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-border-default text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button size="lg" onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer les créatives
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="default">
                {images.length} créative{images.length > 1 ? "s" : ""}
              </Badge>
              {formatConfig && (
                <Badge variant="muted">
                  {formatConfig.label} — {formatConfig.dimensions}
                </Badge>
              )}
              <Badge variant="muted" className="capitalize">
                {style}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImages([])}
              >
                Nouveau brief
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Tout régénérer
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "grid gap-6",
              format === "story"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {images.map((img, i) => (
              <Card key={i} className="overflow-hidden group">
                <div
                  className={cn(
                    "relative bg-bg-tertiary",
                    format === "feed" && "aspect-square",
                    format === "story" && "aspect-[9/16]",
                    format === "facebook" && "aspect-video"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Créative publicitaire ${i + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => handleDownload(img.url, i)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      disabled={regeneratingIndex === i}
                      onClick={() => handleRegenerate(i)}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4 mr-1",
                          regeneratingIndex === i && "animate-spin"
                        )}
                      />
                      Régénérer
                    </Button>
                  </div>

                  {/* Format badge */}
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="default"
                      className="bg-black/60 text-white border-none backdrop-blur-sm"
                    >
                      Variation {img.variation}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary truncate">
                      {headline}
                    </p>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(img.url, i)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={regeneratingIndex === i}
                        onClick={() => handleRegenerate(i)}
                      >
                        <RefreshCw
                          className={cn(
                            "h-3 w-3",
                            regeneratingIndex === i && "animate-spin"
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
