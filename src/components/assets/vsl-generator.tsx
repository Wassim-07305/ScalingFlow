"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Clock, Play } from "lucide-react";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface VSLGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function VSLGenerator({ className, initialData }: VSLGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [script, setScript] = React.useState<any>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState(0);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  React.useEffect(() => {
    if (initialData) setScript(initialData);
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vsl" }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
      }
      const data = await response.json();
      setScript(data.ai_raw_response || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Redaction de ton script VSL" className={className} />;
  }

  if (!script) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer le script VSL
        </Button>
        <p className="text-sm text-text-secondary mt-2">Script en 7 sections optimisees</p>
      </div>
    );
  }

  const sections = script.sections || [];

  const fullScriptText = sections
    .map((s: { name: string; script: string; speaker_notes?: string }) =>
      `## ${s.name}\n\n${s.script}${s.speaker_notes ? `\n\nNotes: ${s.speaker_notes}` : ""}`
    )
    .join("\n\n---\n\n");

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="blue">
            <Clock className="h-3 w-3 mr-1" />
            {script.total_duration_estimate || "~15 min"}
          </Badge>
          <Badge variant="muted">{sections.length} sections</Badge>
        </div>
        <CopyExportBar
          copyContent={fullScriptText}
          pdfTitle="Script VSL"
          pdfSubtitle={script.total_duration_estimate || "~15 min"}
          pdfContent={fullScriptText}
          pdfFilename="script-vsl.pdf"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((s: { name: string }, i: number) => (
          <button
            key={i}
            onClick={() => setActiveSection(i)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              activeSection === i
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {sections[activeSection] && (
        <GlowCard glowColor="blue">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-accent" />
              <h3 className="font-semibold text-text-primary">{sections[activeSection].name}</h3>
            </div>
            <Badge variant="muted">{sections[activeSection].duration}</Badge>
          </div>
          <p className="text-text-secondary text-sm whitespace-pre-wrap">{sections[activeSection].script}</p>
          {sections[activeSection].speaker_notes && (
            <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted font-medium mb-1">Notes speaker :</p>
              <p className="text-xs text-text-secondary">{sections[activeSection].speaker_notes}</p>
            </div>
          )}
        </GlowCard>
      )}
    </div>
  );
}
