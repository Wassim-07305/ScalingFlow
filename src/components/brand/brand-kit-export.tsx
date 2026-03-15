"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileDown, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { BrandIdentityResult } from "@/lib/ai/prompts/brand-identity";

interface BrandKitExportProps {
  brandName: string | null;
  generated: BrandIdentityResult | null;
  className?: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "—";
  return `${r}, ${g}, ${b}`;
}

function buildBrandKitHTML(brandName: string, data: BrandIdentityResult): string {
  const { direction_artistique: dir, brand_kit: kit, logo_concept: logo } = data;
  const primaryColor = dir.palette[0]?.hex || "#34D399";
  const secondaryColor = dir.palette[1]?.hex || "#1C1F23";
  const date = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paletteHTML = dir.palette
    .map(
      (c) => `
      <div class="color-card">
        <div class="color-swatch" style="background:${esc(c.hex)}"></div>
        <div class="color-info">
          <strong>${esc(c.name)}</strong>
          <span class="mono">${esc(c.hex)}</span>
          <span class="mono">RGB ${hexToRgb(c.hex)}</span>
          <span class="usage">${esc(c.usage)}</span>
        </div>
      </div>`
    )
    .join("\n");

  const colorStrip = dir.palette
    .map((c) => `<div class="strip-segment" style="background:${esc(c.hex)}"></div>`)
    .join("");

  const typographyHTML = dir.typographies
    .map(
      (t) => `
      <div class="typo-card">
        <span class="typo-role">${esc(t.role)}</span>
        <p class="typo-name">${esc(t.font_family)}</p>
        <p class="typo-style">${esc(t.style)}</p>
        <p class="typo-sample">Aa Bb Cc Dd Ee Ff Gg 0123456789</p>
      </div>`
    )
    .join("\n");

  const valeursHTML = kit.valeurs
    .map((v) => `<span class="badge">${esc(typeof v === "string" ? v : JSON.stringify(v))}</span>`)
    .join(" ");

  const doHTML = kit.do_list
    .map(
      (item) =>
        `<li class="do-item">${esc(typeof item === "string" ? item : JSON.stringify(item))}</li>`
    )
    .join("\n");

  const dontHTML = kit.dont_list
    .map(
      (item) =>
        `<li class="dont-item">${esc(typeof item === "string" ? item : JSON.stringify(item))}</li>`
    )
    .join("\n");

  const logoSection = logo
    ? `
    <div class="section page-break">
      <h2>Logo &amp; Identité visuelle</h2>
      <div class="logo-grid">
        <div class="logo-detail">
          <h3>Concept</h3>
          <p>${esc(logo.description)}</p>
        </div>
        <div class="logo-detail">
          <h3>Forme</h3>
          <p>${esc(logo.forme)}</p>
        </div>
        <div class="logo-detail">
          <h3>Symbolisme</h3>
          <p>${esc(logo.symbolisme)}</p>
        </div>
      </div>
      ${
        logo.variations.length > 0
          ? `<div class="variations">
        <h3>Déclinaisons</h3>
        <ul>${logo.variations.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>
      </div>`
          : ""
      }
      <div class="spacing-guide">
        <h3>Zone de protection</h3>
        <p>Toujours respecter un espace minimum autour du logo égal à la hauteur de la lettre « ${esc(brandName.charAt(0) || "X")} » du logotype, sur les 4 côtés.</p>
      </div>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kit de Marque — ${esc(brandName)}</title>
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page-break { page-break-before: always; }

  /* ── Cover ── */
  .cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, ${esc(primaryColor)}22 0%, #ffffff 50%, ${esc(secondaryColor)}11 100%);
    text-align: center;
    padding: 80px 40px;
  }
  .cover-brand {
    font-size: 56px;
    font-weight: 800;
    letter-spacing: -1px;
    color: ${esc(primaryColor)};
    margin-bottom: 16px;
  }
  .cover-subtitle {
    font-size: 20px;
    color: #666;
    font-weight: 400;
    margin-bottom: 48px;
  }
  .cover-strip {
    display: flex;
    width: 240px;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 48px;
  }
  .cover-strip > div { flex: 1; }
  .cover-date { font-size: 13px; color: #999; }
  .cover-footer { font-size: 11px; color: #bbb; margin-top: 32px; }

  /* ── Sections ── */
  .section {
    padding: 60px 56px;
  }
  .section h2 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 32px;
    color: ${esc(primaryColor)};
    border-bottom: 3px solid ${esc(primaryColor)};
    padding-bottom: 12px;
    display: inline-block;
  }
  .section h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }
  .section p, .section li {
    font-size: 14px;
    line-height: 1.7;
    color: #444;
  }

  /* ── Colors ── */
  .color-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .color-card {
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    overflow: hidden;
  }
  .color-swatch {
    height: 80px;
  }
  .color-info {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .color-info strong { font-size: 14px; }
  .color-info .mono { font-family: 'Courier New', monospace; font-size: 12px; color: #666; }
  .color-info .usage { font-size: 11px; color: #888; margin-top: 4px; }
  .palette-strip {
    display: flex;
    height: 12px;
    border-radius: 6px;
    overflow: hidden;
  }
  .strip-segment { flex: 1; }

  /* ── Typography ── */
  .typo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  .typo-card {
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 20px;
  }
  .typo-role {
    display: inline-block;
    background: ${esc(primaryColor)}22;
    color: ${esc(primaryColor)};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  .typo-name { font-size: 20px; font-weight: 700; color: #222; }
  .typo-style { font-size: 12px; color: #888; margin-top: 4px; }
  .typo-sample { font-size: 14px; color: #666; margin-top: 12px; letter-spacing: 0.5px; }

  /* ── Mission/Vision ── */
  .mv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 32px;
  }
  .mv-card {
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 24px;
  }
  .mv-card h3 { color: ${esc(primaryColor)}; margin-bottom: 12px; }

  /* ── Values ── */
  .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
  .badge {
    display: inline-block;
    background: ${esc(primaryColor)};
    color: white;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 16px;
    border-radius: 20px;
  }

  /* ── Tone ── */
  .tone-box {
    background: #f9f9f9;
    border-left: 4px solid ${esc(primaryColor)};
    padding: 20px 24px;
    border-radius: 0 12px 12px 0;
    margin-bottom: 32px;
  }

  /* ── Do / Don't ── */
  .rules-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .rules-col { list-style: none; }
  .rules-col h3 { margin-bottom: 12px; }
  .rules-col li {
    padding: 8px 0 8px 28px;
    position: relative;
    border-bottom: 1px solid #f0f0f0;
  }
  .do-item::before {
    content: '\\2713';
    position: absolute;
    left: 0;
    color: ${esc(primaryColor)};
    font-weight: 700;
    font-size: 16px;
  }
  .dont-item::before {
    content: '\\2717';
    position: absolute;
    left: 0;
    color: #ef4444;
    font-weight: 700;
    font-size: 16px;
  }

  /* ── Logo ── */
  .logo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }
  .logo-detail {
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 20px;
  }
  .variations { margin-bottom: 24px; }
  .variations ul { padding-left: 20px; }
  .variations li { padding: 4px 0; }
  .spacing-guide {
    background: #f9f9f9;
    border-radius: 12px;
    padding: 20px 24px;
  }

  /* ── Footer ── */
  .pdf-footer {
    text-align: center;
    padding: 32px;
    font-size: 11px;
    color: #bbb;
    border-top: 1px solid #eee;
  }

  @media print {
    .section { padding: 40px 48px; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover">
    <div class="cover-brand">${esc(brandName)}</div>
    <div class="cover-subtitle">Kit de Marque</div>
    <div class="cover-strip">${colorStrip}</div>
    <div class="cover-date">${esc(date)}</div>
    <div class="cover-footer">Généré par ScalingFlow</div>
  </div>

  <!-- Color Palette -->
  <div class="section page-break">
    <h2>Palette de couleurs</h2>
    <div class="color-grid">
      ${paletteHTML}
    </div>
    <div class="palette-strip">${colorStrip}</div>
  </div>

  <!-- Typography -->
  <div class="section page-break">
    <h2>Typographies</h2>
    <div class="typo-grid">
      ${typographyHTML}
    </div>
    ${
      dir.style_visuel
        ? `<div style="margin-top:32px;">
      <h3>Style visuel</h3>
      <p>${esc(dir.style_visuel)}</p>
    </div>`
        : ""
    }
    ${
      dir.moodboard_description
        ? `<div style="margin-top:20px;">
      <h3>Univers visuel (Moodboard)</h3>
      <p>${esc(dir.moodboard_description)}</p>
    </div>`
        : ""
    }
  </div>

  <!-- Logo -->
  ${logoSection}

  <!-- Brand Kit -->
  <div class="section page-break">
    <h2>Charte éditoriale</h2>

    <div class="mv-grid">
      <div class="mv-card">
        <h3>Mission</h3>
        <p>${esc(kit.mission)}</p>
      </div>
      <div class="mv-card">
        <h3>Vision</h3>
        <p>${esc(kit.vision)}</p>
      </div>
    </div>

    <h3>Valeurs fondamentales</h3>
    <div class="badges">${valeursHTML}</div>

    <h3>Ton de communication</h3>
    <div class="tone-box">
      <p>${esc(kit.ton)}</p>
    </div>

    <div class="rules-grid">
      <div>
        <h3 style="color:${esc(primaryColor)}">À faire</h3>
        <ul class="rules-col">${doHTML}</ul>
      </div>
      <div>
        <h3 style="color:#ef4444">À ne pas faire</h3>
        <ul class="rules-col">${dontHTML}</ul>
      </div>
    </div>
  </div>

  <div class="pdf-footer">
    ${esc(brandName)} — Kit de Marque — ${esc(date)} — Généré par ScalingFlow
  </div>

</body>
</html>`;
}

export function BrandKitExport({ brandName, generated, className }: BrandKitExportProps) {
  const [exporting, setExporting] = React.useState(false);

  const handleExport = () => {
    if (!generated || !brandName) {
      toast.error("Génère d'abord une identité de marque complète");
      return;
    }

    setExporting(true);

    try {
      const html = buildBrandKitHTML(brandName, generated);

      // Open in new window for print-to-PDF
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Autorise les pop-ups pour exporter le PDF");
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to render then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      // Fallback if onload doesn't fire (some browsers)
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {
          // Already printing or window was closed
        }
      }, 1500);

      toast.success("Kit de marque prêt — utilise « Enregistrer en PDF » dans la boîte de dialogue d'impression");
    } catch {
      toast.error("Erreur lors de la génération du kit");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadHTML = () => {
    if (!generated || !brandName) {
      toast.error("Génère d'abord une identité de marque complète");
      return;
    }

    const html = buildBrandKitHTML(brandName, generated);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kit-de-marque-${brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier HTML téléchargé");
  };

  const hasData = generated && brandName;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          Télécharger le Kit de Marque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-secondary">
          Exporte l&apos;ensemble de ton identité de marque dans un document professionnel :
          palette de couleurs, typographies, ton de communication, logo et charte éditoriale.
        </p>

        {!hasData && (
          <p className="text-sm text-text-muted italic">
            Génère d&apos;abord une identité de marque et sélectionne un nom pour activer l&apos;export.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExport}
            disabled={!hasData || exporting}
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Exporter en PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadHTML}
            disabled={!hasData}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Télécharger HTML
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
