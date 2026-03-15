"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { BusinessAuditResult, BusinessAuditCategory } from "@/types/ai";
import {
  ClipboardCheck,
  TrendingUp,
  ShoppingCart,
  Megaphone,
  HandCoins,
  Users,
  Cog,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  Sparkles,
} from "lucide-react";

const ACQUISITION_CHANNELS = [
  "Organique (SEO/Blog)",
  "Réseaux sociaux",
  "Publicité Meta (Facebook/Instagram)",
  "Publicité Google",
  "YouTube",
  "TikTok",
  "Email marketing",
  "Bouche-à-oreille",
  "Partenariats",
  "Prospection directe (DM/Cold email)",
  "Webinaires",
  "Podcast",
];

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  offre: { icon: ShoppingCart, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  funnel: { icon: TrendingUp, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  acquisition: { icon: Megaphone, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  vente: { icon: HandCoins, color: "text-amber-400", bgColor: "bg-amber-500/10" },
  retention: { icon: Users, color: "text-pink-400", bgColor: "bg-pink-500/10" },
  automatisation: { icon: Cog, color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: "red" | "yellow" | "blue" }> = {
  urgent: { label: "Urgent", variant: "red" },
  important: { label: "Important", variant: "yellow" },
  "nice-to-have": { label: "Nice-to-have", variant: "blue" },
};

function ScoreGauge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 75) return "text-emerald-400";
    if (s >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getBgColor = (s: number) => {
    if (s >= 75) return "stroke-emerald-400";
    if (s >= 50) return "stroke-amber-400";
    return "stroke-red-400";
  };

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-bg-tertiary"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-1000", getBgColor(score))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", getColor(score))}>{score}</span>
        <span className="text-xs text-text-muted">/100</span>
      </div>
    </div>
  );
}

function CategoryScoreBar({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 7) return "bg-emerald-400";
    if (s >= 5) return "bg-amber-400";
    return "bg-red-400";
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", getColor(score))}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className="text-sm font-bold text-text-primary w-8 text-right">{score}/10</span>
    </div>
  );
}

function CategoryCard({
  categoryKey,
  category,
  isExpanded,
  onToggle,
}: {
  categoryKey: string;
  category: BusinessAuditCategory;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.offre;
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader className="cursor-pointer py-4" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm mb-1.5">{category.name}</CardTitle>
              <CategoryScoreBar score={category.score} />
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-text-muted ml-3 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted ml-3 shrink-0" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-4 border-t border-border-default">
          {/* Diagnostic */}
          <div className="pt-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              {category.diagnostic}
            </p>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Recommandations
            </h4>
            {category.recommendations.map((rec, i) => {
              const priorityConfig = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.important;
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-bg-tertiary/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {rec.title}
                    </span>
                    <Badge variant={priorityConfig.variant} className="text-[10px] shrink-0">
                      {priorityConfig.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function BusinessAudit() {
  const [businessName, setBusinessName] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [funnelDescription, setFunnelDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [mainChallenges, setMainChallenges] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BusinessAuditResult | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [usageLimited, setUsageLimited] = useState<{ currentUsage: number; limit: number } | null>(null);

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const isFormValid =
    businessName.trim().length >= 2 &&
    offerDescription.trim().length >= 10 &&
    selectedChannels.length > 0 &&
    monthlyRevenue.trim().length > 0;

  const handleAudit = async () => {
    if (!isFormValid) {
      toast.error("Remplis tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/audit-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          offerDescription,
          funnelDescription: funnelDescription || "Pas de funnel structuré",
          acquisitionChannels: selectedChannels,
          monthlyRevenue: parseInt(monthlyRevenue) || 0,
          teamSize: parseInt(teamSize) || 1,
          mainChallenges: mainChallenges || "Non précisé",
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
        throw new Error("Erreur lors de l'audit");
      }

      const data = await response.json();
      setResult(data);
      setExpandedCategory(null);
      toast.success("Audit terminé !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const buildCopyContent = () => {
    if (!result) return "";
    const lines: string[] = [];
    lines.push(`AUDIT BUSINESS — ${businessName}`);
    lines.push(`Score global : ${result.overall_score}/100`);
    lines.push(`\n${result.summary}\n`);

    const cats = result.categories;
    for (const [, cat] of Object.entries(cats)) {
      lines.push(`\n--- ${cat.name} (${cat.score}/10) ---`);
      lines.push(cat.diagnostic);
      lines.push("\nRecommandations :");
      for (const rec of cat.recommendations) {
        lines.push(`  [${rec.priority.toUpperCase()}] ${rec.title}`);
        lines.push(`  ${rec.description}`);
      }
    }

    if (result.quick_wins.length > 0) {
      lines.push("\n--- Quick Wins ---");
      result.quick_wins.forEach((qw, i) => lines.push(`${i + 1}. ${qw}`));
    }

    lines.push("\n--- Plan 90 jours ---");
    lines.push(result.plan_90_jours);

    return lines.join("\n");
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} />;
  }

  if (loading) {
    return <AILoading text="Audit de ton business en cours... Analyse de l'offre, du funnel, de l'acquisition, de la vente, de la rétention et de l'automatisation." />;
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <ClipboardCheck className="h-10 w-10 text-accent mx-auto mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">
            Audit Business IA
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            L&apos;IA analyse ton business existant et te donne un score détaillé avec des recommandations actionnables pour scaler.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Business name */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Nom du business *
              </label>
              <Input
                placeholder="Ex: Mon Agence Marketing, CoachFit Pro..."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            {/* Offer description */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Décris ton offre actuelle *
              </label>
              <Textarea
                placeholder="Ex: Coaching 1:1 sur 3 mois pour entrepreneurs qui veulent automatiser leur acquisition client avec l'IA. Prix : 2000 EUR..."
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Funnel description */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Décris ton funnel actuel
              </label>
              <Textarea
                placeholder="Ex: Landing page → Lead magnet (ebook) → Séquence email 7 jours → Appel découverte → Closing..."
                value={funnelDescription}
                onChange={(e) => setFunnelDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Acquisition channels */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Canaux d&apos;acquisition actuels *
              </label>
              <div className="flex flex-wrap gap-2">
                {ACQUISITION_CHANNELS.map((channel) => (
                  <button
                    key={channel}
                    onClick={() => toggleChannel(channel)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      selectedChannels.includes(channel)
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-bg-tertiary border-border-default text-text-secondary hover:border-border-hover"
                    )}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenue & Team */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  Revenu mensuel (EUR) *
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 5000"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  Taille de l&apos;équipe
                </label>
                <Input
                  type="number"
                  placeholder="1"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            {/* Main challenges */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Défis principaux
              </label>
              <Textarea
                placeholder="Ex: Difficulté à trouver des clients réguliers, trop de temps passé en prospection, pas de système automatisé..."
                value={mainChallenges}
                onChange={(e) => setMainChallenges(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              size="lg"
              onClick={handleAudit}
              disabled={!isFormValid}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Lancer l&apos;audit IA
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  const categoryKeys = ["offre", "funnel", "acquisition", "vente", "retention", "automatisation"] as const;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="border-accent/20">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreGauge score={result.overall_score} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Score global de {businessName}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {result.summary}
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResult(null)}
                >
                  Nouvel audit
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category scores overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categoryKeys.map((key) => {
          const cat = result.categories[key];
          const config = CATEGORY_CONFIG[key];
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() =>
                setExpandedCategory(expandedCategory === key ? null : key)
              }
              className={cn(
                "p-3 rounded-xl border transition-all text-center",
                expandedCategory === key
                  ? "border-accent bg-accent/5"
                  : "border-border-default bg-bg-secondary hover:border-border-hover"
              )}
            >
              <Icon className={cn("h-5 w-5 mx-auto mb-1.5", config.color)} />
              <p className="text-xs font-medium text-text-primary mb-1">
                {cat.name}
              </p>
              <p
                className={cn(
                  "text-lg font-bold",
                  cat.score >= 7
                    ? "text-emerald-400"
                    : cat.score >= 5
                      ? "text-amber-400"
                      : "text-red-400"
                )}
              >
                {cat.score}/10
              </p>
            </button>
          );
        })}
      </div>

      {/* Category details */}
      <div className="space-y-3">
        {categoryKeys.map((key) => (
          <CategoryCard
            key={key}
            categoryKey={key}
            category={result.categories[key]}
            isExpanded={expandedCategory === key}
            onToggle={() =>
              setExpandedCategory(expandedCategory === key ? null : key)
            }
          />
        ))}
      </div>

      {/* Quick Wins */}
      {result.quick_wins.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Quick Wins — Actions immédiates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {result.quick_wins.map((qw, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-text-primary">{qw}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Plan 90 jours */}
      <Card className="border-accent/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            Plan d&apos;action 90 jours
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {result.plan_90_jours}
          </p>
        </CardContent>
      </Card>

      {/* Copy / Export bar */}
      <CopyExportBar
        copyContent={buildCopyContent()}
        pdfTitle={`Audit Business — ${businessName}`}
        pdfSubtitle={`Score global : ${result.overall_score}/100`}
        pdfContent={buildCopyContent()}
        pdfFilename={`audit-business-${businessName.toLowerCase().replace(/\s+/g, "-")}`}
        className="sticky bottom-4 z-10 bg-bg-secondary/80 backdrop-blur-sm rounded-xl p-3 border border-border-default"
      />
    </div>
  );
}
