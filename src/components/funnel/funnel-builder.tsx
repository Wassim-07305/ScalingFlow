"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, FileText, Video, Gift, ChevronRight } from "lucide-react";

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
}

export function FunnelBuilder({ className }: FunnelBuilderProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [funnelData, setFunnelData] = React.useState<any>(null);
  const [activePage, setActivePage] = React.useState<"optin" | "vsl" | "thankyou">("optin");
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();
      setFunnelData(data.ai_raw_response || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AILoading text="Création de ton funnel de conversion" className={className} />;
  }

  if (!funnelData) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neon-orange" />
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
            {error && <p className="text-sm text-neon-red">{error}</p>}
            <Button size="lg" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le funnel complet
            </Button>
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
                ? "bg-neon-orange text-white shadow-[0_0_20px_rgba(255,107,44,0.3)]"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {page.icon}
            {page.label}
          </button>
        ))}
      </div>

      {/* Page Content */}
      {activePage === "optin" && pageData && (
        <div className="space-y-4">
          <GlowCard glowColor="orange">
            <h3 className="text-xl font-bold text-text-primary mb-2">{pageData.headline}</h3>
            <p className="text-text-secondary">{pageData.subheadline}</p>
          </GlowCard>
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium text-text-primary mb-3">Bullet Points</h4>
              <ul className="space-y-2">
                {pageData.bullet_points?.map((bp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-neon-orange mt-0.5">&#x2714;</span>
                    {bp}
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                <p className="text-sm font-medium text-neon-orange">CTA: {pageData.cta_text}</p>
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
                    <span className="text-neon-blue mt-0.5">&#x2714;</span>
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
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/15 text-neon-cyan text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              {pageData.upsell_headline && (
                <div className="mt-6 p-4 rounded-xl bg-bg-tertiary border border-border-default">
                  <p className="font-medium text-neon-blue">{pageData.upsell_headline}</p>
                  <p className="text-sm text-text-secondary mt-1">{pageData.upsell_description}</p>
                  <Badge variant="blue" className="mt-2">{pageData.upsell_cta}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => { setFunnelData(null); handleGenerate(); }}>
          Régénérer
        </Button>
      </div>
    </div>
  );
}
