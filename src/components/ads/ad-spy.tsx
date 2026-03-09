"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  Sparkles,
  Eye,
  TrendingUp,
  Target,
  Lightbulb,
  Copy,
  BarChart3,
  Zap,
  Shield,
  AlertTriangle,
} from "lucide-react";

// Types pour les resultats Ad Spy
interface AdCopyPattern {
  type: string;
  example: string;
  frequency: string;
}

interface HookFramework {
  framework: string;
  example: string;
  effectiveness: string;
}

interface Opportunity {
  opportunity: string;
  action: string;
}

interface Recommendation {
  action: string;
  priority: string;
  expected_impact: string;
}

interface AdSpyResult {
  competitor_name: string;
  platform: string;
  overview: string;
  estimated_active_ads: number;
  estimated_monthly_spend: string;
  creative_mix: {
    video_pct: number;
    image_pct: number;
    carousel_pct: number;
  };
  ad_copy_patterns: AdCopyPattern[];
  hook_frameworks: HookFramework[];
  cta_patterns: string[];
  targeting_inference: {
    demographics: string;
    interests: string[];
    lookalike_sources: string[];
  };
  funnel_structure: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
}

const PLATFORMS = [
  { value: "meta", label: "Meta (Facebook/Instagram)" },
  { value: "tiktok", label: "TikTok Ads" },
  { value: "google", label: "Google Ads" },
  { value: "youtube", label: "YouTube Ads" },
];

interface AdSpyProps {
  className?: string;
}

export function AdSpy({ className }: AdSpyProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<AdSpyResult | null>(null);

  // Champs du formulaire
  const [competitor, setCompetitor] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [platform, setPlatform] = React.useState("");

  const canSubmit = competitor.trim() && industry.trim() && platform;

  const handleAnalyze = async () => {
    if (!canSubmit) {
      toast.error("Remplis les champs obligatoires");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adType: "ad_spy",
          competitor: competitor.trim(),
          url: url.trim() || undefined,
          industry: industry.trim(),
          platform,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de l'analyse");
      }

      const data = await response.json();
      setResult(data.result);
      toast.success("Analyse terminee !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copie dans le presse-papiers");
  };

  if (loading) {
    return <AILoading text="Analyse des publicites concurrentes" className={className} />;
  }

  // Formulaire
  if (!result) {
    return (
      <div className={cn("space-y-6", className)}>
        <GlowCard glowColor="purple">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <Eye className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Ad Spy — Veille Concurrentielle
              </h3>
              <p className="text-sm text-text-secondary">
                Analyse la strategie publicitaire de tes concurrents grace a l&apos;IA
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="competitor">Nom du concurrent *</Label>
              <Input
                id="competitor"
                placeholder="Ex: Mentorshow, LiveMentor..."
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL / Page du concurrent</Label>
              <Input
                id="url"
                placeholder="Ex: https://livementor.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industrie / Niche *</Label>
              <Input
                id="industry"
                placeholder="Ex: Formation en ligne, Coaching business..."
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Plateforme publicitaire *</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Choisis une plateforme" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full mt-6"
            onClick={handleAnalyze}
            disabled={!canSubmit}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Analyser les ads concurrentes
          </Button>
        </GlowCard>
      </div>
    );
  }

  // Resultats
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header + Bouton regenerer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-text-primary">
            Analyse de {result.competitor_name}
          </h3>
          <Badge variant="default">{result.platform}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setResult(null)}>
          Nouvelle analyse
        </Button>
      </div>

      {/* Vue d'ensemble */}
      <GlowCard glowColor="purple">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h4 className="font-semibold text-text-primary">Vue d&apos;ensemble</h4>
        </div>
        <p className="text-sm text-text-secondary mb-4">{result.overview}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default text-center">
            <p className="text-2xl font-bold text-accent">{result.estimated_active_ads}</p>
            <p className="text-xs text-text-muted">Ads actives estimees</p>
          </div>
          <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default text-center">
            <p className="text-2xl font-bold text-accent">{result.estimated_monthly_spend}</p>
            <p className="text-xs text-text-muted">Budget mensuel estime</p>
          </div>
          <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default text-center">
            <p className="text-xs text-text-muted mb-2">Mix creatif</p>
            <div className="flex gap-1.5 justify-center">
              <Badge variant="blue">{result.creative_mix.video_pct}% Video</Badge>
              <Badge variant="cyan">{result.creative_mix.image_pct}% Image</Badge>
              <Badge variant="default">{result.creative_mix.carousel_pct}% Carousel</Badge>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Patterns de copy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-accent" />
            Patterns de copy publicitaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {result.ad_copy_patterns.map((pattern, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-tertiary border border-border-default space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="blue">{pattern.type}</Badge>
                  <span className="text-xs text-text-muted">{pattern.frequency}</span>
                </div>
                <p className="text-sm text-text-secondary italic">&ldquo;{pattern.example}&rdquo;</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => copyToClipboard(pattern.example)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copier
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hook frameworks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-accent" />
            Frameworks de hooks detectes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.hook_frameworks.map((hook, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary border border-border-default"
              >
                <Badge
                  variant={
                    hook.effectiveness === "Fort"
                      ? "default"
                      : hook.effectiveness === "Moyen"
                        ? "blue"
                        : "cyan"
                  }
                  className="shrink-0 mt-0.5"
                >
                  {hook.effectiveness}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{hook.framework}</p>
                  <p className="text-sm text-text-secondary mt-1 italic">
                    &ldquo;{hook.example}&rdquo;
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => copyToClipboard(hook.example)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copier
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA + Funnel */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-accent" />
              CTAs utilises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.cta_patterns.map((cta, i) => (
                <Badge
                  key={i}
                  variant="blue"
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => copyToClipboard(cta)}
                >
                  {cta}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-accent" />
              Structure du funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">{result.funnel_structure}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ciblage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-accent" />
            Ciblage infere
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-text-muted mb-1">Demographique</p>
            <p className="text-sm text-text-secondary">{result.targeting_inference.demographics}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Interets cibles</p>
            <div className="flex flex-wrap gap-1.5">
              {result.targeting_inference.interests.map((interest, i) => (
                <Badge key={i} variant="cyan">{interest}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Sources lookalike probables</p>
            <div className="flex flex-wrap gap-1.5">
              {result.targeting_inference.lookalike_sources.map((src, i) => (
                <Badge key={i} variant="blue">{src}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forces / Faiblesses */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-green-400" />
              Forces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-green-400 mt-0.5">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Faiblesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-yellow-400 mt-0.5">-</span>
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Opportunites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-accent" />
            Opportunites a saisir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {result.opportunities.map((opp, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-accent/5 border border-accent/20 space-y-2"
              >
                <p className="text-sm font-medium text-text-primary">{opp.opportunity}</p>
                <p className="text-sm text-accent">{opp.action}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary border border-border-default"
              >
                <Badge
                  variant={
                    rec.priority === "Haute"
                      ? "default"
                      : rec.priority === "Moyenne"
                        ? "blue"
                        : "cyan"
                  }
                  className="shrink-0 mt-0.5"
                >
                  {rec.priority}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{rec.action}</p>
                  <p className="text-sm text-text-muted mt-1">{rec.expected_impact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
