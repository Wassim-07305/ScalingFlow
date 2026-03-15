"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  Sparkles,
  Settings,
  Bot,
  Wrench,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DeliveryPhase {
  name: string;
  duration: string;
  description: string;
  deliverables: string[];
  tools: string[];
  automation_level: string;
  ai_agents: string[];
}

interface TechTool {
  tool: string;
  purpose: string;
  category: string;
}

interface AIAgent {
  name: string;
  role: string;
  trigger: string;
  output: string;
}

interface KPI {
  metric: string;
  target: string;
  frequency: string;
}

interface ModelOption {
  inclus: string[];
  implication_client: string;
  prix_relatif: string;
  scalabilite: string;
}

interface Pilier {
  pillar_name: string;
  agents_ia: string[];
  personnes: string[];
  process: string[];
  outils: string[];
  automations: string[];
  kpi: string;
}

interface DeliveryResult {
  delivery_name: string;
  overview: string;
  recommended_model?: string;
  model_comparison?: {
    dfy: ModelOption;
    dwy: ModelOption;
    diy: ModelOption;
  };
  piliers?: Pilier[];
  phases: DeliveryPhase[];
  tech_stack: TechTool[];
  ai_agents: AIAgent[];
  sops: {
    name: string;
    frequency: string;
    steps: string[];
    owner: string;
  }[];
  kpis: KPI[];
  scalability_score: number;
  automation_percentage: number;
  bottlenecks: string[];
  recommendations: string[];
}

interface DeliveryDesignerProps {
  offerId?: string;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function DeliveryDesigner({ offerId, className, initialData }: DeliveryDesignerProps) {
  const [loading, setLoading] = React.useState(false);
  const [delivery, setDelivery] = React.useState<DeliveryResult | null>(initialData || null);
  const [expandedPhase, setExpandedPhase] = React.useState<number | null>(0);

  React.useEffect(() => {
    if (initialData) setDelivery(initialData);
  }, [initialData]);

  const handleGenerate = async () => {
    if (!offerId) {
      toast.error("Génère d'abord une offre");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();
      setDelivery(data.delivery_data || data);
      toast.success("Structure de delivery générée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AILoading text="Design de ton système de delivery" className={className} />;
  }

  if (!delivery) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Settings className="h-12 w-12 text-text-muted mx-auto mb-4" />
        <h3 className="font-semibold text-text-primary mb-2">Structure de Delivery</h3>
        <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
          L&apos;IA conçoit ton système de livraison complet : phases, agents IA, automatisations, SOPs et KPIs.
        </p>
        <Button size="lg" onClick={handleGenerate} disabled={!offerId}>
          <Sparkles className="h-4 w-4 mr-2" />
          Designer le delivery
        </Button>
        {!offerId && (
          <p className="text-xs text-text-muted mt-2">Génère d&apos;abord une offre</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text-primary text-lg">{delivery.delivery_name}</h3>
          <p className="text-sm text-text-secondary mt-1">{delivery.overview}</p>
        </div>
        <Button variant="outline" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-1" />
          Régénérer
        </Button>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xs text-text-muted">Scalabilité</p>
            <p className="text-2xl font-bold text-accent">{delivery.scalability_score}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xs text-text-muted">Automatisation</p>
            <p className="text-2xl font-bold text-blue-400">{delivery.automation_percentage}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xs text-text-muted">Phases</p>
            <p className="text-2xl font-bold text-text-primary">{delivery.phases.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* DFY / DWY / DIY Model Comparison */}
      {delivery.model_comparison && (
        <div>
          <h4 className="font-medium text-text-primary flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-accent" />
            Modèle de delivery
            {delivery.recommended_model && (
              <Badge variant="default">{delivery.recommended_model} recommandé</Badge>
            )}
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            {(["dfy", "dwy", "diy"] as const).map((key) => {
              const model = delivery.model_comparison![key];
              const isRecommended = delivery.recommended_model?.toLowerCase() === key;
              const labels = { dfy: "Done For You", dwy: "Done With You", diy: "Do It Yourself" };
              return (
                <Card key={key} className={cn(isRecommended && "border-accent/50")}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {labels[key]}
                      {isRecommended && <Badge variant="default" className="text-xs">Recommandé</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="text-xs">
                      <span className="text-text-muted">Implication client : </span>
                      <span className="text-text-secondary">{model.implication_client}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-text-muted">Prix : </span>
                      <span className="text-text-secondary">{model.prix_relatif}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-text-muted">Scalabilité : </span>
                      <span className="text-text-secondary">{model.scalabilite}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.inclus.map((item, i) => (
                        <Badge key={i} variant="muted" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 9 Piliers Business */}
      {delivery.piliers && delivery.piliers.length > 0 && (
        <div>
          <h4 className="font-medium text-text-primary flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-accent" />
            9 Piliers Business
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            {delivery.piliers.map((pilier, i) => (
              <Card key={i}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">{pilier.pillar_name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {pilier.agents_ia.length > 0 && pilier.agents_ia[0] && (
                    <div className="text-xs">
                      <span className="text-text-muted block mb-1">Agents IA</span>
                      <div className="flex flex-wrap gap-1">
                        {pilier.agents_ia.map((a, j) => (
                          <Badge key={j} variant="blue" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="text-text-muted">KPI : </span>
                    <span className="text-accent font-medium">{pilier.kpi}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Phases */}
      <div className="space-y-3">
        <h4 className="font-medium text-text-primary flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          Phases de delivery
        </h4>
        {delivery.phases.map((phase, i) => (
          <Card key={i}>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => setExpandedPhase(expandedPhase === i ? null : i)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="muted">{phase.duration}</Badge>
                  {phase.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    phase.automation_level === "Full auto" ? "default" :
                    phase.automation_level === "Semi-auto" ? "blue" : "yellow"
                  } className="text-xs">
                    {phase.automation_level}
                  </Badge>
                  {expandedPhase === i ? (
                    <ChevronUp className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedPhase === i && (
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-text-secondary">{phase.description}</p>
                <div>
                  <p className="text-xs text-text-muted uppercase mb-1">Livrables</p>
                  <div className="flex flex-wrap gap-1">
                    {phase.deliverables.map((d, j) => (
                      <Badge key={j} variant="default" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
                {phase.tools.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted uppercase mb-1">Outils</p>
                    <div className="flex flex-wrap gap-1">
                      {phase.tools.map((t, j) => (
                        <Badge key={j} variant="muted" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {phase.ai_agents.length > 0 && phase.ai_agents[0] && (
                  <div>
                    <p className="text-xs text-text-muted uppercase mb-1">Agents IA</p>
                    <div className="flex flex-wrap gap-1">
                      {phase.ai_agents.map((a, j) => (
                        <Badge key={j} variant="blue" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* AI Agents */}
      {delivery.ai_agents.length > 0 && (
        <div>
          <h4 className="font-medium text-text-primary flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-accent" />
            Agents IA
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {delivery.ai_agents.map((agent, i) => (
              <Card key={i}>
                <CardContent className="py-3 space-y-2">
                  <p className="text-sm font-medium text-text-primary">{agent.name}</p>
                  <p className="text-xs text-text-secondary">{agent.role}</p>
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-text-muted">Déclencheur : </span>
                      <span className="text-text-secondary">{agent.trigger}</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-text-muted">Output : </span>
                    <span className="text-accent">{agent.output}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tech Stack */}
      <div>
        <h4 className="font-medium text-text-primary flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4 text-accent" />
          Stack technique
        </h4>
        <Card>
          <CardContent className="py-3">
            <div className="divide-y divide-border-default">
              {delivery.tech_stack.map((tool, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-primary">{tool.tool}</span>
                    <span className="text-xs text-text-secondary">{tool.purpose}</span>
                  </div>
                  <Badge variant="muted" className="text-xs">{tool.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div>
        <h4 className="font-medium text-text-primary flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-accent" />
          KPIs de delivery
        </h4>
        <div className="grid gap-2 md:grid-cols-3">
          {delivery.kpis.map((kpi, i) => (
            <Card key={i}>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-text-muted">{kpi.metric}</p>
                <p className="text-lg font-bold text-accent">{kpi.target}</p>
                <p className="text-xs text-text-muted">{kpi.frequency}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottlenecks & Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        {delivery.bottlenecks.length > 0 && (
          <Card className="border-yellow-500/20">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Goulots d&apos;étranglement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {delivery.bottlenecks.map((b, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">&bull;</span>
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {delivery.recommendations.length > 0 && (
          <Card className="border-accent/20">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                Recommandations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {delivery.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-accent mt-0.5">&bull;</span>
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
