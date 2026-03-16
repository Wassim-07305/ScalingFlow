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
  Flame,
  DollarSign,
  Brain,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";

interface Pain {
  pain: string;
  intensity: number;
  verbatim: string;
  trigger: string;
  current_solution: string;
}

interface PainLayer {
  layer: string;
  description: string;
  pains: Pain[];
}

interface PainsResult {
  market_name: string;
  total_pains: number;
  severity_score: number;
  layers: PainLayer[];
  bleeding_neck_pain: {
    statement: string;
    why_bleeding: string;
    hook_angle: string;
  };
}

interface PainIdentifierProps {
  marketAnalysisId: string | null;
  existingPains?: PainsResult | null;
}

const LAYER_CONFIG: Record<string, { icon: React.ElementType; color: string }> =
  {
    Surface: { icon: AlertTriangle, color: "text-yellow-400" },
    Économique: { icon: DollarSign, color: "text-red-400" },
    Psychologique: { icon: Brain, color: "text-purple-400" },
    Opportunite: { icon: Lightbulb, color: "text-blue-400" },
  };

export function PainIdentifier({
  marketAnalysisId,
  existingPains,
}: PainIdentifierProps) {
  const [loading, setLoading] = React.useState(false);
  const [pains, setPains] = React.useState<PainsResult | null>(
    existingPains || null,
  );
  const [expandedLayer, setExpandedLayer] = React.useState<number | null>(0);

  const handleGenerate = async () => {
    if (!marketAnalysisId) {
      toast.error("Sélectionne d'abord une analyse de marché");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/identify-pains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_analysis_id: marketAnalysisId }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'analyse");
      const data = await response.json();
      setPains(data);
      toast.success("Bleeding-neck pains identifiés !");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'analyse",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AILoading text="Identification des bleeding-neck pains (4 couches)" />
    );
  }

  if (!pains) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Flame className="h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Bleeding-Neck Pains
          </h3>
          <p className="text-sm text-text-secondary text-center max-w-md mb-6">
            Identifie les douleurs les plus intenses de ton marché sur 4 couches
            de profondeur : surface, économique, psychologique et opportunité.
          </p>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!marketAnalysisId}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Identifier les pains
          </Button>
          {!marketAnalysisId && (
            <p className="text-xs text-text-muted mt-2">
              Lance d&apos;abord une analyse de marché
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec score de sévérité */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/12 ring-1 ring-red-400/20 flex items-center justify-center">
            <Flame className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              {pains.market_name}
            </h3>
            <p className="text-xs text-text-muted">
              {pains.total_pains} pains identifiés
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Severity visual */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={pains.severity_score >= 70 ? "#EF4444" : "#F59E0B"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(pains.severity_score / 100) * 100.5} 100.5`}
                />
              </svg>
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center text-xs font-bold",
                  pains.severity_score >= 70
                    ? "text-red-400"
                    : "text-yellow-400",
                )}
              >
                {pains.severity_score}
              </span>
            </div>
            <span className="text-xs text-text-muted font-medium">
              Sévérité
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-1" />
            Relancer
          </Button>
        </div>
      </div>

      {/* Bleeding-neck pain #1 */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Target className="h-5 w-5" />
            Bleeding-Neck Pain #1
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg font-semibold text-text-primary">
            {pains.bleeding_neck_pain.statement}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-bg-tertiary">
              <p className="text-xs text-text-muted uppercase mb-1">
                Pourquoi c&apos;est un bleeding-neck
              </p>
              <p className="text-sm text-text-secondary">
                {pains.bleeding_neck_pain.why_bleeding}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-bg-tertiary">
              <p className="text-xs text-text-muted uppercase mb-1">
                Angle de hook
              </p>
              <p className="text-sm text-accent">
                {pains.bleeding_neck_pain.hook_angle}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Couches de pains */}
      {pains.layers.map((layer, layerIndex) => {
        const config = LAYER_CONFIG[layer.layer] || {
          icon: AlertTriangle,
          color: "text-text-muted",
        };
        const Icon = config.icon;
        const isExpanded = expandedLayer === layerIndex;

        return (
          <Card key={layerIndex}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedLayer(isExpanded ? null : layerIndex)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className={cn("h-5 w-5", config.color)} />
                  Couche {layerIndex + 1} : {layer.layer}
                  <Badge variant="muted" className="ml-2">
                    {layer.pains.length} pains
                  </Badge>
                </CardTitle>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">
                {layer.description}
              </p>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-3 pt-0">
                {layer.pains.map((pain, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-bg-tertiary space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">
                        {pain.pain}
                      </p>
                      <Badge
                        variant={
                          pain.intensity >= 8
                            ? "red"
                            : pain.intensity >= 5
                              ? "yellow"
                              : "muted"
                        }
                      >
                        {pain.intensity}/10
                      </Badge>
                    </div>
                    {/* Intensity bar */}
                    <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          pain.intensity >= 8
                            ? "bg-red-400"
                            : pain.intensity >= 5
                              ? "bg-yellow-400"
                              : "bg-blue-400",
                        )}
                        style={{ width: `${pain.intensity * 10}%` }}
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-text-muted">Verbatim : </span>
                        <span className="text-text-secondary italic">
                          &laquo; {pain.verbatim} &raquo;
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">Déclencheur : </span>
                        <span className="text-text-secondary">
                          {pain.trigger}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">
                          Solution actuelle :{" "}
                        </span>
                        <span className="text-text-secondary">
                          {pain.current_solution}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
