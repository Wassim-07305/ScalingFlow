"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  generateFunnelPageHTML,
  exportFunnelToHTML,
  downloadHTML,
} from "@/lib/utils/export-html";
import type { BrandTheme } from "@/lib/utils/export-html";
import { toast } from "sonner";
import {
  Monitor,
  Smartphone,
  FileText,
  Video,
  Gift,
  Copy,
  Code,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface FunnelPageData {
  headline?: string;
  subheadline?: string;
  bullet_points?: string[];
  cta_text?: string;
  social_proof_text?: string;
  intro_text?: string;
  benefit_bullets?: string[];
  faq?: { question: string; answer: string }[];
  confirmation_message?: string;
  next_steps?: string[];
  upsell_headline?: string;
  upsell_description?: string;
  upsell_cta?: string;
  testimonials?: { name: string; text: string }[];
}

interface FunnelData {
  optin_page?: FunnelPageData;
  vsl_page?: FunnelPageData;
  thankyou_page?: FunnelPageData;
}

type PreviewTab = "optin" | "vsl" | "thankyou";
type ViewMode = "desktop" | "mobile";

const PREVIEW_TABS: {
  key: PreviewTab;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "optin", label: "Opt-in", icon: FileText },
  { key: "vsl", label: "VSL", icon: Video },
  { key: "thankyou", label: "Remerciements", icon: Gift },
];

// ─── Component ──────────────────────────────────────────────

interface FunnelPreviewProps {
  className?: string;
  /** If provided, use this data instead of loading from DB */
  funnelData?: FunnelData | null;
  /** If provided, skip loading brand from DB and use these */
  brandTheme?: BrandTheme;
  /** Brand name for the preview */
  brandName?: string;
}

export function FunnelPreview({
  className,
  funnelData: externalData,
  brandTheme: externalTheme,
  brandName: externalBrandName,
}: FunnelPreviewProps) {
  const { user } = useUser();
  const [internalData, setInternalData] = useState<FunnelData | null>(null);
  const [internalName, setInternalName] = useState<string>("");
  const [loading, setLoading] = useState(!externalData);
  const [activeTab, setActiveTab] = useState<PreviewTab>("optin");
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [brandTheme, setBrandTheme] = useState<BrandTheme>({});

  const funnelData = externalData ?? internalData;
  const funnelName = externalBrandName || internalName || "Mon Funnel";
  const theme = externalTheme ?? brandTheme;

  // Load latest funnel + brand from DB (only when no external data)
  useEffect(() => {
    if (externalData || !user) {
      setLoading(false);
      return;
    }
    const supabase = useMemo(() => createClient(), []);

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch latest funnel
        const { data: funnel } = await supabase
          .from("funnels")
          .select("optin_page, vsl_page, thankyou_page, funnel_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (funnel) {
          setInternalData({
            optin_page: funnel.optin_page,
            vsl_page: funnel.vsl_page,
            thankyou_page: funnel.thankyou_page,
          });
          setInternalName(funnel.funnel_name || "Mon Funnel");
        }

        // Fetch brand identity
        const { data: brand } = await supabase
          .from("brand_identities")
          .select("brand_kit")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (brand?.brand_kit && typeof brand.brand_kit === "object") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const kit = brand.brand_kit as any;
          const newTheme: BrandTheme = {};
          if (Array.isArray(kit.colors) && kit.colors.length > 0) {
            newTheme.accentColor = kit.colors[0];
            if (kit.colors[1]) newTheme.bgColor = kit.colors[1];
          }
          if (kit.font_heading) newTheme.fontHeading = kit.font_heading;
          if (kit.font_body) newTheme.fontBody = kit.font_body;
          if (kit.logo_url) newTheme.logoUrl = kit.logo_url;
          setBrandTheme(newTheme);
        }
      } catch {
        // No funnel found
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, externalData]);

  // Generate HTML for the active page
  const previewHTML = useMemo(() => {
    if (!funnelData) return "";
    return generateFunnelPageHTML(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      funnelData as any,
      activeTab,
      { brandName: funnelName, theme },
    );
  }, [funnelData, activeTab, funnelName, theme]);

  const handleCopyHTML = useCallback(() => {
    if (!previewHTML) return;
    navigator.clipboard.writeText(previewHTML);
    toast.success("HTML copié dans le presse-papiers");
  }, [previewHTML]);

  const handleDownloadHTML = useCallback(() => {
    if (!funnelData) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = exportFunnelToHTML(funnelData as any, funnelName, theme);
    downloadHTML(html, `${funnelName.toLowerCase().replace(/\s+/g, "-")}.html`);
    toast.success("Fichier HTML téléchargé");
  }, [funnelData, funnelName, theme]);

  // ─── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-accent mr-3" />
        <span className="text-text-secondary">
          Chargement de la prévisualisation...
        </span>
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────
  if (!funnelData) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-text-muted mb-4" />
          <p className="text-text-secondary font-medium mb-2">
            Aucun funnel à prévisualiser
          </p>
          <p className="text-text-muted text-sm max-w-md">
            Génère d&apos;abord un funnel depuis l&apos;onglet
            &quot;Générer&quot; pour voir la prévisualisation ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Page tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {PREVIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* View mode switcher + actions */}
        <div className="flex items-center gap-2">
          {/* Brand colors indicator */}
          {theme.accentColor && theme.accentColor !== "#34D399" && (
            <div className="flex items-center gap-1.5 mr-2">
              <div
                className="w-4 h-4 rounded-full border border-white/10"
                style={{ backgroundColor: theme.accentColor }}
                title={`Accent: ${theme.accentColor}`}
              />
              {theme.bgColor && (
                <div
                  className="w-4 h-4 rounded-full border border-white/10"
                  style={{ backgroundColor: theme.bgColor }}
                  title={`Fond: ${theme.bgColor}`}
                />
              )}
            </div>
          )}

          {/* Desktop / Mobile toggle */}
          <div className="flex rounded-lg border border-border-default overflow-hidden">
            <button
              onClick={() => setViewMode("desktop")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "desktop"
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-default",
                viewMode === "mobile"
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>

          {/* Copy HTML */}
          <Button variant="outline" size="sm" onClick={handleCopyHTML}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copier HTML
          </Button>

          {/* Download full HTML */}
          <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Device frame with iframe */}
      <div className="flex justify-center">
        <div
          className={cn(
            "relative rounded-2xl border-2 border-border-default bg-[#0B0E11] overflow-hidden transition-all duration-300",
            viewMode === "desktop" ? "w-full max-w-5xl" : "w-[390px]",
          )}
          style={{
            height: viewMode === "desktop" ? "680px" : "780px",
          }}
        >
          {/* Browser / phone chrome */}
          <div
            className={cn(
              "flex items-center gap-2 px-4 border-b border-border-default bg-[#141719]",
              viewMode === "desktop" ? "h-10" : "h-7 justify-center",
            )}
          >
            {viewMode === "desktop" ? (
              <>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="bg-white/5 rounded-md px-3 py-0.5 text-[10px] text-text-muted text-center truncate">
                    https://{funnelName.toLowerCase().replace(/\s+/g, "-")}
                    .scalingflow.com
                  </div>
                </div>
              </>
            ) : (
              <div className="w-20 h-1 rounded-full bg-white/20" />
            )}
          </div>

          {/* iframe preview */}
          <iframe
            srcDoc={previewHTML}
            className="w-full border-0"
            style={{
              height: viewMode === "desktop" ? "640px" : "753px",
            }}
            title="Prévisualisation du funnel"
            sandbox="allow-scripts"
          />
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>Funnel : {funnelName}</span>
        <div className="flex items-center gap-1.5">
          {theme.accentColor && theme.accentColor !== "#34D399" && (
            <Badge variant="muted">DA de marque appliquée</Badge>
          )}
          {theme.fontHeading && theme.fontHeading !== "Inter" && (
            <Badge variant="muted">{theme.fontHeading}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
