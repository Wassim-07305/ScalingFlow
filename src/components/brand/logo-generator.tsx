"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Hexagon, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";

interface LogoGeneratorProps {
  concept: BrandIdentityResult["logo_concept"] | null;
  brandName?: string | null;
  palette?: { hex: string }[];
}

interface LogoResult {
  type: string;
  label: string;
  url: string;
}

export function LogoGenerator({ concept, brandName, palette }: LogoGeneratorProps) {
  const [logos, setLogos] = React.useState<LogoResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  const generate = async () => {
    if (!concept) {
      toast.error("Génère d'abord une identité de marque");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName || "Brand",
          concept: `${concept.description}. Forme: ${concept.forme}. Symbolisme: ${concept.symbolisme}`,
          style: concept.forme,
          colors: palette?.map((c) => c.hex).slice(0, 3),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }

      const data = await res.json();
      if (data.logos) {
        setLogos(data.logos);
      } else if (data.images) {
        // Fallback for old format
        setLogos(data.images.map((url: string, i: number) => ({
          type: ["principal", "icone", "monochrome"][i] || `variation-${i}`,
          label: ["Logo principal", "Logo icone", "Logo monochrome"][i] || `Variation ${i + 1}`,
          url,
        })));
      }
      toast.success("Logos générés !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-accent" />
            Concept de Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {concept ? (
            <>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-text-secondary">{concept.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Forme</p>
                  <p className="text-sm text-text-primary">{concept.forme}</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Symbolisme</p>
                  <p className="text-sm text-text-primary">{concept.symbolisme}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">
              Génère d&apos;abord une identité de marque pour obtenir un concept de logo.
            </p>
          )}

          <Button onClick={generate} disabled={loading || !concept} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Génération en cours (60-90s)...
              </>
            ) : logos.length > 0 ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Régénérer les logos
              </>
            ) : (
              <>
                <Hexagon className="h-4 w-4 mr-2" />
                Générer 3 variations (principal, icône, monochrome)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {logos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3 variations de logo (PNG)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {logos.map((logo, i) => (
                <div
                  key={i}
                  className="relative group rounded-xl border border-border-default bg-bg-tertiary overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.url}
                    alt={logo.label}
                    className="w-full aspect-square object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={logo.url}
                      download={`logo-${brandName || "brand"}-${logo.type}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      PNG
                    </a>
                  </div>
                  <div className="p-2 text-center">
                    <span className="text-xs text-text-muted">{logo.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted text-center mt-4">
              Les logos sont générés par IA (Flux) en PNG 1000x1000. Utilise-les comme base pour un designer professionnel.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
