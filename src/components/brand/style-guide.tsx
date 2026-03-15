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
                  className="group relative flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-default hover:border-border-hover transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(color.hex);
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-xl border border-white/10 shrink-0 shadow-lg transition-transform duration-200 group-hover:scale-105"
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
                  <span className="absolute top-2 right-2 text-[9px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    Copier
                  </span>
                </div>
              ))}
            </div>

            {/* Color strip preview */}
            <div className="mt-4 flex rounded-2xl overflow-hidden h-10 shadow-lg ring-1 ring-white/5">
              {normalized.palette.map((color, i) => (
                <div
                  key={i}
                  className="flex-1 relative group/strip"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono opacity-0 group-hover/strip:opacity-80 transition-opacity text-white drop-shadow-lg">
                    {color.hex}
                  </span>
                </div>
              ))}
            </div>

            {/* Live preview card */}
            {normalized.palette.length >= 2 && (
              <div className="mt-4 p-4 rounded-xl border border-border-default/50" style={{ backgroundColor: normalized.palette[0]?.hex + "15" }}>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Aperçu en temps réel</p>
                <div className="flex gap-3">
                  <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: normalized.palette[0]?.hex + "20" }}>
                    <p className="text-xs font-semibold" style={{ color: normalized.palette[0]?.hex }}>Titre principal</p>
                    <p className="text-[10px] text-text-muted mt-1">Exemple de texte avec ta palette</p>
                  </div>
                  <div className="px-4 py-2 rounded-lg flex items-center text-xs font-semibold text-white" style={{ backgroundColor: normalized.palette[normalized.palette.length > 1 ? 1 : 0]?.hex }}>
                    Bouton CTA
                  </div>
                </div>
              </div>
            )}
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
                  className="p-5 rounded-xl bg-bg-tertiary border border-border-default"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="muted">{typo.role}</Badge>
                    {typo.style && (
                      <span className="text-xs text-text-muted">{typo.style}</span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-text-primary mb-1">
                    {typo.font_family}
                  </p>
                  <p className="text-2xl text-text-secondary/80 mt-2 leading-tight">
                    Aa Bb Cc Dd Ee
                  </p>
                  <p className="text-sm text-text-secondary/60 mt-1 tracking-wide">
                    0123456789 !@#$%
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-bg-secondary/50 border border-border-default/30">
                    <p className="text-xs text-text-muted">Rendu :</p>
                    <p className="text-base text-text-primary mt-1">
                      Le quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
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
