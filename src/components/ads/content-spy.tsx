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
  Search,
  TrendingUp,
  Lightbulb,
  Copy,
  Clock,
  Flame,
  MessageSquare,
  BarChart3,
  Zap,
} from "lucide-react";

// Types pour les résultats Content Spy
interface ContentType {
  type: string;
  frequency: string;
  estimated_engagement: string;
  description: string;
}

interface TopTheme {
  theme: string;
  sub_topics: string[];
  engagement_level: string;
}

interface HookVariation {
  hook_type: string;
  example: string;
  effectiveness: string;
}

interface PostingPatterns {
  frequency: string;
  best_days: string[];
  best_times: string[];
  consistency: string;
}

interface ViralFormula {
  pattern: string;
  elements: string[];
  replication_guide: string;
}

interface ContentGap {
  gap: string;
  opportunity: string;
  difficulty: string;
}

interface ActionableInsight {
  insight: string;
  action: string;
  expected_result: string;
}

interface ContentSpyResult {
  competitor_name: string;
  platform: string;
  overview: string;
  content_types: ContentType[];
  top_themes: TopTheme[];
  hook_variations: HookVariation[];
  posting_patterns: PostingPatterns;
  engagement_tactics: string[];
  viral_formula: ViralFormula;
  content_gaps: ContentGap[];
  actionable_insights: ActionableInsight[];
}

const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
];

interface ContentSpyProps {
  className?: string;
}

export function ContentSpy({ className }: ContentSpyProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ContentSpyResult | null>(null);

  // Champs du formulaire
  const [competitor, setCompetitor] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [handle, setHandle] = React.useState("");

  const canSubmit = competitor.trim() && platform;

  const handleAnalyze = async () => {
    if (!canSubmit) {
      toast.error("Remplis les champs obligatoires");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "content_spy",
          competitor: competitor.trim(),
          platform,
          handle: handle.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de l'analyse");
      }

      const data = await response.json();
      setResult(data.result);
      toast.success("Analyse terminée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  if (loading) {
    return <AILoading text="Analyse du contenu concurrent" className={className} />;
  }

  // Formulaire
  if (!result) {
    return (
      <div className={cn("space-y-6", className)}>
        <GlowCard glowColor="blue">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <Search className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Content Spy — Analyse de contenu
              </h3>
              <p className="text-sm text-text-secondary">
                Analyse la stratégie de contenu organique de tes concurrents
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cs-competitor">Nom du concurrent *</Label>
              <Input
                id="cs-competitor"
                placeholder="Ex: Iman Gadzhi, Yomi Denzel..."
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cs-platform">Plateforme *</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="cs-platform">
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cs-handle">Handle / URL du concurrent</Label>
              <Input
                id="cs-handle"
                placeholder="Ex: @imangazhi ou https://youtube.com/@channel"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
          </div>

          <Button
            size="lg"
            className="w-full mt-6"
            onClick={handleAnalyze}
            disabled={!canSubmit}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Analyser le contenu concurrent
          </Button>
        </GlowCard>
      </div>
    );
  }

  // Resultats
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-text-primary">
            Contenu de {result.competitor_name}
          </h3>
          <Badge variant="default">{result.platform}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setResult(null)}>
          Nouvelle analyse
        </Button>
      </div>

      {/* Vue d'ensemble */}
      <GlowCard glowColor="blue">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h4 className="font-semibold text-text-primary">Vue d&apos;ensemble</h4>
        </div>
        <p className="text-sm text-text-secondary">{result.overview}</p>
      </GlowCard>

      {/* Types de contenu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-accent" />
            Types de contenu utilises
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {result.content_types.map((ct, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-tertiary border border-border-default space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{ct.type}</p>
                  <Badge
                    variant={
                      ct.estimated_engagement === "Eleve" ||
                      ct.estimated_engagement.toLowerCase().includes("elev")
                        ? "default"
                        : ct.estimated_engagement === "Moyen" ||
                            ct.estimated_engagement.toLowerCase().includes("moy")
                          ? "blue"
                          : "cyan"
                    }
                  >
                    {ct.estimated_engagement}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted">{ct.frequency}</p>
                <p className="text-sm text-text-secondary">{ct.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Themes principaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-accent" />
            Themes et sujets principaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.top_themes.map((theme, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-tertiary border border-border-default"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-text-primary">{theme.theme}</p>
                  <Badge
                    variant={
                      theme.engagement_level === "Fort"
                        ? "default"
                        : theme.engagement_level === "Moyen"
                          ? "blue"
                          : "cyan"
                    }
                  >
                    {theme.engagement_level}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {theme.sub_topics.map((topic, j) => (
                    <Badge key={j} variant="cyan" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-accent" />
            Variations de hooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.hook_variations.map((hook, i) => (
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
                  <p className="text-sm font-medium text-text-primary">{hook.hook_type}</p>
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

      {/* Posting patterns + Engagement */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-accent" />
              Rythme de publication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted mb-1">Frequence</p>
              <p className="text-sm font-medium text-text-primary">
                {result.posting_patterns.frequency}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted mb-1">Meilleurs jours</p>
              <div className="flex flex-wrap gap-1.5">
                {result.posting_patterns.best_days.map((day, i) => (
                  <Badge key={i} variant="blue">{day}</Badge>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted mb-1">Meilleurs horaires</p>
              <div className="flex flex-wrap gap-1.5">
                {result.posting_patterns.best_times.map((time, i) => (
                  <Badge key={i} variant="cyan">{time}</Badge>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted mb-1">Regularite</p>
              <p className="text-sm text-text-primary">{result.posting_patterns.consistency}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" />
              Tactiques d&apos;engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.engagement_tactics.map((tactic, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-accent mt-0.5 shrink-0">-</span>
                  {tactic}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Formule virale */}
      <GlowCard glowColor="orange">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-orange-400" />
          <h4 className="font-semibold text-text-primary">Formule de contenu viral</h4>
        </div>
        <p className="text-sm text-text-secondary mb-3">{result.viral_formula.pattern}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {result.viral_formula.elements.map((el, i) => (
            <Badge key={i} variant="default">{el}</Badge>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs text-text-muted mb-1">Comment repliquer</p>
          <p className="text-sm text-accent">{result.viral_formula.replication_guide}</p>
        </div>
      </GlowCard>

      {/* Content gaps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-accent" />
            Lacunes de contenu (opportunités)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {result.content_gaps.map((gap, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-tertiary border border-border-default space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{gap.gap}</p>
                  <Badge
                    variant={
                      gap.difficulty === "Facile"
                        ? "default"
                        : gap.difficulty === "Moyen"
                          ? "blue"
                          : "cyan"
                    }
                  >
                    {gap.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-accent">{gap.opportunity}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights actionnables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" />
            Insights actionnables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.actionable_insights.map((insight, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-accent/5 border border-accent/20 space-y-2"
              >
                <p className="text-sm font-medium text-text-primary">{insight.insight}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-text-muted">Action</p>
                    <p className="text-sm text-accent">{insight.action}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Résultat attendu</p>
                    <p className="text-sm text-text-secondary">{insight.expected_result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
