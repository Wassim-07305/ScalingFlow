"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/shared/tab-bar";
import { PersonaDisplay } from "@/components/market/persona-display";
import { CompetitorGrid } from "@/components/market/competitor-grid";
import { PainIdentifier } from "@/components/market/pain-identifier";
import { SchwartzDisplay } from "@/components/market/schwartz-display";
import { InsightsScraper } from "@/components/market/insights-scraper";
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
} from "lucide-react";

type MarketAnalysis = Database["public"]["Tables"]["market_analyses"]["Row"];
type Competitor = Database["public"]["Tables"]["competitors"]["Row"];

const TABS = [
  { key: "analyse", label: "Analyse", icon: BarChart3 },
  { key: "insights", label: "Insights", icon: Search },
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
  const [loadingSchwartz, setLoadingSchwartz] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [usageLimited, setUsageLimited] = useState<{currentUsage: number; limit: number} | null>(null);

  // Charger les analyses de marche
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
      // Selectionner la premiere analyse par defaut (ou celle marquee selected)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected = (data as any[]).find((a) => a.selected) || data[0];
      if (selected) {
        setSelectedAnalysis(selected);
      }
    }
    setLoadingData(false);
  }, [user, supabase]);

  // Charger les concurrents de l'analyse selectionnee
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

  // Generer le persona
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
        throw new Error(errData.error || "Erreur lors de la generation");
      }

      const persona = await res.json();
      // Mettre a jour l'analyse locale
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
          : "Erreur lors de la generation du persona"
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
        throw new Error(errData.error || "Erreur lors de la generation");
      }

      await res.json();
      // Recharger les concurrents depuis la DB
      await loadCompetitors();
      toast.success("Analyse concurrentielle terminée !");
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
      // Mettre a jour l'analyse locale
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

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} />;
  }

  return (
    <div>
      <PageHeader
        title="Etude de marche"
        description="Analyse ton marche, cree ton avatar client et identifie tes concurrents."
      />

      {/* Tabs */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as TabKey)} />

      {/* Selection de l'analyse */}
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="ml-2 text-sm text-text-secondary">
            Chargement des analyses...
          </span>
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
              Lance une analyse de marche depuis l&apos;onboarding pour voir tes
              resultats ici.
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
                        <Badge variant="default">Recommande</Badge>
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

                    {/* Problemes */}
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
                          Pourquoi ce marche est adapte
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
                  Aucun persona genere
                </h3>
                <p className="text-sm text-text-secondary text-center max-w-md mb-6">
                  Genere un avatar client ultra-detaille sur 4 niveaux pour le
                  marche &laquo; {selectedAnalysis.market_name} &raquo;.
                </p>
                <Button
                  onClick={handleGeneratePersona}
                  disabled={loadingPersona}
                >
                  {loadingPersona ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generation en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generer le Persona
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB: Insights Scraper */}
      {activeTab === "insights" && (
        <InsightsScraper
          marketName={selectedAnalysis?.market_name || ""}
          targetAvatar={selectedAnalysis?.target_avatar as string || undefined}
          existingPains={(selectedAnalysis?.problems as string[]) || undefined}
        />
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
                  Determine le niveau de sophistication de ton marche selon les
                  5 niveaux d&apos;Eugene Schwartz pour adapter ta strategie marketing.
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
                  Lance une analyse IA des concurrents du marche
                  &laquo; {selectedAnalysis.market_name} &raquo;.
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
