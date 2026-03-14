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
  GitBranch,
  Copy,
  FileDown,
  ArrowDown,
  Clock,
  Target,
  DollarSign,
  TrendingUp,
  Users,
  Mail,
  Phone,
  MessageSquare,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  email: Mail,
  cold_email: Mail,
  phone: Phone,
  cold_calling: Phone,
  dm: MessageSquare,
  messenger: MessageSquare,
  instagram: MessageSquare,
};

interface WorkflowStep {
  step_number: number;
  action: string;
  channel: string;
  timing: string;
  description: string;
  template: string;
  expected_conversion: string;
}

interface WorkflowResult {
  title: string;
  overview: string;
  target_persona: string;
  steps: WorkflowStep[];
  summary: {
    total_steps: number;
    total_duration: string;
    expected_leads_per_month: string;
    cost_per_lead: string;
    time_investment_per_week: string;
    expected_conversion_rate: string;
  };
  automation_tips: string[];
  tools_recommended: string[];
  kpis_to_track: string[];
}

export function OutboundWorkflow() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<WorkflowResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [expandedStep, setExpandedStep] = React.useState<number | null>(0);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sales_script",
          scriptType: "outbound_workflow",
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
            title: "Workflow Outbound",
            overview: parsed,
            target_persona: "",
            steps: [],
            summary: {
              total_steps: 0,
              total_duration: "-",
              expected_leads_per_month: "-",
              cost_per_lead: "-",
              time_investment_per_week: "-",
              expected_conversion_rate: "-",
            },
            automation_tips: [],
            tools_recommended: [],
            kpis_to_track: [],
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

  const getChannelIcon = (channel: string): React.ElementType => {
    const key = channel.toLowerCase().replace(/\s/g, "_");
    return CHANNEL_ICONS[key] || Zap;
  };

  if (loading) {
    return <AILoading text="Création de ton workflow outbound" />;
  }

  if (result) {
    return (
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Badge variant="default">Workflow généré</Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToPDF({
                  title: "Workflow Outbound",
                  subtitle: "Généré par ScalingFlow",
                  content: result as unknown as Record<string, unknown>,
                  filename: "workflow-outbound-scalingflow.pdf",
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

        {/* Apercu */}
        {result.overview && (
          <GlowCard glowColor="blue">
            <p className="text-sm text-text-secondary leading-relaxed">{result.overview}</p>
          </GlowCard>
        )}

        {/* Cible */}
        {result.target_persona && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-tertiary">
            <Users className="h-4 w-4 text-accent shrink-0" />
            <span className="text-sm text-text-secondary">
              Cible : <span className="text-text-primary font-medium">{result.target_persona}</span>
            </span>
          </div>
        )}

        {/* Étapes du workflow */}
        {result.steps && result.steps.length > 0 && (
          <div className="space-y-1">
            {result.steps.map((step, i) => {
              const isExpanded = expandedStep === i;
              const ChannelIcon = getChannelIcon(step.channel);
              const isLast = i === result.steps.length - 1;

              return (
                <div key={i}>
                  <Card
                    className={cn(
                      "relative",
                      isExpanded && "border-accent/30"
                    )}
                  >
                    <CardHeader
                      className="cursor-pointer py-3"
                      onClick={() => setExpandedStep(isExpanded ? null : i)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent/20 text-accent text-xs font-bold">
                            {step.step_number}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-text-primary">{step.action}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="cyan" className="text-xs">
                                <ChannelIcon className="h-3 w-3 mr-1" />
                                {step.channel}
                              </Badge>
                              <Badge variant="muted" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {step.timing}
                              </Badge>
                              {step.expected_conversion && (
                                <Badge variant="default" className="text-xs">
                                  {step.expected_conversion}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardTitle>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-text-muted" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-text-muted" />
                        )}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="pt-0 space-y-3">
                        {step.description && (
                          <div className="p-3 rounded-lg bg-bg-tertiary">
                            <p className="text-xs text-text-muted uppercase mb-1">Description</p>
                            <p className="text-sm text-text-secondary">{step.description}</p>
                          </div>
                        )}

                        {step.template && (
                          <div className="relative p-4 rounded-lg bg-bg-tertiary border-l-2 border-accent">
                            <p className="text-xs text-accent uppercase font-medium mb-2">Template / Script</p>
                            <p className="text-sm text-text-primary whitespace-pre-wrap pr-8">
                              {step.template}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(step.template);
                                toast.success("Template copié");
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-md bg-bg-secondary hover:bg-accent/20 transition-colors"
                              title="Copier le template"
                            >
                              <Copy className="h-3.5 w-3.5 text-text-muted" />
                            </button>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>

                  {/* Flèche entre les étapes */}
                  {!isLast && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-accent/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Résumé / KPIs */}
        {result.summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xs text-text-muted uppercase">Leads / mois</p>
                <p className="text-lg font-bold text-text-primary">{result.summary.expected_leads_per_month}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xs text-text-muted uppercase">Coût par lead</p>
                <p className="text-lg font-bold text-text-primary">{result.summary.cost_per_lead}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xs text-text-muted uppercase">Temps / semaine</p>
                <p className="text-lg font-bold text-text-primary">{result.summary.time_investment_per_week}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {result.summary?.expected_conversion_rate && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="text-sm text-text-secondary">
              Taux de conversion attendu : <span className="text-accent font-bold">{result.summary.expected_conversion_rate}</span>
            </span>
          </div>
        )}

        {/* Outils et automatisation */}
        <div className="grid gap-4 md:grid-cols-2">
          {result.automation_tips && result.automation_tips.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Automatisation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5">
                  {result.automation_tips.map((tip, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                      <span className="text-accent">{"\u2192"}</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.tools_recommended && result.tools_recommended.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Outils recommandés
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {result.tools_recommended.map((tool, i) => (
                    <Badge key={i} variant="muted" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* KPIs à suivre */}
        {result.kpis_to_track && result.kpis_to_track.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                KPIs à suivre
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-2 md:grid-cols-2">
                {result.kpis_to_track.map((kpi, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <span className="text-xs text-text-secondary">{kpi}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => setResult(null)}>
          Régénérer le workflow
        </Button>
      </div>
    );
  }

  // Etat initial
  return (
    <div className="space-y-6">
      <div className="text-center">
        <GitBranch className="h-10 w-10 text-accent mx-auto mb-3" />
        <h3 className="font-semibold text-text-primary mb-1">Workflow Outbound</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          L&apos;IA va créer un workflow complet de prospection outbound multi-canal avec templates, timings et KPIs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Générateur de workflow outbound
          </CardTitle>
          <CardDescription>
            Un processus structuré pour générer des leads de façon systématique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Button size="lg" onClick={handleGenerate} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Générer le workflow
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
