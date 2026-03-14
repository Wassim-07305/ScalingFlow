"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { Sparkles, MessageSquare, Clock, Link2, ExternalLink } from "lucide-react";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface SmsSequenceProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function SmsSequence({ className, initialData }: SmsSequenceProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sequence, setSequence] = React.useState<any>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
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
        body: JSON.stringify({ type: "sms" }),
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
    return <AILoading text="Redaction de ta séquence SMS" className={className} />;
  }

  if (!sequence) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Générer la séquence SMS
        </Button>
        <p className="text-sm text-text-secondary mt-2">5 SMS de suivi post-inscription</p>
      </div>
    );
  }

  const messages = sequence.messages || [];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-text-primary">Sequence SMS</h3>
          <Badge variant="default">{messages.length} SMS</Badge>
        </div>
        <div className="flex items-center gap-2">
          <CopyExportBar
            copyContent={messages.map((s: { sms_number: number; body: string; delay: string }) => `SMS ${s.sms_number} (${s.delay})\n${s.body}`).join("\n\n---\n\n")}
            pdfTitle="Sequence SMS"
            pdfSubtitle={`${messages.length} SMS`}
            pdfFilename="sequence-sms.pdf"
          />
          <Button variant="outline" size="sm" onClick={() => { setSequence(null); handleGenerate(); }}>
            <Sparkles className="h-4 w-4 mr-1" />
            Régénérer
          </Button>
        </div>
      </div>

      <div className="relative space-y-3">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border-default" />

        {messages.map((sms: {
          sms_number: number;
          delay: string;
          body: string;
          character_count: number;
          cta_url_placeholder: string;
          purpose: string;
        }, i: number) => (
          <div key={i} className="relative pl-12">
            {/* Timeline dot */}
            <div className="absolute left-3.5 top-4 w-3 h-3 rounded-full bg-accent border-2 border-accent" />

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-accent" />
                    SMS {sms.sms_number}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="muted" className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {sms.delay}
                    </Badge>
                    <Badge
                      variant={sms.character_count <= 160 ? "default" : "yellow"}
                      className="text-xs"
                    >
                      {sms.character_count} car.
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Purpose */}
                <p className="text-xs text-text-muted uppercase tracking-wide">
                  {sms.purpose}
                </p>

                {/* SMS body — styled like a phone message bubble */}
                <div className="rounded-2xl rounded-tl-sm bg-accent/12 border border-accent/20 px-4 py-3 max-w-md">
                  <p className="text-sm text-text-primary leading-relaxed">
                    {sms.body}
                  </p>
                </div>

                {/* CTA URL placeholder */}
                {sms.cta_url_placeholder && (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Link2 className="h-3 w-3" />
                    <span className="font-mono">{sms.cta_url_placeholder}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
