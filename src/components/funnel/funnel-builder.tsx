"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, FileText, Video, Gift, ChevronRight, FileDown, Code, Pencil, Check, Save, Loader2 } from "lucide-react";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { exportFunnelToHTML, downloadHTML } from "@/lib/utils/export-html";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { GenerateButton } from "@/components/shared/generate-button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface FunnelPage {
  type: "optin" | "vsl" | "thankyou";
  label: string;
  icon: React.ReactNode;
  color: "orange" | "blue" | "cyan";
}

const FUNNEL_PAGES: FunnelPage[] = [
  { type: "optin", label: "Page d'Opt-in", icon: <FileText className="h-5 w-5" />, color: "orange" },
  { type: "vsl", label: "Page VSL", icon: <Video className="h-5 w-5" />, color: "blue" },
  { type: "thankyou", label: "Page de Remerciement", icon: <Gift className="h-5 w-5" />, color: "cyan" },
];

interface FunnelBuilderProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function FunnelBuilder({ className, initialData }: FunnelBuilderProps) {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [funnelData, setFunnelData] = React.useState<any>(null);
  const [activePage, setActivePage] = React.useState<"optin" | "vsl" | "thankyou">("optin");
  const [error, setError] = React.useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [offers, setOffers] = React.useState<any[]>([]);
  const [selectedOfferId, setSelectedOfferId] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Charger les données historiques quand initialData change
  React.useEffect(() => {
    if (initialData) {
      setFunnelData(initialData);
    }
  }, [initialData]);

  React.useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("offers")
          .select("id, offer_name")
          .order("created_at", { ascending: false });
        if (data && data.length > 0) {
          setOffers(data);
          setSelectedOfferId(data[0].id);
        }
      } catch {}
    };
    fetchOffers();
  }, []);

  const handleGenerate = async () => {
    if (!selectedOfferId) {
      setError("Aucune offre disponible. Génère d'abord une offre.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: selectedOfferId }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      if (data.id) setSavedId(data.id);
      setIsDirty(false);
      setFunnelData(data.funnel_data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  const updatePageField = (page: "optin" | "vsl" | "thankyou", field: string, value: string) => {
    if (!funnelData) return;
    const pageKey = page === "optin" ? "optin_page" : page === "vsl" ? "vsl_page" : "thankyou_page";
    setFunnelData({
      ...funnelData,
      [pageKey]: { ...funnelData[pageKey], [field]: value },
    });
    setIsDirty(true);
  };

  const handleSaveEdits = async () => {
    if (!savedId || !user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("funnels")
        .update({
          optin_page: funnelData.optin_page,
          vsl_page: funnelData.vsl_page,
          thankyou_page: funnelData.thankyou_page,
          ai_raw_response: {
            optin_page: funnelData.optin_page,
            vsl_page: funnelData.vsl_page,
            thankyou_page: funnelData.thankyou_page,
          },
        })
        .eq("id", savedId)
        .eq("user_id", user.id);
      if (error) {
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

  if (loading) {
    return <AILoading variant="immersive" text="Création de ton funnel de conversion" className={className} />;
  }

  if (!funnelData) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Générer ton funnel
            </CardTitle>
            <CardDescription>
              L&apos;IA va créer le copywriting complet pour tes 3 pages de funnel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {FUNNEL_PAGES.map((page, i) => (
                <React.Fragment key={page.type}>
                  <Badge variant={page.color === "orange" ? "default" : page.color}>
                    {page.label}
                  </Badge>
                  {i < FUNNEL_PAGES.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  )}
                </React.Fragment>
              ))}
            </div>
            {offers.length > 1 && (
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Offre à utiliser</label>
                <select
                  value={selectedOfferId || ""}
                  onChange={(e) => setSelectedOfferId(e.target.value)}
                  className="w-full rounded-xl border border-border-default bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                >
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>{o.offer_name}</option>
                  ))}
                </select>
              </div>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
            <GenerateButton onClick={handleGenerate} disabled={!selectedOfferId}>
              Générer le funnel complet
            </GenerateButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageData = activePage === "optin"
    ? funnelData.optin_page
    : activePage === "vsl"
    ? funnelData.vsl_page
    : funnelData.thankyou_page;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Tabs */}
      <div className="flex gap-3">
        {FUNNEL_PAGES.map((page) => (
          <button
            key={page.type}
            onClick={() => setActivePage(page.type)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              activePage === page.type
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {page.icon}
            {page.label}
          </button>
        ))}
      </div>

      {/* Edit toggle */}
      <div className="flex items-center justify-end gap-2">
        {isDirty && savedId && (
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveEdits}
            disabled={saving}
            className="bg-gradient-to-r from-accent to-emerald-400 hover:from-accent/90 hover:to-emerald-400/90 text-white shadow-md shadow-accent/20"
          >
            {saving ? (
              <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Sauvegarde...</>
            ) : (
              <><Save className="h-3 w-3 mr-1" /> Sauvegarder</>
            )}
          </Button>
        )}
        <Button
          variant={isEditing ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? (
            <><Check className="h-3 w-3 mr-1" /> Terminer</>
          ) : (
            <><Pencil className="h-3 w-3 mr-1" /> Modifier</>
          )}
        </Button>
      </div>

      {/* Page Content */}
      {activePage === "optin" && pageData && (
        <div className="space-y-4">
          <GlowCard glowColor="orange">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={pageData.headline || ""}
                  onChange={(e) => updatePageField("optin", "headline", e.target.value)}
                  className="w-full bg-transparent text-xl font-bold text-text-primary border-b border-accent/30 pb-1 focus:outline-none"
                />
                <textarea
                  value={pageData.subheadline || ""}
                  onChange={(e) => updatePageField("optin", "subheadline", e.target.value)}
                  className="w-full bg-transparent text-text-secondary resize-none focus:outline-none"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-text-primary mb-2">{pageData.headline}</h3>
                <p className="text-text-secondary">{pageData.subheadline}</p>
              </>
            )}
          </GlowCard>
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium text-text-primary mb-3">Bullet Points</h4>
              <ul className="space-y-2">
                {pageData.bullet_points?.map((bp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent mt-0.5">&#x2714;</span>
                    {bp}
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 rounded-lg bg-accent-muted border border-accent/20">
                <p className="text-sm font-medium text-accent">CTA: {pageData.cta_text}</p>
              </div>
              {pageData.social_proof_text && (
                <p className="mt-3 text-xs text-text-muted italic">{pageData.social_proof_text}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activePage === "vsl" && pageData && (
        <div className="space-y-4">
          <GlowCard glowColor="blue">
            <h3 className="text-xl font-bold text-text-primary mb-2">{pageData.headline}</h3>
            <p className="text-text-secondary">{pageData.intro_text}</p>
          </GlowCard>
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium text-text-primary mb-3">Bénéfices</h4>
              <ul className="space-y-2">
                {pageData.benefit_bullets?.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-info mt-0.5">&#x2714;</span>
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {pageData.faq?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pageData.faq.map((f: { question: string; answer: string }, i: number) => (
                    <div key={i}>
                      <p className="font-medium text-text-primary text-sm">{f.question}</p>
                      <p className="text-text-secondary text-sm mt-1">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activePage === "thankyou" && pageData && (
        <div className="space-y-4">
          <GlowCard glowColor="cyan">
            <h3 className="text-lg font-bold text-text-primary mb-2">{pageData.confirmation_message}</h3>
          </GlowCard>
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium text-text-primary mb-3">Prochaines étapes</h4>
              <ol className="space-y-2">
                {pageData.next_steps?.map((step: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-muted text-accent text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              {pageData.upsell_headline && (
                <div className="mt-6 p-4 rounded-xl bg-bg-tertiary border border-border-default">
                  <p className="font-medium text-info">{pageData.upsell_headline}</p>
                  <p className="text-sm text-text-secondary mt-1">{pageData.upsell_description}</p>
                  <Badge variant="blue" className="mt-2">{pageData.upsell_cta}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToPDF({
            title: "Funnel de Conversion",
            subtitle: "Généré par ScalingFlow",
            content: funnelData,
            filename: "funnel-scalingflow.pdf",
          })}
        >
          <FileDown className="h-4 w-4 mr-1" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const html = exportFunnelToHTML(funnelData);
            downloadHTML(html, "funnel-scalingflow.html");
          }}
        >
          <Code className="h-4 w-4 mr-1" />
          HTML
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFunnelData(null)}>
          Nouveau brief
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setFunnelData(null); handleGenerate(); }}>
          Régénérer
        </Button>
      </div>
    </div>
  );
}
