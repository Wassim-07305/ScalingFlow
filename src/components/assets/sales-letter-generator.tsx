"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import type { SalesLetterResult } from "@/lib/ai/prompts/sales-letter";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { GenerateButton } from "@/components/shared/generate-button";

interface SalesLetterGeneratorProps {
  className?: string;
  initialData?: SalesLetterResult;
}

const LETTER_STYLES = ["Longue forme", "Courte", "Urgente", "Storytelling"] as const;

export function SalesLetterGenerator({ className, initialData }: SalesLetterGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [letter, setLetter] = React.useState<SalesLetterResult | null>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [showFullLetter, setShowFullLetter] = React.useState(false);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [letterStyle, setLetterStyle] = React.useState<string>("Longue forme");
  const [keyArgument, setKeyArgument] = React.useState("");

  React.useEffect(() => {
    if (initialData) setLetter(initialData);
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "sales_letter", letterStyle, keyArgument: keyArgument || undefined }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      const raw = data.ai_raw_response || data;
      setLetter(raw as SalesLetterResult);
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
    return (
      <AILoading
        variant="immersive"
        text="Rédaction de ta sales letter"
        className={className}
      />
    );
  }

  if (!letter) {
    return (
      <div className={cn("max-w-xl mx-auto py-8", className)}>
        {error && <p className="text-sm text-danger mb-4 text-center">{error}</p>}
        <Card>
          <CardHeader>
            <CardTitle>Sales Letter</CardTitle>
            <CardDescription>Page de vente optimisée pour la conversion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Letter style */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Style de lettre</label>
              <div className="flex flex-wrap gap-2">
                {LETTER_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setLetterStyle(style)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      letterStyle === style
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Key argument */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Argument clé (optionnel)</label>
              <textarea
                value={keyArgument}
                onChange={(e) => setKeyArgument(e.target.value)}
                placeholder="Ex : Garantie 90 jours satisfait ou remboursé..."
                className="w-full rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[80px] resize-none"
              />
            </div>

            <GenerateButton onClick={handleGenerate} className="w-full" icon={<FileText className="h-4 w-4 mr-2" />}>
              Générer la sales letter
            </GenerateButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = letter.sections || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="blue">
            <FileText className="h-3 w-3 mr-1" />
            {sections.length} sections
          </Badge>
          {letter.estimated_word_count && (
            <Badge variant="muted">~{letter.estimated_word_count} mots</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CopyExportBar
            copyContent={
              `# ${letter.headline}\n${letter.sub_headline ? `\n${letter.sub_headline}\n` : ""}\n` +
              sections.map((s) => `## ${s.name}\n\n${s.content}`).join("\n\n---\n\n") +
              ((letter as SalesLetterResult & { full_letter?: string }).full_letter
                ? `\n\n---\n\n${(letter as SalesLetterResult & { full_letter?: string }).full_letter}`
                : "")
            }
            pdfTitle="Sales Letter"
            pdfSubtitle={letter.headline}
            pdfFilename="sales-letter.pdf"
          />
          <Button variant="outline" size="sm" onClick={() => setLetter(null)}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Nouveau brief
          </Button>
        </div>
      </div>

      {/* Headline & sub-headline */}
      <GlowCard glowColor="blue">
        <h2 className="text-lg font-bold text-text-primary mb-2">
          {letter.headline}
        </h2>
        {letter.sub_headline && (
          <p className="text-sm text-text-secondary">{letter.sub_headline}</p>
        )}
      </GlowCard>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, i) => (
          <SectionCard key={i} name={section.name} content={section.content} />
        ))}
      </div>

      {/* Full letter — expandable */}
      {(letter as SalesLetterResult & { full_letter?: string }).full_letter && (
        <div>
          <button
            onClick={() => setShowFullLetter(!showFullLetter)}
            className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            {showFullLetter
              ? "Masquer la lettre complète"
              : "Voir la lettre complète"}
            {showFullLetter ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showFullLetter && (
            <Card className="mt-3">
              <CardContent className="py-4">
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {(letter as SalesLetterResult & { full_letter?: string }).full_letter}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({ name, content }: { name: string; content: string }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all",
        expanded && "border-accent/30"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-info" />
            <span className="text-sm font-medium text-text-primary">
              {name}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </div>
        {expanded && (
          <p className="text-sm text-text-secondary whitespace-pre-wrap mt-3">
            {content}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
