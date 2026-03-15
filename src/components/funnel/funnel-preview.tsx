"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowCard } from "@/components/shared/glow-card";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { exportFunnelToHTML, downloadHTML } from "@/lib/utils/export-html";
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

const PREVIEW_TABS: { key: PreviewTab; label: string; icon: React.ElementType }[] = [
  { key: "optin", label: "Page Optin", icon: FileText },
  { key: "vsl", label: "Page VSL", icon: Video },
  { key: "thankyou", label: "Page Remerciements", icon: Gift },
];

// ─── Component ──────────────────────────────────────────────

interface FunnelPreviewProps {
  className?: string;
}

export function FunnelPreview({ className }: FunnelPreviewProps) {
  const { user } = useUser();
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [funnelName, setFunnelName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PreviewTab>("optin");
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [brandColors, setBrandColors] = useState<string[]>([]);

  // Load latest funnel + brand colors
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch latest funnel
        const { data: funnel } = await supabase
          .from("funnels")
          .select("ai_raw_response, optin_page, vsl_page, thankyou_page, funnel_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (funnel) {
          const parsed = funnel.ai_raw_response || {
            optin_page: funnel.optin_page,
            vsl_page: funnel.vsl_page,
            thankyou_page: funnel.thankyou_page,
          };
          setFunnelData(parsed);
          setFunnelName(funnel.funnel_name || "Mon Funnel");
        }

        // Fetch brand colors from brand_identities
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
          if (Array.isArray(kit.colors) && kit.colors.length > 0) {
            setBrandColors(kit.colors);
          }
        }
      } catch {
        // No funnel found — that's fine
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const accentColor = brandColors[0] || "#34D399";
  const bgColor = brandColors[1] || "#0B0E11";

  const activePageData = useMemo(() => {
    if (!funnelData) return null;
    if (activeTab === "optin") return funnelData.optin_page;
    if (activeTab === "vsl") return funnelData.vsl_page;
    return funnelData.thankyou_page;
  }, [funnelData, activeTab]);

  const copySection = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papiers`);
  };

  const handleDownloadHTML = () => {
    if (!funnelData) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = exportFunnelToHTML(funnelData as any, funnelName);
    downloadHTML(html, `${funnelName.toLowerCase().replace(/\s+/g, "-")}.html`);
    toast.success("Fichier HTML téléchargé");
  };

  // ─── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-accent mr-3" />
        <span className="text-text-secondary">Chargement de la prévisualisation...</span>
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────
  if (!funnelData) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-text-muted mb-4" />
          <p className="text-text-secondary font-medium mb-2">Aucun funnel à prévisualiser</p>
          <p className="text-text-muted text-sm max-w-md">
            Génère d&apos;abord un funnel depuis l&apos;onglet &quot;Générer&quot; pour voir la prévisualisation ici.
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
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
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
          {brandColors.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              {brandColors.slice(0, 3).map((c, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-white/10"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          )}

          <div className="flex rounded-lg border border-border-default overflow-hidden">
            <button
              onClick={() => setViewMode("desktop")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "desktop"
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text-primary"
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
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
            <Code className="h-3.5 w-3.5 mr-1.5" />
            HTML
          </Button>
        </div>
      </div>

      {/* Device frame */}
      <div className="flex justify-center">
        <div
          className={cn(
            "relative rounded-2xl border-2 border-border-default bg-[#0B0E11] overflow-hidden transition-all duration-300",
            viewMode === "desktop"
              ? "w-full max-w-4xl aspect-[16/10]"
              : "w-[375px] aspect-[9/16] rounded-[2rem]"
          )}
        >
          {/* Browser / phone chrome */}
          <div
            className={cn(
              "flex items-center gap-2 px-4 border-b border-border-default",
              viewMode === "desktop" ? "h-9" : "h-7 justify-center"
            )}
            style={{ backgroundColor: bgColor }}
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
                    https://mon-funnel.com
                  </div>
                </div>
              </>
            ) : (
              <div className="w-20 h-1 rounded-full bg-white/20" />
            )}
          </div>

          {/* Page content preview */}
          <div
            className="overflow-y-auto h-full"
            style={{ backgroundColor: bgColor }}
          >
            <div className={cn("mx-auto", viewMode === "desktop" ? "max-w-xl px-8 py-10" : "px-5 py-6")}>
              {/* ─── Optin Preview ─── */}
              {activeTab === "optin" && activePageData && (
                <div className="space-y-5">
                  <div className="text-center space-y-3">
                    <h1
                      className={cn(
                        "font-extrabold leading-tight",
                        viewMode === "desktop" ? "text-2xl" : "text-xl"
                      )}
                      style={{ color: "#F9FAFB" }}
                    >
                      {activePageData.headline}
                    </h1>
                    <p className="text-sm text-[#9CA3AF] leading-relaxed">
                      {activePageData.subheadline}
                    </p>
                    <CopyBtn onClick={() => copySection(
                      `${activePageData.headline}\n${activePageData.subheadline}`,
                      "Titre + sous-titre"
                    )} />
                  </div>

                  {activePageData.bullet_points && activePageData.bullet_points.length > 0 && (
                    <div className="space-y-2.5">
                      {activePageData.bullet_points.map((bp, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <span style={{ color: accentColor }} className="mt-0.5 font-bold">&#x2714;</span>
                          <span className="text-[#D1D5DB]">{bp}</span>
                        </div>
                      ))}
                      <CopyBtn onClick={() => copySection(
                        activePageData.bullet_points!.join("\n"),
                        "Bullet points"
                      )} />
                    </div>
                  )}

                  {activePageData.cta_text && (
                    <div className="text-center pt-2">
                      <div
                        className="inline-block px-8 py-3.5 rounded-xl font-bold text-sm"
                        style={{ backgroundColor: accentColor, color: bgColor }}
                      >
                        {activePageData.cta_text}
                      </div>
                      <CopyBtn onClick={() => copySection(activePageData.cta_text!, "CTA")} />
                    </div>
                  )}

                  {activePageData.social_proof_text && (
                    <p className="text-center text-xs text-[#6B7280] italic pt-2">
                      {activePageData.social_proof_text}
                    </p>
                  )}
                </div>
              )}

              {/* ─── VSL Preview ─── */}
              {activeTab === "vsl" && activePageData && (
                <div className="space-y-5">
                  <div className="text-center space-y-3">
                    <h1
                      className={cn(
                        "font-extrabold leading-tight",
                        viewMode === "desktop" ? "text-2xl" : "text-xl"
                      )}
                      style={{ color: "#F9FAFB" }}
                    >
                      {activePageData.headline}
                    </h1>
                    <p className="text-sm text-[#9CA3AF] leading-relaxed">
                      {activePageData.intro_text}
                    </p>
                    <CopyBtn onClick={() => copySection(
                      `${activePageData.headline}\n${activePageData.intro_text}`,
                      "Titre VSL"
                    )} />
                  </div>

                  {/* Video placeholder */}
                  <div
                    className="rounded-xl border border-white/10 flex items-center justify-center py-12"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  >
                    <Video className="h-8 w-8 text-[#6B7280]" />
                  </div>

                  {activePageData.benefit_bullets && activePageData.benefit_bullets.length > 0 && (
                    <div className="space-y-2.5">
                      {activePageData.benefit_bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <span style={{ color: accentColor }} className="mt-0.5 font-bold">&#x2714;</span>
                          <span className="text-[#D1D5DB]">{b}</span>
                        </div>
                      ))}
                      <CopyBtn onClick={() => copySection(
                        activePageData.benefit_bullets!.join("\n"),
                        "Bénéfices"
                      )} />
                    </div>
                  )}

                  {activePageData.testimonials && activePageData.testimonials.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase tracking-wider text-[#6B7280] font-semibold">
                        Témoignages
                      </h3>
                      {activePageData.testimonials.map((t, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-white/5 p-3.5"
                          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                        >
                          <p className="text-xs text-[#D1D5DB] italic">&quot;{t.text}&quot;</p>
                          <p className="text-[10px] mt-1.5" style={{ color: accentColor }}>
                            — {t.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activePageData.faq && activePageData.faq.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs uppercase tracking-wider text-[#6B7280] font-semibold">
                        FAQ
                      </h3>
                      {activePageData.faq.map((f, i) => (
                        <div key={i} className="border-b border-white/5 pb-3">
                          <p className="text-sm font-medium text-[#F9FAFB]">{f.question}</p>
                          <p className="text-xs text-[#9CA3AF] mt-1">{f.answer}</p>
                        </div>
                      ))}
                      <CopyBtn onClick={() => copySection(
                        activePageData.faq!.map(f => `Q: ${f.question}\nR: ${f.answer}`).join("\n\n"),
                        "FAQ"
                      )} />
                    </div>
                  )}
                </div>
              )}

              {/* ─── Thank you Preview ─── */}
              {activeTab === "thankyou" && activePageData && (
                <div className="space-y-5">
                  <div className="text-center space-y-3">
                    <div
                      className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      <Gift className="h-7 w-7" style={{ color: accentColor }} />
                    </div>
                    <h1
                      className={cn(
                        "font-extrabold leading-tight",
                        viewMode === "desktop" ? "text-2xl" : "text-xl"
                      )}
                      style={{ color: "#F9FAFB" }}
                    >
                      {activePageData.confirmation_message}
                    </h1>
                    <CopyBtn onClick={() => copySection(
                      activePageData.confirmation_message || "",
                      "Message de confirmation"
                    )} />
                  </div>

                  {activePageData.next_steps && activePageData.next_steps.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase tracking-wider text-[#6B7280] font-semibold">
                        Prochaines étapes
                      </h3>
                      {activePageData.next_steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-sm text-[#D1D5DB] pt-0.5">{step}</p>
                        </div>
                      ))}
                      <CopyBtn onClick={() => copySection(
                        activePageData.next_steps!.join("\n"),
                        "Prochaines étapes"
                      )} />
                    </div>
                  )}

                  {activePageData.upsell_headline && (
                    <div
                      className="rounded-xl border border-white/10 p-5 text-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      <p className="font-semibold text-sm" style={{ color: accentColor }}>
                        {activePageData.upsell_headline}
                      </p>
                      {activePageData.upsell_description && (
                        <p className="text-xs text-[#9CA3AF] mt-1.5">
                          {activePageData.upsell_description}
                        </p>
                      )}
                      {activePageData.upsell_cta && (
                        <div
                          className="inline-block mt-3 px-5 py-2 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: accentColor, color: bgColor }}
                        >
                          {activePageData.upsell_cta}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>Funnel : {funnelName}</span>
        <div className="flex items-center gap-1.5">
          {brandColors.length > 0 && (
            <Badge variant="muted">Couleurs de marque appliquées</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small copy button ──────────────────────────────────────

function CopyBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-accent transition-colors mt-1"
    >
      <Copy className="h-3 w-3" />
      Copier
    </button>
  );
}
