"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AILoading } from "@/components/shared/ai-loading";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { GlowCard } from "@/components/shared/glow-card";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import {
  Sparkles,
  Phone,
  Target,
  Search,
  Flame,
  Eye,
  Gift,
  ShieldAlert,
  Trophy,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";

/* ─── Types ─── */

interface ScriptSection {
  step: number;
  name: string;
  duration: string;
  script: string;
  key_questions?: string[];
  transition?: string;
  mistakes_to_avoid?: string[];
  closer_notes?: string;
  buying_signals?: string[];
}

interface ObjectionResponse {
  objection: string;
  response: string;
  reframe?: string;
}

interface ClosingScriptResult {
  sections: ScriptSection[];
  objections?: ObjectionResponse[];
}

/* ─── Constants ─── */

const CALL_TYPES = [
  { key: "discovery", label: "Découverte" },
  { key: "closing", label: "Closing" },
  { key: "upsell", label: "Upsell" },
] as const;

const DURATIONS = [
  { key: "15", label: "15 min" },
  { key: "30", label: "30 min" },
  { key: "45", label: "45 min" },
  { key: "60", label: "60 min" },
] as const;

const STEP_ICONS = [
  Phone,      // 1. Accroche
  Target,     // 2. Cadrage
  Search,     // 3. Découverte
  Flame,      // 4. Amplification douleur
  Eye,        // 5. Vision
  Gift,       // 6. Présentation offre
  ShieldAlert, // 7. Objections
  Trophy,     // 8. Close
];

const STEP_COLORS: Array<"emerald" | "blue" | "cyan" | "purple" | "orange"> = [
  "emerald",
  "blue",
  "cyan",
  "purple",
  "orange",
  "emerald",
  "blue",
  "purple",
];

/* ─── Component ─── */

interface ClosingScriptGeneratorProps {
  className?: string;
}

export function ClosingScriptGenerator({ className }: ClosingScriptGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ClosingScriptResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);

  // Form state
  const [callType, setCallType] = React.useState("closing");
  const [duration, setDuration] = React.useState("45");
  const [objections, setObjections] = React.useState("");

  // Display state
  const [expandedStep, setExpandedStep] = React.useState<number | null>(0);
  const [showObjections, setShowObjections] = React.useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sales_script",
          scriptType: "closing",
          callType,
          targetDuration: duration,
          mainObjections: objections || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la génération");
      }

      const data = await response.json();
      const raw = data.ai_raw_response || data;
      setResult(raw as ClosingScriptResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // Build copy text for clipboard
  const buildCopyText = (): string => {
    if (!result) return "";
    let text = "SCRIPT DE CLOSING\n\n";

    if (result.sections) {
      result.sections.forEach((s) => {
        text += `--- ÉTAPE ${s.step}: ${s.name} (${s.duration}) ---\n\n`;
        text += `${s.script}\n\n`;
        if (s.key_questions?.length) {
          text += "Questions clés :\n";
          s.key_questions.forEach((q) => (text += `  - ${q}\n`));
          text += "\n";
        }
        if (s.closer_notes) {
          text += `Notes closer : ${s.closer_notes}\n\n`;
        }
        if (s.buying_signals?.length) {
          text += "Signaux d'achat :\n";
          s.buying_signals.forEach((sig) => (text += `  ✓ ${sig}\n`));
          text += "\n";
        }
        if (s.transition) {
          text += `Transition : ${s.transition}\n\n`;
        }
      });
    }

    if (result.objections?.length) {
      text += "\n=== RÉPONSES AUX OBJECTIONS ===\n\n";
      result.objections.forEach((obj, i) => {
        text += `${i + 1}. Objection : « ${obj.objection} »\n`;
        text += `   Réponse : ${obj.response}\n`;
        if (obj.reframe) text += `   Reformulation : ${obj.reframe}\n`;
        text += "\n";
      });
    }

    return text;
  };

  if (usageLimited) {
    return (
      <UpgradeWall
        currentUsage={usageLimited.currentUsage}
        limit={usageLimited.limit}
        className={className}
      />
    );
  }

  if (loading) {
    return (
      <AILoading
        text="Rédaction de ton script de closing"
        variant="immersive"
        className={className}
      />
    );
  }

  /* ─── Form ─── */
  if (!result) {
    return (
      <div className={cn("max-w-xl mx-auto py-8", className)}>
        {error && (
          <p className="text-sm text-danger mb-4 text-center">{error}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Script de Closing
            </CardTitle>
            <CardDescription>
              Génère un script de vente structuré en 8 étapes pour closer tes prospects efficacement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Call type */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Type d&apos;appel
              </label>
              <div className="flex flex-wrap gap-2">
                {CALL_TYPES.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setCallType(type.key)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      callType === type.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target duration */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Durée cible
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDuration(d.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      duration === d.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main objections */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Objections principales{" "}
                <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <textarea
                value={objections}
                onChange={(e) => setObjections(e.target.value)}
                placeholder={`Ex : "C'est trop cher", "Je dois en parler à mon associé", "Je n'ai pas le temps"...`}
                className="w-full rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[90px] resize-none"
              />
              <p className="text-xs text-text-muted mt-1">
                Sépare les objections par des virgules. L&apos;IA les intégrera dans le script.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le script de closing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─── Result display ─── */
  const sections = Array.isArray(result.sections) ? result.sections : [];
  const objectionsList = Array.isArray(result.objections) ? result.objections : [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="flex items-center gap-1.5">
            <Trophy className="h-3 w-3" />
            Script de closing généré
          </Badge>
          <Badge variant="muted" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {duration} min
          </Badge>
          <Badge variant="muted" className="capitalize">
            {CALL_TYPES.find((t) => t.key === callType)?.label || callType}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <CopyExportBar
            copyContent={buildCopyText()}
            pdfTitle="Script de Closing"
            pdfSubtitle="Généré par ScalingFlow"
            pdfContent={buildCopyText()}
            pdfFilename="script-closing-scalingflow.pdf"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResult(null);
              setExpandedStep(0);
              setShowObjections(false);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Nouveau script
          </Button>
        </div>
      </div>

      {/* 8 Steps Accordion */}
      <div className="space-y-3">
        {sections.map((section, i) => {
          const isExpanded = expandedStep === i;
          const StepIcon = STEP_ICONS[i] || Target;
          const glowColor = STEP_COLORS[i % STEP_COLORS.length];

          return (
            <Card key={i} className="overflow-hidden">
              <button
                onClick={() => setExpandedStep(isExpanded ? null : i)}
                className="w-full text-left"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-bold text-accent">
                        {section.step || i + 1}
                      </span>
                      <StepIcon className="h-4 w-4 text-accent shrink-0" />
                      {section.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="muted" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {section.duration}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="space-y-4 pt-0">
                  {/* Script word-for-word */}
                  <GlowCard glowColor={glowColor}>
                    <p className="text-xs text-text-muted uppercase tracking-wide font-medium mb-2 flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Script mot-pour-mot
                    </p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {section.script}
                    </p>
                  </GlowCard>

                  {/* Closer notes */}
                  {section.closer_notes && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
                      <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-amber-400 font-medium uppercase tracking-wide mb-1">
                          Notes pour le closer
                        </p>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">
                          {section.closer_notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Buying signals */}
                  {section.buying_signals && section.buying_signals.length > 0 && (
                    <div>
                      <p className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-wide mb-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                        Signaux d&apos;achat à détecter
                      </p>
                      <div className="space-y-1.5">
                        {section.buying_signals.map((signal, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-2 rounded-lg bg-accent-muted/30 border border-accent/10 px-3 py-2"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                            <p className="text-sm text-text-primary">{signal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key questions */}
                  {section.key_questions && section.key_questions.length > 0 && (
                    <div>
                      <p className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-wide mb-2">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Questions clés
                      </p>
                      <div className="space-y-2">
                        {section.key_questions.map((q, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-2 rounded-lg bg-accent-muted/30 border border-accent/10 px-3 py-2"
                          >
                            <span className="text-accent text-sm mt-0.5 shrink-0">&ldquo;</span>
                            <p className="text-sm text-text-primary italic">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transition */}
                  {section.transition && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-info/8 border border-info/15">
                      <ArrowRight className="h-4 w-4 text-info mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-info font-medium uppercase tracking-wide mb-1">
                          Transition
                        </p>
                        <p className="text-sm text-text-secondary">{section.transition}</p>
                      </div>
                    </div>
                  )}

                  {/* Mistakes to avoid */}
                  {section.mistakes_to_avoid && section.mistakes_to_avoid.length > 0 && (
                    <div>
                      <p className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-wide mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        Erreurs à éviter
                      </p>
                      <div className="space-y-1">
                        {section.mistakes_to_avoid.map((m, j) => (
                          <div key={j} className="flex items-start gap-2 text-sm">
                            <span className="text-warning mt-0.5 shrink-0">&#x2717;</span>
                            <span className="text-text-muted">{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Objections section */}
      {objectionsList.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowObjections(!showObjections)}
            className="w-full text-left"
          >
            <GlowCard glowColor="orange">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-400">
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      Réponses aux objections
                    </h3>
                    <p className="text-xs text-text-muted">
                      {objectionsList.length} objection{objectionsList.length > 1 ? "s" : ""} les plus fréquentes avec réponse
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="muted">
                    {objectionsList.length} réponses
                  </Badge>
                  {showObjections ? (
                    <ChevronUp className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  )}
                </div>
              </div>
            </GlowCard>
          </button>

          {showObjections && (
            <div className="space-y-3 pl-2">
              {objectionsList.map((obj, i) => (
                <Card key={i}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Badge variant="red" className="text-xs flex-shrink-0 mt-0.5">
                        #{i + 1}
                      </Badge>
                      <p className="text-sm font-medium text-text-primary">
                        &laquo; {obj.objection} &raquo;
                      </p>
                    </div>
                    <div className="ml-2 pl-3 border-l-2 border-accent/30 space-y-2">
                      <div>
                        <p className="text-xs text-accent font-medium uppercase tracking-wide mb-1">
                          Réponse
                        </p>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">
                          {obj.response}
                        </p>
                      </div>
                      {obj.reframe && (
                        <div>
                          <p className="text-xs text-purple-400 font-medium uppercase tracking-wide mb-1">
                            Reformulation
                          </p>
                          <p className="text-sm text-text-secondary italic">
                            &laquo; {obj.reframe} &raquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
