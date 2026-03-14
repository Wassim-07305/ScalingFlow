"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { cn } from "@/lib/utils/cn";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { toast } from "sonner";
import {
  Sparkles,
  Phone,
  Copy,
  FileDown,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Volume2,
  ArrowRight,
} from "lucide-react";

const SCRIPT_STEPS = [
  { key: "opening", number: 1, title: "Ouverture & Accroche", icon: Phone },
  { key: "discovery", number: 2, title: "Découverte des besoins", icon: MessageCircle },
  { key: "reframing", number: 3, title: "Recadrage du problème", icon: Volume2 },
  { key: "solution", number: 4, title: "Présentation de la solution", icon: Sparkles },
  { key: "objections", number: 5, title: "Gestion des objections", icon: ChevronDown },
  { key: "cta", number: 6, title: "CTA / Prochaine étape", icon: ArrowRight },
] as const;

interface ScriptStep {
  title: string;
  objective: string;
  script_lines: string[];
  tonality: string;
  transition: string;
  tips: string[];
}

interface WarmCallResult {
  title: string;
  context: string;
  duration_estimate: string;
  steps: {
    opening: ScriptStep;
    discovery: ScriptStep;
    reframing: ScriptStep;
    solution: ScriptStep;
    objections: ScriptStep;
    cta: ScriptStep;
  };
  key_objections: Array<{
    objection: string;
    response: string;
  }>;
  closing_tips: string[];
}

export function WarmCallScript() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<WarmCallResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [expandedStep, setExpandedStep] = React.useState<string | null>("opening");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sales_script",
          scriptType: "warm_call",
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();

      const parsed = data.ai_raw_response || data;
      if (typeof parsed === "string") {
        try {
          setResult(JSON.parse(parsed));
        } catch {
          setResult({
            title: "Script d'appel tiède",
            context: parsed,
            duration_estimate: "-",
            steps: {
              opening: { title: "Ouverture", objective: "", script_lines: [parsed], tonality: "", transition: "", tips: [] },
              discovery: { title: "Découverte", objective: "", script_lines: [], tonality: "", transition: "", tips: [] },
              reframing: { title: "Recadrage", objective: "", script_lines: [], tonality: "", transition: "", tips: [] },
              solution: { title: "Solution", objective: "", script_lines: [], tonality: "", transition: "", tips: [] },
              objections: { title: "Objections", objective: "", script_lines: [], tonality: "", transition: "", tips: [] },
              cta: { title: "CTA", objective: "", script_lines: [], tonality: "", transition: "", tips: [] },
            },
            key_objections: [],
            closing_tips: [],
          });
        }
      } else {
        setResult(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copié dans le presse-papiers");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <AILoading text="Rédaction de ton script d'appel tiède" />;
  }

  if (result) {
    return (
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default">Script généré</Badge>
            {result.duration_estimate && (
              <Badge variant="muted" className="text-xs">
                {result.duration_estimate}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToPDF({
                  title: "Script Appel Tiède",
                  subtitle: "Généré par ScalingFlow",
                  content: result as unknown as Record<string, unknown>,
                  filename: "script-appel-tiede-scalingflow.pdf",
                })
              }
            >
              <FileDown className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copié !" : "Copier tout"}
            </Button>
          </div>
        </div>

        {/* Contexte */}
        {result.context && (
          <GlowCard glowColor="orange">
            <p className="text-sm text-text-secondary leading-relaxed">{result.context}</p>
          </GlowCard>
        )}

        {/* 6 étapes du script */}
        {SCRIPT_STEPS.map((step) => {
          const stepData = result.steps?.[step.key as keyof typeof result.steps];
          if (!stepData) return null;
          const isExpanded = expandedStep === step.key;
          const StepIcon = step.icon;

          return (
            <Card key={step.key}>
              <CardHeader
                className="cursor-pointer py-3"
                onClick={() => setExpandedStep(isExpanded ? null : step.key)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-3">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-accent/20 text-accent text-xs font-bold">
                      {step.number}
                    </div>
                    <StepIcon className="h-4 w-4 text-accent" />
                    {step.title}
                  </CardTitle>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  )}
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  {/* Objectif */}
                  {stepData.objective && (
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <p className="text-xs text-accent uppercase font-medium mb-1">Objectif</p>
                      <p className="text-sm text-text-secondary">{stepData.objective}</p>
                    </div>
                  )}

                  {/* Phrases du script */}
                  {stepData.script_lines && stepData.script_lines.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-text-muted uppercase">Phrases clés</p>
                      {stepData.script_lines.map((line, i) => (
                        <div key={i} className="p-3 rounded-lg bg-bg-tertiary border-l-2 border-accent">
                          <p className="text-sm text-text-primary italic">&laquo; {line} &raquo;</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tonalite */}
                  {stepData.tonality && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-bg-tertiary">
                      <Volume2 className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-text-muted uppercase mb-0.5">Tonalité</p>
                        <p className="text-sm text-text-secondary">{stepData.tonality}</p>
                      </div>
                    </div>
                  )}

                  {/* Transition */}
                  {stepData.transition && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-bg-tertiary">
                      <ArrowRight className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-text-muted uppercase mb-0.5">Transition</p>
                        <p className="text-sm text-text-secondary italic">&laquo; {stepData.transition} &raquo;</p>
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {stepData.tips && stepData.tips.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted uppercase mb-1.5">Conseils</p>
                      <ul className="space-y-1">
                        {stepData.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-accent">{"\u2192"}</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Objections clés */}
        {result.key_objections && result.key_objections.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-accent" />
                Objections fréquentes et réponses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {result.key_objections.map((obj, i) => (
                <div key={i} className="p-3 rounded-lg bg-bg-tertiary space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="red" className="text-xs shrink-0">Objection</Badge>
                    <p className="text-sm text-text-secondary italic">&laquo; {obj.objection} &raquo;</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="default" className="text-xs shrink-0">Réponse</Badge>
                    <p className="text-sm text-text-primary">&laquo; {obj.response} &raquo;</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tips finaux */}
        {result.closing_tips && result.closing_tips.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Conseils pour réussir
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5">
                {result.closing_tips.map((tip, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-accent">{"\u2192"}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => setResult(null)}>
          Régénérer le script
        </Button>
      </div>
    );
  }

  // Etat initial
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Phone className="h-10 w-10 text-accent mx-auto mb-3" />
        <h3 className="font-semibold text-text-primary mb-1">Script d&apos;Appel Tiede</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          L&apos;IA va créer un script d&apos;appel structuré en 6 étapes : ouverture, découverte, recadrage, solution, objections et CTA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Générateur de script d&apos;appel tiède
          </CardTitle>
          <CardDescription>
            Un script adapté à ton offre pour des appels avec des prospects semi-qualifiés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Button size="lg" onClick={handleGenerate} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Générer le script d&apos;appel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
