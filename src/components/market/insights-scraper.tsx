"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { MarketInsightsResult } from "@/lib/ai/prompts/market-insights";
import {
  Search,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Heart,
  Quote,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Loader2,
} from "lucide-react";

const SOURCE_COLORS: Record<string, string> = {
  Reddit: "bg-orange-500/20 text-orange-400",
  Forum: "bg-blue-500/20 text-blue-400",
  YouTube: "bg-red-500/20 text-red-400",
  Review: "bg-yellow-500/20 text-yellow-400",
  "Twitter/X": "bg-sky-500/20 text-sky-400",
};

const SENTIMENT_BADGE: Record<string, "default" | "red" | "yellow" | "blue"> = {
  positive: "default",
  negative: "red",
  frustrated: "red",
  neutral: "blue",
};

interface InsightsScraperProps {
  marketName?: string;
  targetAvatar?: string;
  existingPains?: string[];
}

type LoadingPhase = "scraping" | "analyzing" | null;

export function InsightsScraper({
  marketName,
  targetAvatar,
  existingPains,
}: InsightsScraperProps) {
  const [market, setMarket] = useState(marketName || "");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [result, setResult] = useState<MarketInsightsResult | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [scrapingUsed, setScrapingUsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "insights",
  );
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [usageLimited, setUsageLimited] = useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);

  const handleScrape = async () => {
    if (market.trim().length < 3) {
      toast.error("Entre un marché (min 3 caractères)");
      return;
    }

    setLoading(true);
    setLoadingPhase("scraping");
    setSources([]);
    setScrapingUsed(false);

    try {
      // Show "scraping" phase briefly, then switch to "analyzing"
      const phaseTimer = setTimeout(() => setLoadingPhase("analyzing"), 5000);

      const response = await fetch("/api/ai/scrape-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market,
          niche: niche || undefined,
          targetAvatar: targetAvatar || undefined,
          existingPains: existingPains || undefined,
        }),
      });

      clearTimeout(phaseTimer);

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la recherche");
      }

      const data = await response.json();
      setResult(data.result);
      setSources(data.sources || []);
      setScrapingUsed(data.scraping_used || false);

      if (data.scraping_used) {
        toast.success(
          `Insights générés à partir de ${data.sources?.length || 0} sources web réelles !`,
        );
      } else {
        toast.success("Insights générés !");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    toast.success("Copié !");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const toggle = (key: string) =>
    setExpandedSection(expandedSection === key ? null : key);

  if (usageLimited) {
    return (
      <UpgradeWall
        currentUsage={usageLimited.currentUsage}
        limit={usageLimited.limit}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <AILoading
          text={
            loadingPhase === "scraping"
              ? "Recherche web en cours... Scraping des sources (Reddit, forums, avis...)"
              : "Analyse des données collectées par l'IA..."
          }
        />
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
          {loadingPhase === "scraping" ? (
            <>
              <Globe className="h-3.5 w-3.5 animate-pulse text-accent" />
              <span>Collecte des données depuis le web...</span>
            </>
          ) : (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              <span>Extraction des insights, douleurs et objections...</span>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Search className="h-10 w-10 text-accent mx-auto mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">
            Scraper d&apos;insights marché
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            L&apos;IA analyse les conversations en ligne (Reddit, forums,
            YouTube, avis clients) pour extraire les douleurs, désirs et
            objections de ta cible.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Marché / Industrie
              </label>
              <Input
                placeholder="Ex: coaching business en ligne, SaaS B2B, fitness..."
                value={market}
                onChange={(e) => setMarket(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Niche spécifique (optionnel)
              </label>
              <Input
                placeholder="Ex: coaches qui vendent des formations high-ticket..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              onClick={handleScrape}
              disabled={market.trim().length < 3}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              Lancer la recherche d&apos;insights
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-accent/20">
        <CardContent className="py-4">
          <p className="text-sm text-text-secondary">{result.summary}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="default">{result.insights.length} insights</Badge>
            <Badge variant="blue">
              {result.top_pain_points.length} douleurs
            </Badge>
            <Badge variant="yellow">
              {result.common_objections.length} objections
            </Badge>
            {scrapingUsed && (
              <Badge
                variant="default"
                className="bg-emerald-500/20 text-emerald-400"
              >
                <Globe className="h-3 w-3 mr-1" />
                Données web réelles
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setResult(null)}
            >
              Nouvelle recherche
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights feed */}
      <Card>
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => toggle("insights")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              Conversations analysées ({result.insights.length})
            </CardTitle>
            {expandedSection === "insights" ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "insights" && (
          <CardContent className="pt-0 space-y-3 max-h-[500px] overflow-y-auto">
            {result.insights.map((insight, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-bg-tertiary/50 space-y-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      SOURCE_COLORS[insight.source] ||
                        "bg-bg-tertiary text-text-muted",
                    )}
                  >
                    {insight.source}
                  </span>
                  {insight.subreddit_or_channel && (
                    <span className="text-[10px] text-text-muted">
                      {insight.subreddit_or_channel}
                    </span>
                  )}
                  <Badge
                    variant={SENTIMENT_BADGE[insight.sentiment] || "blue"}
                    className="text-[10px]"
                  >
                    {insight.sentiment}
                  </Badge>
                  <span className="text-[10px] text-text-muted ml-auto">
                    Pertinence: {insight.relevance}/10
                  </span>
                </div>
                <p className="text-xs font-medium text-text-primary">
                  {insight.title}
                </p>
                <p className="text-xs text-text-secondary italic">
                  &ldquo;{insight.content}&rdquo;
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.pain_expressed && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                      Douleur: {insight.pain_expressed}
                    </span>
                  )}
                  {insight.desire_expressed && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400">
                      Désir: {insight.desire_expressed}
                    </span>
                  )}
                  {insight.objection && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                      Objection: {insight.objection}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Pain points */}
      <Card>
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => toggle("pains")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Top douleurs ({result.top_pain_points.length})
            </CardTitle>
            {expandedSection === "pains" ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "pains" && (
          <CardContent className="pt-0 space-y-3">
            {result.top_pain_points.map((pain, i) => (
              <div key={i} className="p-3 rounded-xl bg-bg-tertiary/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">
                    {pain.pain}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        pain.intensity === "critique"
                          ? "red"
                          : pain.intensity === "forte"
                            ? "yellow"
                            : "muted"
                      }
                      className="text-[10px]"
                    >
                      {pain.intensity}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      fréq. {pain.frequency}%
                    </span>
                  </div>
                </div>
                {/* Frequency bar */}
                <div className="h-1 bg-bg-secondary rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      pain.intensity === "critique"
                        ? "bg-red-400"
                        : pain.intensity === "forte"
                          ? "bg-yellow-400"
                          : "bg-blue-400",
                    )}
                    style={{ width: `${Math.min(pain.frequency, 100)}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {(pain.exact_quotes ?? []).map((q, j) => (
                    <p key={j} className="text-xs text-text-secondary italic">
                      &ldquo;{q}&rdquo;
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Desires */}
      <Card>
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => toggle("desires")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-accent" />
              Top désirs ({result.top_desires.length})
            </CardTitle>
            {expandedSection === "desires" ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "desires" && (
          <CardContent className="pt-0 space-y-3">
            {result.top_desires.map((desire, i) => (
              <div key={i} className="p-3 rounded-xl bg-bg-tertiary/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">
                    {desire.desire}
                  </span>
                  <span className="text-xs text-text-muted">
                    fréq. {desire.frequency}%
                  </span>
                </div>
                <div className="space-y-1">
                  {(desire.exact_quotes ?? []).map((q, j) => (
                    <p key={j} className="text-xs text-text-secondary italic">
                      &ldquo;{q}&rdquo;
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Objections */}
      <Card>
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => toggle("objections")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
              Objections courantes ({result.common_objections.length})
            </CardTitle>
            {expandedSection === "objections" ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "objections" && (
          <CardContent className="pt-0 space-y-3">
            {result.common_objections.map((obj, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-bg-tertiary/50 space-y-2"
              >
                <p className="text-sm font-medium text-red-400">
                  &ldquo;{obj.objection}&rdquo;
                </p>
                {obj.context && (
                  <p className="text-xs text-text-muted">
                    Contexte : {obj.context}
                  </p>
                )}
                {obj.counter_argument && (
                  <p className="text-xs text-accent">
                    Contre-argument : {obj.counter_argument}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Language vault */}
      <Card>
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => toggle("language")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Quote className="h-4 w-4 text-accent" />
              Vault de langage
            </CardTitle>
            {expandedSection === "language" ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "language" && (
          <CardContent className="pt-0 space-y-4">
            <div>
              <p className="text-xs text-text-muted uppercase mb-2">
                Mots puissants
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.language_vault.power_words.map((w, i) => (
                  <Badge key={i} variant="default" className="text-xs">
                    {w}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-2">
                Phrases à réutiliser
              </p>
              <div className="space-y-1.5">
                {result.language_vault.phrases_to_reuse.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary/50"
                  >
                    <p className="text-xs text-accent italic">
                      &ldquo;{p}&rdquo;
                    </p>
                    <button
                      onClick={() => copyText(`phrase-${i}`, p)}
                      className="p-1 rounded hover:bg-bg-tertiary"
                    >
                      {copiedIdx === `phrase-${i}` ? (
                        <Check className="h-3 w-3 text-accent" />
                      ) : (
                        <Copy className="h-3 w-3 text-text-muted" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-2">
                Déclencheurs émotionnels
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.language_vault.emotional_triggers.map((t, i) => (
                  <Badge key={i} variant="yellow" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            {(result.language_vault.before_after_descriptions ?? []).filter((ba) => ba.before || ba.after).length > 0 && (
            <div>
              <p className="text-xs text-text-muted uppercase mb-2">
                Avant / Après
              </p>
              <div className="grid gap-2">
                {(result.language_vault.before_after_descriptions ?? [])
                  .filter((ba) => ba.before || ba.after)
                  .map((ba, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      {ba.before && (
                        <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <p className="text-[10px] text-red-400 uppercase mb-1">
                            Avant
                          </p>
                          <p className="text-xs text-text-secondary">
                            {ba.before}
                          </p>
                        </div>
                      )}
                      {ba.after && (
                        <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                          <p className="text-[10px] text-accent uppercase mb-1">
                            Après
                          </p>
                          <p className="text-xs text-text-secondary">
                            {ba.after}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Content angles */}
      <Card>
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => toggle("angles")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              Angles de contenu ({result.content_angles.length})
            </CardTitle>
            {expandedSection === "angles" ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "angles" && (
          <CardContent className="pt-0 space-y-2">
            {(result.content_angles ?? []).filter((a) => a.angle).map((angle, i) => (
              <div key={i} className="p-3 rounded-xl bg-bg-tertiary/50">
                <p className="text-sm font-medium text-text-primary mb-1">
                  {angle.angle}
                </p>
                {angle.source_inspiration && (
                  <p className="text-xs text-text-muted mb-1">
                    Inspiré de : {angle.source_inspiration}
                  </p>
                )}
                {angle.hook_idea && (
                  <p className="text-xs text-accent">
                    Hook : &ldquo;{angle.hook_idea}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Sources section */}
      {sources.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer py-3"
            onClick={() => toggle("sources")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" />
                Sources web ({sources.length})
              </CardTitle>
              {expandedSection === "sources" ? (
                <ChevronUp className="h-4 w-4 text-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted" />
              )}
            </div>
          </CardHeader>
          {expandedSection === "sources" && (
            <CardContent className="pt-0 space-y-2">
              <p className="text-xs text-text-muted mb-3">
                Pages web scrapées et analysées pour générer ces insights :
              </p>
              {sources.map((url, i) => {
                let displayUrl = url;
                try {
                  const parsed = new URL(url);
                  displayUrl = `${parsed.hostname}${parsed.pathname}`.replace(
                    /\/$/,
                    "",
                  );
                } catch {}

                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary transition-colors group"
                  >
                    <ExternalLink className="h-3 w-3 text-text-muted group-hover:text-accent shrink-0" />
                    <span className="text-xs text-text-secondary group-hover:text-accent truncate">
                      {displayUrl}
                    </span>
                  </a>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
