"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
        : [...prev, channelId],
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
            cost_breakdown: {
              total_monthly: "-",
              per_lead_estimate: "-",
              roi_estimate: "-",
            },
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
    const text =
      typeof result === "string" ? result : JSON.stringify(result, null, 2);
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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Badge variant="default">Stratégie générée</Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="transition-all hover:border-accent/40 hover:shadow-sm"
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
            <Button
              variant="outline"
              size="sm"
              onClick={copyAll}
              className="transition-all hover:border-accent/40 hover:shadow-sm"
            >
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copié !" : "Copier tout"}
            </Button>
          </div>
        </div>

        {/* Résumé */}
        {result.summary && (
          <GlowCard glowColor="cyan">
            <p className="text-sm text-text-secondary leading-relaxed">
              {result.summary}
            </p>
          </GlowCard>
        )}

        {/* Allocation des canaux */}
        {result.channel_allocations &&
          result.channel_allocations.length > 0 && (
            <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  Allocation des canaux
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {result.channel_allocations.map((ch, i) => (
                  <div
                    key={i}
                    className="space-y-2 p-3 rounded-xl bg-bg-tertiary/30 border border-border-default/30 hover:border-border-hover/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Badge
                          variant={i === 0 ? "default" : "muted"}
                          className="text-xs font-bold"
                        >
                          #{ch.priority}
                        </Badge>
                        <span className="text-sm font-medium text-text-primary">
                          {ch.channel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="hidden sm:inline">
                          {ch.actions_per_week}/sem
                        </span>
                        <span>{ch.estimated_leads} leads/mois</span>
                        <span className="hidden sm:inline">
                          {ch.cost_estimate}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(ch.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted text-right font-medium">
                      {ch.percentage}%
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        {/* Plan d'action hebdo */}
        {result.weekly_plan && result.weekly_plan.length > 0 && (
          <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary/30 border border-border-default/30 hover:border-accent/20 transition-all duration-200"
                  >
                    <Badge
                      variant="muted"
                      className="text-xs min-w-[70px] justify-center font-medium"
                    >
                      {action.day}
                    </Badge>
                    <Badge variant="cyan" className="text-xs">
                      {action.channel}
                    </Badge>
                    <span className="text-sm text-text-secondary flex-1">
                      {action.action}
                    </span>
                    <span className="text-xs text-text-muted shrink-0">
                      {action.duration}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimations de coûts */}
        {result.cost_breakdown && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="group hover:border-accent/20 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-accent/10 mb-3 group-hover:bg-accent/15 transition-colors">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  Budget mensuel
                </p>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {result.cost_breakdown.total_monthly}
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:border-accent/20 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-accent/10 mb-3 group-hover:bg-accent/15 transition-colors">
                  <Target className="h-5 w-5 text-accent" />
                </div>
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  Coût par lead
                </p>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {result.cost_breakdown.per_lead_estimate}
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:border-accent/20 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-accent/10 mb-3 group-hover:bg-accent/15 transition-colors">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  ROI estimé
                </p>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {result.cost_breakdown.roi_estimate}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Résultats attendus */}
        {result.expected_results && (
          <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Résultats attendus
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    label: "Mois 1",
                    value: result.expected_results.month_1,
                    opacity: "opacity-70",
                  },
                  {
                    label: "Mois 3",
                    value: result.expected_results.month_3,
                    opacity: "opacity-85",
                  },
                  {
                    label: "Mois 6",
                    value: result.expected_results.month_6,
                    opacity: "",
                  },
                ].map((period) => (
                  <div
                    key={period.label}
                    className={cn(
                      "p-4 rounded-xl bg-bg-tertiary/50 border border-border-default/30 hover:border-accent/20 transition-all",
                      period.opacity,
                    )}
                  >
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">
                      {period.label}
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {period.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {result.tips && result.tips.length > 0 && (
          <Card className="border-accent/10">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Recommandations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {result.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-xs text-text-secondary flex items-start gap-2.5"
                  >
                    <span className="text-accent mt-0.5 shrink-0">
                      {"\u2192"}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          onClick={() => setResult(null)}
          className="transition-all hover:border-accent/40"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Régénérer une stratégie
        </Button>
      </div>
    );
  }

  // Formulaire
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
          <Compass className="h-7 w-7 text-accent" />
        </div>
        <h3 className="font-semibold text-text-primary text-lg mb-1.5">
          Stratégie d&apos;Acquisition
        </h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
          L&apos;IA va créer une stratégie d&apos;acquisition personnalisée avec
          allocation des canaux, plan d&apos;action et estimations.
        </p>
      </div>

      <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Paramètres de ta stratégie
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
            <Label>Canaux déjà utilisés</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CHANNELS.map((channel) => (
                <label
                  key={channel.id}
                  className={cn(
                    "flex items-center gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-all duration-200",
                    selectedChannels.includes(channel.id)
                      ? "border-accent bg-accent/10 shadow-sm shadow-accent/10"
                      : "border-border-default bg-bg-tertiary hover:border-border-hover",
                  )}
                >
                  <Checkbox
                    checked={selectedChannels.includes(channel.id)}
                    onCheckedChange={() => toggleChannel(channel.id)}
                  />
                  <span className="text-sm text-text-primary">
                    {channel.label}
                  </span>
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

          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!budget || !hoursPerWeek || !targetLeads}
            className="w-full group"
          >
            <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
            Générer la stratégie
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
