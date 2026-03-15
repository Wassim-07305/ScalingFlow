"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/shared/tab-bar";
import { PersonaDisplay } from "@/components/market/persona-display";
import { CompetitorGrid } from "@/components/market/competitor-grid";
import { PainIdentifier } from "@/components/market/pain-identifier";
import { SchwartzDisplay } from "@/components/market/schwartz-display";
import { InsightsScraper } from "@/components/market/insights-scraper";
import { BusinessAudit } from "@/components/market/business-audit";
import { ReviewVerbatims, type ReviewVerbatim, type ReviewSourceData } from "@/components/market/review-verbatims";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { PersonaForgeResult } from "@/lib/ai/prompts/persona-forge";
import type { Database } from "@/types/database";
import type { SchwartzAnalysisResult } from "@/types/ai";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import {
  BarChart3,
  User,
  Swords,
  Flame,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  TrendingUp,
  Target,
  AlertTriangle,
  Gauge,
  Search,
  ClipboardCheck,
  MessageSquareQuote,
  Plus,
  Trash2,
} from "lucide-react";

type MarketAnalysis = Database["public"]["Tables"]["market_analyses"]["Row"];
type Competitor = Database["public"]["Tables"]["competitors"]["Row"];

const TABS = [
  { key: "analyse", label: "Analyse", icon: BarChart3 },
  { key: "audit", label: "Audit Business", icon: ClipboardCheck },
  { key: "insights", label: "Insights", icon: Search },
  { key: "avis", label: "Avis clients", icon: MessageSquareQuote },
  { key: "schwartz", label: "Schwartz", icon: Gauge },
  { key: "persona", label: "Persona", icon: User },
  { key: "pains", label: "Pains", icon: Flame },
  { key: "concurrence", label: "Concurrence", icon: Swords },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function MarketPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabKey>("analyse");
  const [analyses, setAnalyses] = useState<MarketAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<MarketAnalysis | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loadingPersona, setLoadingPersona] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [competitorDataSource, setCompetitorDataSource] = useState<string>("ai_only");
  const [competitorScrapingUsed, setCompetitorScrapingUsed] = useState(false);
  const [competitorTrendsData, setCompetitorTrendsData] = useState<{ term: string; timelineData: { date: string; value: number }[]; relatedQueries: string[] }[] | undefined>(undefined);
  const [competitorScreenshots, setCompetitorScreenshots] = useState<{ url: string; screenshotUrl: string }[] | undefined>(undefined);
  const [competitorTechStacks, setCompetitorTechStacks] = useState<{ url: string; technologies: { name: string; category: string }[] }[] | undefined>(undefined);
  const [loadingSchwartz, setLoadingSchwartz] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [usageLimited, setUsageLimited] = useState<{currentUsage: number; limit: number} | null>(null);

  // Review scraping state
  const [googleMapsUrls, setGoogleMapsUrls] = useState<string[]>([""]);
  const [trustpilotUrls, setTrustpilotUrls] = useState<string[]>([""]);
  const [reviewVerbatims, setReviewVerbatims] = useState<ReviewVerbatim[]>([]);
  const [reviewsData, setReviewsData] = useState<ReviewSourceData[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsSourcesOpen, setReviewsSourcesOpen] = useState(true);

  // Charger les analyses de marché
  const loadAnalyses = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);

    const { data, error } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des analyses");
    } else if (data) {
      setAnalyses(data);
      // Sélectionner la première analyse par défaut (ou celle marquée selected)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected = (data as any[]).find((a) => a.selected) || data[0];
      if (selected) {
        setSelectedAnalysis(selected);
      }
    }
    setLoadingData(false);
  }, [user, supabase]);

  // Charger les concurrents de l'analyse sélectionnée
  const loadCompetitors = useCallback(async () => {
    if (!user || !selectedAnalysis) return;

    const { data, error } = await supabase
      .from("competitors")
      .select("*")
      .eq("user_id", user.id)
      .eq("market_analysis_id", selectedAnalysis.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setCompetitors(data || []);
    }
  }, [user, selectedAnalysis, supabase]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  // Générer le persona
  const handleGeneratePersona = async () => {
    if (!selectedAnalysis) return;
    setLoadingPersona(true);

    try {
      const res = await fetch("/api/ai/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_analysis_id: selectedAnalysis.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors de la génération");
      }

      const persona = await res.json();
      // Mettre à jour l'analyse locale
      setSelectedAnalysis({ ...selectedAnalysis, persona });
      setAnalyses((prev) =>
        prev.map((a) =>
          a.id === selectedAnalysis.id ? { ...a, persona } : a
        )
      );
      toast.success("Persona généré avec succès !");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la génération du persona"
      );
    } finally {
      setLoadingPersona(false);
    }
  };

  // Analyser les concurrents
  const handleAnalyzeCompetitors = async () => {
    if (!selectedAnalysis) return;
    setLoadingCompetitors(true);

    try {
      const res = await fetch("/api/ai/analyze-competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_analysis_id: selectedAnalysis.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors de la génération");
      }

      const resData = await res.json();
      // Stocker les infos de source de données
      setCompetitorDataSource(resData.data_source || "ai_only");
      setCompetitorScrapingUsed(resData.scraping_used || false);
      setCompetitorTrendsData(resData.trends_data || undefined);
      setCompetitorScreenshots(resData.screenshots || undefined);
      setCompetitorTechStacks(resData.tech_stacks || undefined);
      // Recharger les concurrents depuis la DB
      await loadCompetitors();
      const sourceLabel = resData.data_source === "apify_crawl" ? "Apify" : resData.data_source === "google_trends" ? "Google Trends" : resData.scraping_used ? "données réelles" : "IA";
      toast.success(`Analyse concurrentielle terminée via ${sourceLabel} !`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'analyse concurrentielle"
      );
    } finally {
      setLoadingCompetitors(false);
    }
  };

  const persona = selectedAnalysis?.persona as PersonaForgeResult | null;

  // Analyser le niveau Schwartz
  const handleGenerateSchwartz = async () => {
    if (!selectedAnalysis) return;
    setLoadingSchwartz(true);

    try {
      const res = await fetch("/api/ai/analyze-schwartz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_analysis_id: selectedAnalysis.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors de l'analyse");
      }

      const schwartzAnalysis = await res.json();
      // Mettre à jour l'analyse locale
      setSelectedAnalysis({ ...selectedAnalysis, schwartz_analysis: schwartzAnalysis });
      setAnalyses((prev) =>
        prev.map((a) =>
          a.id === selectedAnalysis.id ? { ...a, schwartz_analysis: schwartzAnalysis } : a
        )
      );
      toast.success("Analyse Schwartz terminée !");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'analyse Schwartz"
      );
    } finally {
      setLoadingSchwartz(false);
    }
  };

  // Scraper les avis clients
  const handleScrapeReviews = async () => {
    if (!selectedAnalysis) return;

    const validGoogleUrls = googleMapsUrls.filter((u) => u.trim());
    const validTrustpilotUrls = trustpilotUrls.filter((u) => u.trim());

    if (validGoogleUrls.length === 0 && validTrustpilotUrls.length === 0) {
      toast.error("Ajoute au moins une URL Google Maps ou Trustpilot.");
      return;
    }

    setLoadingReviews(true);

    try {
      const res = await fetch("/api/ai/analyze-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: [],
          experienceLevel: "intermediaire",
          currentRevenue: 0,
          targetRevenue: 0,
          industries: [selectedAnalysis.market_name],
          objectives: [],
          budgetMonthly: 0,
          competitor_google_maps_urls: validGoogleUrls,
          competitor_trustpilot_urls: validTrustpilotUrls,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors du scraping des avis");
      }

      const data = await res.json();

      if (data.review_verbatims && data.review_verbatims.length > 0) {
        setReviewVerbatims(data.review_verbatims);
        setReviewsData(data.reviews_data || []);
        toast.success(`${data.review_verbatims.length} avis clients récupérés !`);
      } else {
        toast.info("Aucun avis trouvé pour les URLs fournies.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du scraping des avis clients"
      );
    } finally {
      setLoadingReviews(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} />;
  }

  return (
    <div>
      <PageHeader
        title="Étude de marché"
        description="Analyse ton marché, crée ton avatar client et identifie tes concurrents."
      />

      {/* Tabs */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as TabKey)} />

      {/* Sélection de l'analyse */}
      {analyses.length > 1 && (
        <div className="mb-6">
          <label className="text-sm text-text-muted mb-2 block">
            Marché sélectionné
          </label>
          <div className="flex flex-wrap gap-2">
            {analyses.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAnalysis(a)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                  selectedAnalysis?.id === a.id
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-bg-tertiary border-border-default text-text-secondary hover:border-border-hover"
                )}
              >
                {a.market_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loadingData && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-bg-tertiary rounded animate-pulse" />
                    <div className="h-3 w-24 bg-bg-tertiary rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-4 bg-bg-tertiary rounded animate-pulse" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loadingData && analyses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              Aucune analyse de marché
            </h3>
            <p className="text-sm text-text-secondary text-center max-w-md">
              Lance une analyse de marché depuis l&apos;onboarding pour voir tes
              résultats ici.
            </p>
          </CardContent>
        </Card>
      )}

      {/* TAB: Analyse */}
      {activeTab === "analyse" && !loadingData && analyses.length > 0 && (
        <div className="space-y-4">
          {analyses.map((analysis) => {
            const isExpanded = expandedAnalysis === analysis.id;
            const aiData = analysis.ai_raw_response as Record<string, unknown> | null;

            return (
              <Card key={analysis.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedAnalysis(isExpanded ? null : analysis.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle>{analysis.market_name}</CardTitle>
                      {analysis.selected && (
                        <Badge variant="default">Recommandé</Badge>
                      )}
                      {analysis.viability_score !== null && (
                        <Badge
                          variant={
                            analysis.viability_score >= 70
                              ? "default"
                              : analysis.viability_score >= 50
                                ? "yellow"
                                : "red"
                          }
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {analysis.viability_score}/100
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">
                        {format(new Date(analysis.created_at), "d MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      )}
                    </div>
                  </div>
                  {analysis.market_description && (
                    <p className="text-sm text-text-secondary mt-1">
                      {analysis.market_description}
                    </p>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 border-t border-border-default pt-4">
                    {/* Positionnement */}
                    {analysis.recommended_positioning && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-1 flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" />
                          Positionnement recommandé
                        </h4>
                        <p className="text-sm text-text-primary">
                          {analysis.recommended_positioning}
                        </p>
                      </div>
                    )}

                    {/* Problèmes */}
                    {analysis.problems && analysis.problems.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Problèmes identifiés
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.problems.map((p, i) => (
                            <Badge key={i} variant="yellow" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signaux de demande */}
                    {analysis.demand_signals && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Signaux de demande
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(analysis.demand_signals as string[]).map((s, i) => (
                            <Badge key={i} variant="default" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Why good fit */}
                    {aiData && typeof aiData === "object" && "why_good_fit" in aiData && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-1">
                          Pourquoi ce marché est adapté
                        </h4>
                        <p className="text-sm text-text-secondary">
                          {aiData.why_good_fit as string}
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB: Persona */}
      {activeTab === "persona" && !loadingData && selectedAnalysis && (
        <div>
          {persona ? (
            <PersonaDisplay persona={persona} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-text-muted mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Aucun persona généré
                </h3>
                <p className="text-sm text-text-secondary text-center max-w-md mb-6">
                  Génère un avatar client ultra-détaillé sur 4 niveaux pour le
                  marché « {selectedAnalysis.market_name} ».
                </p>
                <Button
                  onClick={handleGeneratePersona}
                  disabled={loadingPersona}
                >
                  {loadingPersona ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Générer le Persona
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB: Audit Business */}
      {activeTab === "audit" && (
        <BusinessAudit />
      )}

      {/* TAB: Insights Scraper */}
      {activeTab === "insights" && (
        <InsightsScraper
          marketName={selectedAnalysis?.market_name || ""}
          targetAvatar={selectedAnalysis?.target_avatar as string || undefined}
          existingPains={(selectedAnalysis?.problems as string[]) || undefined}
        />
      )}

      {/* TAB: Avis clients */}
      {activeTab === "avis" && !loadingData && selectedAnalysis && (
        <div className="space-y-6">
          {/* Sources d'avis clients — collapsible */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setReviewsSourcesOpen(!reviewsSourcesOpen)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4 text-accent" />
                  Sources d&apos;avis clients
                </CardTitle>
                {reviewsSourcesOpen ? (
                  <ChevronUp className="h-4 w-4 text-text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">
                Ajoute les URLs Google Maps et Trustpilot de tes concurrents pour analyser leurs avis clients.
              </p>
            </CardHeader>

            {reviewsSourcesOpen && (
              <CardContent className="space-y-6 border-t border-border-default pt-4">
                {/* Google Maps URLs */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 font-bold">G</span>
                    URLs Google Maps concurrents
                  </label>
                  {googleMapsUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...googleMapsUrls];
                          newUrls[idx] = e.target.value;
                          setGoogleMapsUrls(newUrls);
                        }}
                        placeholder="https://maps.google.com/maps/place/..."
                        className="flex-1 rounded-lg bg-bg-tertiary border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      {googleMapsUrls.length > 1 && (
                        <button
                          onClick={() => setGoogleMapsUrls(googleMapsUrls.filter((_, i) => i !== idx))}
                          className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {googleMapsUrls.length < 5 && (
                    <button
                      onClick={() => setGoogleMapsUrls([...googleMapsUrls, ""])}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter une URL Google Maps
                    </button>
                  )}
                </div>

                {/* Trustpilot URLs */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-green-500/10 flex items-center justify-center text-[10px] text-green-400 font-bold">T</span>
                    URLs Trustpilot concurrents
                  </label>
                  {trustpilotUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...trustpilotUrls];
                          newUrls[idx] = e.target.value;
                          setTrustpilotUrls(newUrls);
                        }}
                        placeholder="https://fr.trustpilot.com/review/..."
                        className="flex-1 rounded-lg bg-bg-tertiary border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      {trustpilotUrls.length > 1 && (
                        <button
                          onClick={() => setTrustpilotUrls(trustpilotUrls.filter((_, i) => i !== idx))}
                          className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {trustpilotUrls.length < 5 && (
                    <button
                      onClick={() => setTrustpilotUrls([...trustpilotUrls, ""])}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter une URL Trustpilot
                    </button>
                  )}
                </div>

                {/* Scrape button */}
                <Button
                  onClick={handleScrapeReviews}
                  disabled={loadingReviews}
                  className="w-full"
                >
                  {loadingReviews ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyse des avis en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyser les avis clients
                    </>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Verbatims display */}
          {reviewVerbatims.length > 0 && (
            <ReviewVerbatims verbatims={reviewVerbatims} reviewsData={reviewsData} />
          )}

          {/* Empty state when no reviews yet */}
          {reviewVerbatims.length === 0 && !loadingReviews && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquareQuote className="h-12 w-12 text-text-muted mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Aucun avis analysé
                </h3>
                <p className="text-sm text-text-secondary text-center max-w-md">
                  Ajoute les URLs Google Maps ou Trustpilot de tes concurrents ci-dessus
                  pour collecter et analyser les verbatims clients.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB: Pains */}
      {activeTab === "pains" && !loadingData && selectedAnalysis && (
        <PainIdentifier
          marketAnalysisId={selectedAnalysis.id}
          existingPains={null}
        />
      )}

      {/* TAB: Schwartz */}
      {activeTab === "schwartz" && !loadingData && selectedAnalysis && (
        <div>
          {selectedAnalysis.schwartz_analysis ? (
            <SchwartzDisplay
              analysis={selectedAnalysis.schwartz_analysis as unknown as SchwartzAnalysisResult}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gauge className="h-12 w-12 text-text-muted mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Aucune analyse Schwartz
                </h3>
                <p className="text-sm text-text-secondary text-center max-w-md mb-6">
                  Détermine le niveau de sophistication de ton marché selon les
                  5 niveaux d'Eugène Schwartz pour adapter ta stratégie marketing.
                </p>
                <Button
                  onClick={handleGenerateSchwartz}
                  disabled={loadingSchwartz}
                >
                  {loadingSchwartz ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyser le niveau Schwartz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB: Concurrence */}
      {activeTab === "concurrence" && !loadingData && selectedAnalysis && (
        <div>
          {competitors.length > 0 ? (
            (() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fullAnalysis = (selectedAnalysis as any)?.competitor_analysis as any;
              const enriched = fullAnalysis?.competitors;
              const benchmarks = fullAnalysis?.industry_benchmarks;

              return (
                <CompetitorGrid
                  competitors={enriched
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? enriched.map((c: any) => ({
                        name: c.name,
                        positioning: c.positioning || "",
                        pricing_estimate: c.pricing_estimate || "",
                        strengths: c.strengths || [],
                        weaknesses: c.weaknesses || [],
                        differentiation: c.differentiation || "",
                        ad_insights: c.ad_insights,
                        content_insights: c.content_insights,
                        funnel_type: c.funnel_type,
                        estimated_revenue_range: c.estimated_revenue_range,
                      }))
                    : competitors.map((c) => ({
                        name: c.competitor_name,
                        positioning: c.positioning || "",
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        pricing_estimate: (c as any).pricing_estimate || (c as any).pricing || "",
                        strengths: c.strengths || [],
                        weaknesses: c.weaknesses || [],
                        differentiation: c.gap_opportunity || "",
                      }))
                  }
                  marketGaps={fullAnalysis?.market_gaps}
                  positioningOpportunities={fullAnalysis?.positioning_opportunities}
                  recommendedDifferentiation={fullAnalysis?.recommended_differentiation}
                  industryBenchmarks={benchmarks}
                  dataSource={competitorDataSource as "apify_crawl" | "google_trends" | "web_scraping" | "ai_only"}
                  scrapingUsed={competitorScrapingUsed}
                  trendsData={competitorTrendsData}
                  screenshots={competitorScreenshots}
                  techStacks={competitorTechStacks}
                />
              );
            })()
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Swords className="h-12 w-12 text-text-muted mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Aucune analyse concurrentielle
                </h3>
                <p className="text-sm text-text-secondary text-center max-w-md mb-6">
                  Lance une analyse IA des concurrents du marché
                  « {selectedAnalysis.market_name} ».
                </p>
                <Button
                  onClick={handleAnalyzeCompetitors}
                  disabled={loadingCompetitors}
                >
                  {loadingCompetitors ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyser les concurrents
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
