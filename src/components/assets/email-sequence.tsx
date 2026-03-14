"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { Sparkles, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface EmailSequenceProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function EmailSequence({ className, initialData }: EmailSequenceProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sequence, setSequence] = React.useState<any>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = React.useState<number | null>(0);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  React.useEffect(() => {
    if (initialData) setSequence(initialData);
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email" }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      setSequence(data.ai_raw_response || data);
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
    return <AILoading text="Redaction de ta séquence email" className={className} />;
  }

  if (!sequence) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Générer la séquence email
        </Button>
        <p className="text-sm text-text-secondary mt-2">7 emails de nurturing optimises</p>
      </div>
    );
  }

  const emails = sequence.emails || [];

  const fullEmailText = emails
    .map((e: { day: number; subject: string; body: string; cta_text: string }) =>
      `## Email Jour ${e.day} — ${e.subject}\n\n${e.body}\n\nCTA: ${e.cta_text}`
    )
    .join("\n\n---\n\n");

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-text-primary">
            {sequence.sequence_name || "Sequence Email"}
          </h3>
          <Badge variant="blue">{emails.length} emails</Badge>
        </div>
        <CopyExportBar
          copyContent={fullEmailText}
          pdfTitle={sequence.sequence_name || "Sequence Email"}
          pdfSubtitle={`${emails.length} emails`}
          pdfContent={fullEmailText}
          pdfFilename="sequence-email.pdf"
        />
      </div>

      <div className="relative space-y-3">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border-default" />

        {emails.map((email: {
          day: number;
          subject: string;
          preview_text: string;
          body: string;
          cta_text: string;
          pillar: string;
        }, i: number) => (
          <div key={i} className="relative pl-12">
            <div className={cn(
              "absolute left-3.5 top-4 w-3 h-3 rounded-full border-2",
              expandedEmail === i
                ? "bg-accent border-accent"
                : "bg-bg-tertiary border-border-default"
            )} />

            <Card
              className={cn(
                "cursor-pointer transition-all",
                expandedEmail === i && "border-accent/30"
              )}
              onClick={() => setExpandedEmail(expandedEmail === i ? null : i)}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-info" />
                    <div>
                      <CardTitle className="text-sm">{email.subject}</CardTitle>
                      <p className="text-xs text-text-muted mt-0.5">Jour {email.day}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {email.pillar && <Badge variant="muted" className="text-xs">{email.pillar}</Badge>}
                    {expandedEmail === i ? (
                      <ChevronUp className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedEmail === i && (
                <CardContent className="pt-0">
                  {email.preview_text && (
                    <p className="text-xs text-text-muted italic mb-3">{email.preview_text}</p>
                  )}
                  <div className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
                    {email.body}
                  </div>
                  <div className="p-2 rounded-lg bg-accent-muted border border-accent/20 inline-block">
                    <span className="text-sm font-medium text-accent">{email.cta_text}</span>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
