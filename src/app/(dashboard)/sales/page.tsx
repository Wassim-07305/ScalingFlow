"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { GenerationHistory } from "@/components/shared/generation-history";
import {
  Sparkles,
  Phone,
  FileText,
  Copy,
  History,
  FileDown,
  Clock,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import { SalesMetrics } from "@/components/sales/sales-metrics";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SalesScript = Record<string, any>;

const TABS = [
  { key: "discovery", label: "Appel Découverte", icon: Phone },
  { key: "closing", label: "Script de Closing", icon: FileText },
  { key: "metrics", label: "Métriques", icon: BarChart3 },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function SalesPage() {
  const [loading, setLoading] = React.useState(false);
  const [script, setScript] = React.useState<SalesScript | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("discovery");
  const [copied, setCopied] = React.useState(false);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  const activeType = activeTab === "history" ? "discovery" : activeTab;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "sales_script", scriptType: activeType }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      setScript(data.ai_raw_response || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    const text = typeof script === "string" ? script : JSON.stringify(script, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHistorySelect = async (item: { id: string }) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sales_assets")
        .select("asset_type, ai_raw_response, content, metadata")
        .eq("id", item.id)
        .single();

      if (error || !data) {
        toast.error("Impossible de charger ce script");
        return;
      }

      // Parse le contenu — ai_raw_response est déjà JSON, content peut être stringify
      let parsed = data.ai_raw_response;
      if (!parsed && data.content) {
        try {
          parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content;
        } catch {
          parsed = null;
        }
      }

      if (!parsed) {
        toast.error("Contenu du script introuvable");
        return;
      }

      // Déterminer l'onglet cible depuis les metadata
      const metadata = data.metadata as { scriptType?: string } | null;
      const scriptType = metadata?.scriptType;
      if (scriptType === "discovery" || scriptType === "closing") {
        setActiveTab(scriptType);
      } else {
        setActiveTab("discovery");
      }

      setScript(parsed);
      toast.success("Script chargé depuis l'historique");
    } catch {
      toast.error("Erreur lors du chargement");
    }
  };

  const renderGenerator = () => {
    if (usageLimited) {
      return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} />;
    }

    if (loading) {
      return <AILoading text="Rédaction de ton script de vente" />;
    }

    if (script) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="default">Script généré</Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToPDF({
                  title: activeType === "discovery" ? "Script Appel Découverte" : "Script de Closing",
                  subtitle: "Généré par ScalingFlow",
                  content: script,
                  filename: `script-${activeType}-scalingflow.pdf`,
                })}
              >
                <FileDown className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="h-4 w-4 mr-1" />
                {copied ? "Copié !" : "Copier tout"}
              </Button>
            </div>
          </div>
          <SalesScriptView script={script} />
          <Button variant="outline" onClick={() => { setScript(null); handleGenerate(); }}>
            Régénérer
          </Button>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Générateur de scripts
          </CardTitle>
          <CardDescription>
            L&apos;IA va créer un script de vente adapté à ton offre et ton avatar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Button size="lg" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer le script
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader
        title="Vente"
        description="Scripts et outils pour closer tes prospects."
      />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key !== "history") {
                setScript(null);
              }
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "metrics" ? (
        <SalesMetrics />
      ) : activeTab === "history" ? (
        <GenerationHistory
          table="sales_assets"
          titleField="title"
          subtitleField="asset_type"
          statusField="status"
          filters={{ asset_type: "sales_script" }}
          emptyMessage="Aucun script de vente généré pour le moment."
          onSelect={handleHistorySelect}
        />
      ) : (
        renderGenerator()
      )}
    </div>
  );
}

/* ─── Structured Sales Script Renderer ─── */

interface ScriptSection {
  step: number;
  name: string;
  duration: string;
  script: string;
  key_questions?: string[];
  transition?: string;
  mistakes_to_avoid?: string[];
}

function SalesScriptView({ script }: { script: SalesScript }) {
  const [expandedStep, setExpandedStep] = React.useState<number | null>(0);

  // Handle both { sections: [...] } and raw array formats
  const sections: ScriptSection[] | null = Array.isArray(script?.sections)
    ? script.sections
    : Array.isArray(script)
      ? script
      : null;

  // Fallback to raw display if structure is unexpected
  if (!sections) {
    return (
      <GlowCard glowColor="orange">
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="text-text-secondary text-sm whitespace-pre-wrap font-sans">
            {typeof script === "string" ? script : JSON.stringify(script, null, 2)}
          </pre>
        </div>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const isExpanded = expandedStep === i;
        return (
          <Card key={i}>
            <button
              onClick={() => setExpandedStep(isExpanded ? null : i)}
              className="w-full text-left"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
                      {section.step || i + 1}
                    </span>
                    {section.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="muted" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {section.duration}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </button>

            {isExpanded && (
              <CardContent className="space-y-4 pt-0">
                {/* Script text */}
                <div className="rounded-xl bg-bg-tertiary border border-border-default p-4">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {section.script}
                  </p>
                </div>

                {/* Key questions */}
                {section.key_questions && section.key_questions.length > 0 && (
                  <div>
                    <p className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-wide mb-2">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Questions clés
                    </p>
                    <div className="space-y-2">
                      {section.key_questions.map((q, j) => (
                        <div
                          key={j}
                          className="flex items-start gap-2 rounded-lg bg-accent-muted/30 border border-accent/10 px-3 py-2"
                        >
                          <span className="text-accent text-sm mt-0.5 shrink-0">&ldquo;</span>
                          <p className="text-sm text-text-primary italic">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transition */}
                {section.transition && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-info/8 border border-info/15">
                    <ArrowRight className="h-4 w-4 text-info mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-info font-medium uppercase tracking-wide mb-1">
                        Transition
                      </p>
                      <p className="text-sm text-text-secondary">{section.transition}</p>
                    </div>
                  </div>
                )}

                {/* Mistakes to avoid */}
                {section.mistakes_to_avoid && section.mistakes_to_avoid.length > 0 && (
                  <div>
                    <p className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-wide mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      Erreurs à éviter
                    </p>
                    <div className="space-y-1">
                      {section.mistakes_to_avoid.map((m, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-warning mt-0.5 shrink-0">&#x2717;</span>
                          <span className="text-text-muted">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
