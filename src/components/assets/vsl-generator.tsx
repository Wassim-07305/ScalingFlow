"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Clock, Play, Pencil, Check } from "lucide-react";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { toast } from "sonner";

const VSL_STYLES = [
  { key: "classique", label: "Classique (problème → solution)" },
  { key: "storytelling", label: "Storytelling" },
  { key: "urgente", label: "Urgente / Scarcity" },
  { key: "educative", label: "Éducative" },
] as const;

const VSL_DURATIONS = [
  { key: "5", label: "~5 min" },
  { key: "10", label: "~10 min" },
  { key: "15", label: "~15 min" },
  { key: "20", label: "~20 min" },
] as const;

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
  const [isEditing, setIsEditing] = React.useState(false);

  // Form state
  const [vslStyle, setVslStyle] = React.useState("classique");
  const [duration, setDuration] = React.useState("15");
  const [keyMessage, setKeyMessage] = React.useState("");

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
        body: JSON.stringify({
          type: "vsl",
          style: vslStyle,
          duration,
          keyMessage: keyMessage || undefined,
        }),
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

  const updateSectionScript = (index: number, value: string) => {
    if (!script) return;
    const updated = { ...script };
    const sections = [...(updated.sections || [])];
    sections[index] = { ...sections[index], script: value };
    updated.sections = sections;
    setScript(updated);
  };

  const updateSectionNotes = (index: number, value: string) => {
    if (!script) return;
    const updated = { ...script };
    const sections = [...(updated.sections || [])];
    sections[index] = { ...sections[index], speaker_notes: value };
    updated.sections = sections;
    setScript(updated);
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Rédaction de ton script VSL" className={className} />;
  }

  if (!script) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-accent" />
              Paramètres du script VSL
            </CardTitle>
            <CardDescription>
              Configure le style et la durée de ton script de vente vidéo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Style */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Style du VSL</label>
              <div className="grid grid-cols-2 gap-2">
                {VSL_STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setVslStyle(s.key)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                      vslStyle === s.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Durée cible</label>
              <div className="flex gap-2">
                {VSL_DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDuration(d.key)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      duration === d.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Key message */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Message clé <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <textarea
                value={keyMessage}
                onChange={(e) => setKeyMessage(e.target.value)}
                placeholder="Le message principal que tu veux faire passer dans ta vidéo..."
                rows={2}
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button size="lg" onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le script VSL
            </Button>
          </CardContent>
        </Card>
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
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (isEditing) toast.success("Modifications sauvegardées");
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? (
              <><Check className="h-3 w-3 mr-1" /> Terminer</>
            ) : (
              <><Pencil className="h-3 w-3 mr-1" /> Modifier</>
            )}
          </Button>
          <CopyExportBar
            copyContent={fullScriptText}
            pdfTitle="Script VSL"
            pdfSubtitle={script.total_duration_estimate || "~15 min"}
            pdfContent={fullScriptText}
            pdfFilename="script-vsl.pdf"
          />
        </div>
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
          {isEditing ? (
            <textarea
              value={sections[activeSection].script}
              onChange={(e) => updateSectionScript(activeSection, e.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-secondary resize-vertical focus:outline-none focus:ring-1 focus:ring-accent min-h-[150px]"
              rows={8}
            />
          ) : (
            <p className="text-text-secondary text-sm whitespace-pre-wrap">{sections[activeSection].script}</p>
          )}
          {(sections[activeSection].speaker_notes || isEditing) && (
            <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted font-medium mb-1">Notes speaker :</p>
              {isEditing ? (
                <textarea
                  value={sections[activeSection].speaker_notes || ""}
                  onChange={(e) => updateSectionNotes(activeSection, e.target.value)}
                  className="w-full bg-transparent text-xs text-text-secondary resize-none focus:outline-none"
                  rows={3}
                  placeholder="Ajoute des notes pour le speaker..."
                />
              ) : (
                <p className="text-xs text-text-secondary">{sections[activeSection].speaker_notes}</p>
              )}
            </div>
          )}
        </GlowCard>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" size="sm" onClick={() => setScript(null)}>
          Nouveau brief
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setScript(null); handleGenerate(); }}>
          Régénérer
        </Button>
      </div>
    </div>
  );
}
