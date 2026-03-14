"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { Sparkles, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface SmsSequenceGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function SmsSequenceGenerator({ className, initialData }: SmsSequenceGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sequence, setSequence] = React.useState<any>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedSms, setExpandedSms] = React.useState<number | null>(0);

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
    return <AILoading text="Rédaction de ta séquence SMS" className={className} />;
  }

  if (!sequence) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Générer la séquence SMS
        </Button>
        <p className="text-sm text-text-secondary mt-2">5 SMS de nurturing optimises</p>
      </div>
    );
  }

  const smsMessages = sequence.sms_messages || [];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-text-primary">
          {sequence.sequence_name || "Sequence SMS"}
        </h3>
        <Badge variant="blue">{smsMessages.length} SMS</Badge>
      </div>

      <div className="relative space-y-3">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border-default" />

        {smsMessages.map((sms: {
          day: number;
          message: string;
          cta_link: string;
          purpose: string;
        }, i: number) => (
          <div key={i} className="relative pl-12">
            <div className={cn(
              "absolute left-3.5 top-4 w-3 h-3 rounded-full border-2",
              expandedSms === i
                ? "bg-accent border-accent"
                : "bg-bg-tertiary border-border-default"
            )} />

            <Card
              className={cn(
                "cursor-pointer transition-all",
                expandedSms === i && "border-accent/30"
              )}
              onClick={() => setExpandedSms(expandedSms === i ? null : i)}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-accent" />
                    <div>
                      <CardTitle className="text-sm">SMS #{i + 1}</CardTitle>
                      <p className="text-xs text-text-muted mt-0.5">Jour {sms.day}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sms.purpose && <Badge variant="muted" className="text-xs">{sms.purpose}</Badge>}
                    {expandedSms === i ? (
                      <ChevronUp className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedSms === i && (
                <CardContent className="pt-0">
                  <div className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
                    {sms.message}
                  </div>
                  {sms.cta_link && (
                    <div className="p-2 rounded-lg bg-accent-muted border border-accent/20 inline-block">
                      <span className="text-sm font-medium text-accent">{sms.cta_link}</span>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
