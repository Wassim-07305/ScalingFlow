"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Phone, FileText, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SCRIPT_TYPES = [
  { key: "discovery", label: "Appel Découverte", icon: Phone },
  { key: "closing", label: "Script de Closing", icon: FileText },
] as const;

export default function SalesPage() {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [script, setScript] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeType, setActiveType] = React.useState("discovery");
  const [copied, setCopied] = React.useState(false);

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

  return (
    <div>
      <PageHeader
        title="Vente"
        description="Scripts et outils pour closer tes prospects."
      />

      <div className="flex gap-2 mb-6">
        {SCRIPT_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => { setActiveType(type.key); setScript(null); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeType === type.key
                ? "bg-neon-orange text-white shadow-[0_0_20px_rgba(255,107,44,0.3)]"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <type.icon className="h-4 w-4" />
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <AILoading text="Rédaction de ton script de vente" />
      ) : script ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="default">Script généré</Badge>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copié !" : "Copier tout"}
            </Button>
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neon-orange" />
              Générateur de scripts
            </CardTitle>
            <CardDescription>
              L&apos;IA va créer un script de vente adapté à ton offre et ton avatar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-neon-red mb-4">{error}</p>}
            <Button size="lg" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le script
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
