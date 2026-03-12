"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, MessageSquare, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { DMScriptsResult } from "@/lib/ai/prompts/dm-scripts";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface DMScriptGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function DMScriptGenerator({ className, initialData }: DMScriptGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<DMScriptsResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = React.useState<"prospection" | "retargeting">("prospection");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setResult(initialData as DMScriptsResult);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adType: "dm_scripts" }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
      }
      const data = await response.json();
      setResult(data.result as DMScriptsResult);
      toast.success("Scripts DM generes !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copié !");
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Generation des scripts DM" className={className} />;
  }

  if (!result) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer les scripts DM
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          3 sequences de prospection + 5 scenarios de retargeting
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab("prospection")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeSubTab === "prospection"
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <Send className="h-4 w-4" />
            Prospection
          </button>
          <button
            onClick={() => setActiveSubTab("retargeting")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeSubTab === "retargeting"
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Retargeting
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          Regenerer
        </Button>
      </div>

      {/* Prospection sequences */}
      {activeSubTab === "prospection" && (
        <div className="space-y-6">
          {(result.prospection || []).map((seq, i) => {
            const seqKey = `seq-${i}`;
            return (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Sequence #{i + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Opener */}
                    <div className="p-3 rounded-lg bg-bg-tertiary">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="cyan">Jour 1 - Opener</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(seq.opener, `${seqKey}-opener`)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedField === `${seqKey}-opener` ? "Copié !" : "Copier"}
                        </Button>
                      </div>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{seq.opener}</p>
                    </div>

                    {/* Follow-up 1 */}
                    <div className="p-3 rounded-lg bg-bg-tertiary">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="blue">J+2 - Follow-up 1</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(seq.follow_up_1, `${seqKey}-fu1`)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedField === `${seqKey}-fu1` ? "Copié !" : "Copier"}
                        </Button>
                      </div>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">
                        {seq.follow_up_1}
                      </p>
                    </div>

                    {/* Follow-up 2 */}
                    <div className="p-3 rounded-lg bg-bg-tertiary">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="purple">J+5 - Follow-up 2</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(seq.follow_up_2, `${seqKey}-fu2`)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedField === `${seqKey}-fu2` ? "Copié !" : "Copier"}
                        </Button>
                      </div>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">
                        {seq.follow_up_2}
                      </p>
                    </div>

                    {/* Closing */}
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="default">J+7 - Closing</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(seq.closing, `${seqKey}-closing`)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedField === `${seqKey}-closing` ? "Copié !" : "Copier"}
                        </Button>
                      </div>
                      <p className="text-sm text-accent whitespace-pre-wrap">{seq.closing}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Retargeting */}
      {activeSubTab === "retargeting" && (
        <div className="space-y-4">
          {(result.retargeting || []).map((item, i) => (
            <GlowCard key={i} glowColor={i % 2 === 0 ? "blue" : "cyan"}>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="muted">Scenario #{i + 1}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(item.message, `retarget-${i}`)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedField === `retarget-${i}` ? "Copié !" : "Copier"}
                </Button>
              </div>
              <p className="text-sm font-medium text-text-primary mb-2">{item.scenario}</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{item.message}</p>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}
