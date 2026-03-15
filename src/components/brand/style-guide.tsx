"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Type, Eye, ImageIcon } from "lucide-react";
import type { BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";

interface StyleGuideProps {
  direction: BrandIdentityResult["direction_artistique"] | null;
  className?: string;
}

export function StyleGuide({ direction, className }: StyleGuideProps) {
  // Normalize: handle both old format (flat keys: colors, typography, mood, style, imagery)
  // and new format (structured: palette, typographies, style_visuel, moodboard_description)
  const normalized = React.useMemo(() => {
    if (!direction) return null;
    const raw = direction as Record<string, unknown>;

    // --- Palette ---
    // New format: palette is array of {name, hex, usage}
    // Old format: colors is a flat object like {primary_color: "#xxx", accent_color: "#xxx", ...}
    let palette: { name: string; hex: string; usage: string }[] = [];
    const paletteRaw = raw.palette || raw.couleurs;
    if (Array.isArray(paletteRaw)) {
      palette = paletteRaw.map((c: Record<string, unknown>) => ({
        name: String(c.name || c.nom || c.couleur || ""),
        hex: String(c.hex || c.code || c.code_hex || "#888"),
        usage: String(c.usage || c.utilisation || c.role || ""),
      }));
    } else if (raw.colors && typeof raw.colors === "object") {
      // Old format: {primary_color: "#xxx", secondary_color: "#xxx", accent_color: "#xxx"}
      const colorsObj = raw.colors as Record<string, unknown>;
      palette = Object.entries(colorsObj)
        .filter(([, v]) => typeof v === "string" && (v as string).startsWith("#"))
        .map(([k, v]) => ({
          name: k.replace(/_/g, " ").replace(/color/i, "").trim(),
          hex: String(v),
          usage: k.replace(/_/g, " "),
        }));
    } else if (raw.primary_color || raw.accent_color || raw.secondary_color) {
      // Flat keys at root level
      const colorKeys = ["primary_color", "secondary_color", "accent_color"];
      palette = colorKeys
        .filter((k) => raw[k] && typeof raw[k] === "string")
        .map((k) => ({
          name: k.replace(/_/g, " ").replace("color", "").trim(),
          hex: String(raw[k]),
          usage: k.replace(/_/g, " "),
        }));
    }

    // --- Typography ---
    // New format: typographies is array of {role, font_family, style}
    // Old format: typography is a flat object like {font_heading: "...", font_body: "..."}
    let typographies: { role: string; font_family: string; style: string }[] = [];
    const typoRaw = raw.typographies || raw.typography || raw.polices;
    if (Array.isArray(typoRaw)) {
      typographies = typoRaw.map((t: Record<string, unknown>) => ({
        role: String(t.role || t.usage || ""),
        font_family: String(t.font_family || t.famille || t.font || t.police || ""),
        style: String(t.style || t.description || ""),
      }));
    } else if (typoRaw && typeof typoRaw === "object") {
      // Old format: {font_heading: "Montserrat", font_body: "Inter"}
      const typoObj = typoRaw as Record<string, unknown>;
      typographies = Object.entries(typoObj)
        .filter(([, v]) => typeof v === "string" && (v as string).length > 0)
        .map(([k, v]) => ({
          role: k.replace(/font_?/i, "").trim() || k,
          font_family: String(v),
          style: "",
        }));
    } else if (raw.font_heading || raw.font_body) {
      // Flat keys at root level
      const fontKeys = ["font_heading", "font_body"];
      typographies = fontKeys
        .filter((k) => raw[k] && typeof raw[k] === "string")
        .map((k) => ({
          role: k.replace(/font_?/i, "").trim(),
          font_family: String(raw[k]),
          style: "",
        }));
    }

    // --- Style & Mood ---
    const style_visuel = String(raw.style_visuel || raw.style || raw.visual_style || "");
    const moodboard_description = String(
      raw.moodboard_description || raw.moodboard || raw.univers_visuel
      || raw.mood || raw.imagery || ""
    );

    return { palette, typographies, style_visuel, moodboard_description };
  }, [direction]);

  if (!normalized || (normalized.palette.length === 0 && normalized.typographies.length === 0)) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Palette className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">
          Aucune direction artistique générée. Lance la génération pour obtenir un guide de style.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Palette */}
      {normalized.palette.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-accent" />
              Palette de couleurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.palette.map((color, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-default"
                >
                  <div
                    className="w-12 h-12 rounded-lg border border-border-default shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {color.name}
                    </p>
                    <p className="text-xs text-text-muted font-mono">{color.hex}</p>
                    {color.usage && (
                      <p className="text-xs text-text-secondary mt-0.5">{color.usage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Color strip preview */}
            <div className="mt-4 flex rounded-xl overflow-hidden h-8">
              {normalized.palette.map((color, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Typography */}
      {normalized.typographies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-accent" />
              Typographies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {normalized.typographies.map((typo, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-bg-tertiary border border-border-default"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="muted">{typo.role}</Badge>
                    {typo.style && (
                      <span className="text-xs text-text-muted">{typo.style}</span>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-text-primary">
                    {typo.font_family}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Style */}
      {normalized.style_visuel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-accent" />
              Style visuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">{normalized.style_visuel}</p>
          </CardContent>
        </Card>
      )}

      {/* Moodboard */}
      {normalized.moodboard_description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-accent" />
              Moodboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">{normalized.moodboard_description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
