"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import {
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import type { SalesLetterResult } from "@/lib/ai/prompts/sales-letter";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface SalesLetterGeneratorProps {
  className?: string;
  initialData?: SalesLetterResult;
}

export function SalesLetterGenerator({ className, initialData }: SalesLetterGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [letter, setLetter] = React.useState<SalesLetterResult | null>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [showFullLetter, setShowFullLetter] = React.useState(false);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

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
        body: JSON.stringify({ type: "sales_letter" }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
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
        text="Redaction de ta sales letter"
        className={className}
      />
    );
  }

  if (!letter) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer la sales letter
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          Page de vente longue, optimisee pour la conversion
        </p>
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
              ? "Masquer la lettre complete"
              : "Voir la lettre complete"}
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
