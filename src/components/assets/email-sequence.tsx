"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { Sparkles, Mail, ChevronDown, ChevronUp } from "lucide-react";

interface EmailSequenceProps {
  className?: string;
}

export function EmailSequence({ className }: EmailSequenceProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sequence, setSequence] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = React.useState<number | null>(0);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email" }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();
      setSequence(data.ai_raw_response || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AILoading text="Rédaction de ta séquence email" className={className} />;
  }

  if (!sequence) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-neon-red mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Générer la séquence email
        </Button>
        <p className="text-sm text-text-secondary mt-2">7 emails de nurturing optimisés</p>
      </div>
    );
  }

  const emails = sequence.emails || [];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-text-primary">
          {sequence.sequence_name || "Séquence Email"}
        </h3>
        <Badge variant="blue">{emails.length} emails</Badge>
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
                ? "bg-neon-orange border-neon-orange"
                : "bg-bg-tertiary border-border-default"
            )} />

            <Card
              className={cn(
                "cursor-pointer transition-all",
                expandedEmail === i && "border-neon-orange/30"
              )}
              onClick={() => setExpandedEmail(expandedEmail === i ? null : i)}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-neon-blue" />
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
                  <div className="p-2 rounded-lg bg-neon-orange/10 border border-neon-orange/20 inline-block">
                    <span className="text-sm font-medium text-neon-orange">{email.cta_text}</span>
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
