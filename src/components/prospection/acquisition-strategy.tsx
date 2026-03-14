"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { cn } from "@/lib/utils/cn";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { toast } from "sonner";
import {
  Sparkles,
  Compass,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  Copy,
  FileDown,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

const CHANNELS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "cold_email", label: "Cold Email" },
  { id: "cold_calling", label: "Cold Calling" },
  { id: "messenger", label: "Messenger" },
  { id: "networking", label: "Networking" },
] as const;

interface ChannelAllocation {
  channel: string;
  percentage: number;
  priority: number;
  actions_per_week: string;
  estimated_leads: number;
  cost_estimate: string;
}

interface WeeklyAction {
  day: string;
  channel: string;
  action: string;
  duration: string;
}

interface StrategyResult {
  summary: string;
  channel_allocations: ChannelAllocation[];
  weekly_plan: WeeklyAction[];
  cost_breakdown: {
    total_monthly: string;
    per_lead_estimate: string;
    roi_estimate: string;
  };
  tips: string[];
  expected_results: {
    month_1: string;
    month_3: string;
    month_6: string;
  };
}

export function AcquisitionStrategy() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<StrategyResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Formulaire
  const [budget, setBudget] = React.useState("");
  const [hoursPerWeek, setHoursPerWeek] = React.useState("");
  const [selectedChannels, setSelectedChannels] = React.useState<string[]>([]);
  const [targetLeads, setTargetLeads] = React.useState("");

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((c) => c !== channelId)
        : [...prev, channelId]
    );
  };

  const handleGenerate = async () => {
    if (!budget || !hoursPerWeek || !targetLeads) {
      toast.error("Remplis tous les champs obligatoires");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sales_script",
          scriptType: "acquisition_strategy",
          context: {
            monthly_budget: budget,
            hours_per_week: hoursPerWeek,
            channels_used: selectedChannels,
            target_monthly_leads: targetLeads,
          },
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();

      // Parse la réponse IA
      const parsed = data.ai_raw_response || data;
      if (typeof parsed === "string") {
        try {
          setResult(JSON.parse(parsed));
        } catch {
          // Affichage brut si pas JSON valide
          setResult({
            summary: parsed,
            channel_allocations: [],
            weekly_plan: [],
            cost_breakdown: { total_monthly: "-", per_lead_estimate: "-", roi_estimate: "-" },
            tips: [],
            expected_results: { month_1: "-", month_3: "-", month_6: "-" },
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
    return <AILoading text="Élaboration de ta stratégie d'acquisition" />;
  }

  if (result) {
    return (
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Badge variant="default">Stratégie générée</Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToPDF({
                  title: "Stratégie d'Acquisition",
                  subtitle: "Généré par ScalingFlow",
                  content: result as unknown as Record<string, unknown>,
                  filename: "stratégie-acquisition-scalingflow.pdf",
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

        {/* Résumé */}
        {result.summary && (
          <GlowCard glowColor="cyan">
            <p className="text-sm text-text-secondary leading-relaxed">{result.summary}</p>
          </GlowCard>
        )}

        {/* Allocation des canaux */}
        {result.channel_allocations && result.channel_allocations.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                Allocation des canaux
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {result.channel_allocations.map((ch, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={i === 0 ? "default" : "muted"} className="text-xs">
                        #{ch.priority}
                      </Badge>
                      <span className="text-sm font-medium text-text-primary">{ch.channel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{ch.actions_per_week}/sem</span>
                      <span>{ch.estimated_leads} leads/mois</span>
                      <span>{ch.cost_estimate}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(ch.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted text-right">{ch.percentage}%</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Plan d'action hebdo */}
        {result.weekly_plan && result.weekly_plan.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Plan d&apos;action hebdomadaire
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-2">
                {result.weekly_plan.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-tertiary"
                  >
                    <Badge variant="muted" className="text-xs min-w-[70px] justify-center">
                      {action.day}
                    </Badge>
                    <Badge variant="cyan" className="text-xs">
                      {action.channel}
                    </Badge>
                    <span className="text-sm text-text-secondary flex-1">{action.action}</span>
                    <span className="text-xs text-text-muted">{action.duration}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimations de couts */}
        {result.cost_breakdown && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xs text-text-muted uppercase">Budget mensuel</p>
                <p className="text-lg font-bold text-text-primary">{result.cost_breakdown.total_monthly}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xs text-text-muted uppercase">Coût par lead</p>
                <p className="text-lg font-bold text-text-primary">{result.cost_breakdown.per_lead_estimate}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xs text-text-muted uppercase">ROI estimé</p>
                <p className="text-lg font-bold text-text-primary">{result.cost_breakdown.roi_estimate}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Résultats attendus */}
        {result.expected_results && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Résultats attendus
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 rounded-lg bg-bg-tertiary">
                  <p className="text-xs text-text-muted uppercase mb-1">Mois 1</p>
                  <p className="text-sm text-text-secondary">{result.expected_results.month_1}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-tertiary">
                  <p className="text-xs text-text-muted uppercase mb-1">Mois 3</p>
                  <p className="text-sm text-text-secondary">{result.expected_results.month_3}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-tertiary">
                  <p className="text-xs text-text-muted uppercase mb-1">Mois 6</p>
                  <p className="text-sm text-text-secondary">{result.expected_results.month_6}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {result.tips && result.tips.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Recommandations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-accent mt-0.5">{"\u2192"}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => setResult(null)}>
          Régénérer une strategie
        </Button>
      </div>
    );
  }

  // Formulaire
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Compass className="h-10 w-10 text-accent mx-auto mb-3" />
        <h3 className="font-semibold text-text-primary mb-1">
          Stratégie d&apos;Acquisition
        </h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          L&apos;IA va créer une stratégie d&apos;acquisition personnalisée avec allocation des canaux, plan d&apos;action et estimations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Paramètres de ta strategie
          </CardTitle>
          <CardDescription>
            Renseigne tes contraintes pour une stratégie sur mesure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">
                <DollarSign className="h-3.5 w-3.5 inline mr-1" />
                Budget mensuel (EUR)
              </Label>
              <Input
                id="budget"
                type="number"
                placeholder="Ex: 500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                Heures par semaine
              </Label>
              <Input
                id="hours"
                type="number"
                placeholder="Ex: 10"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Canaux déjà utilises</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CHANNELS.map((channel) => (
                <label
                  key={channel.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                    selectedChannels.includes(channel.id)
                      ? "border-accent bg-accent/10"
                      : "border-border-default bg-bg-tertiary hover:border-border-hover"
                  )}
                >
                  <Checkbox
                    checked={selectedChannels.includes(channel.id)}
                    onCheckedChange={() => toggleChannel(channel.id)}
                  />
                  <span className="text-sm text-text-primary">{channel.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">
              <Target className="h-3.5 w-3.5 inline mr-1" />
              Objectif de leads mensuels
            </Label>
            <Input
              id="target"
              type="number"
              placeholder="Ex: 30"
              value={targetLeads}
              onChange={(e) => setTargetLeads(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!budget || !hoursPerWeek || !targetLeads}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Générer la strategie
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
