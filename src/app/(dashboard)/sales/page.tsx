"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { GenerationHistory } from "@/components/shared/generation-history";
import { Sparkles, Phone, FileText, Copy, History, FileDown } from "lucide-react";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const TABS = [
  { key: "discovery", label: "Appel Découverte", icon: Phone },
  { key: "closing", label: "Script de Closing", icon: FileText },
  { key: "history", label: "Historique", icon: History },
] as const;

export default function SalesPage() {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [script, setScript] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("discovery");
  const [copied, setCopied] = React.useState(false);

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

      if (!response.ok) throw new Error("Erreur lors de la génération");
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

      // Parse le contenu — ai_raw_response est deja JSON, content peut etre stringify
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

      // Determiner l'onglet cible depuis les metadata
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
                  title: activeType === "discovery" ? "Script Appel Decouverte" : "Script de Closing",
                  subtitle: "Genere par ScalingFlow",
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
          <GlowCard glowColor="orange">
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="text-text-secondary text-sm whitespace-pre-wrap font-sans">
                {typeof script === "string" ? script : JSON.stringify(script, null, 2)}
              </pre>
            </div>
          </GlowCard>
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

      {activeTab === "history" ? (
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
