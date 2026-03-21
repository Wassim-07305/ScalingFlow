"use client";

import React, { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResourceUpload,
  ResourceItem,
} from "@/components/vault/resource-upload";
import { VaultResults } from "@/components/onboarding/vault-results";
import type { VaultAnalysis } from "@/lib/ai/prompts/vault-analysis";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Archive,
  Brain,
  Target,
  GraduationCap,
  Briefcase,
  RefreshCw,
  FolderOpen,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { PARCOURS, type ParcoursId } from "@/lib/parcours";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { VaultSkillMap } from "@/components/vault/vault-skill-map";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VaultExtraction } from "@/components/vault/vault-extraction";
import { VaultCompetitiveAdvantage } from "@/components/vault/vault-competitive-advantage";

interface VaultResource {
  id: string;
  resource_type: string;
  url: string | null;
  file_path: string | null;
  title: string;
  file_size: number | null;
  content_type: string | null;
  has_extracted_text: boolean;
  created_at: string;
}

export default function VaultPage() {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<Record<string, unknown> | null>(
    null,
  );
  const [regenerating, setRegenerating] = React.useState(false);
  const [resources, setResources] = React.useState<VaultResource[]>([]);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);
  const [analysisHistory, setAnalysisHistory] = React.useState<
    Array<{
      analysis: VaultAnalysis;
      created_at: string;
      changes_since_last: Record<string, number> | null;
    }>
  >([]);
  const [changesSinceLast, setChangesSinceLast] = React.useState<Record<
    string,
    number
  > | null>(null);

  // Fetch profile + resources
  React.useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      const [profileRes, resourcesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "first_name, skills, vault_skills, situation, situation_details, formations, experience_level, current_revenue, target_revenue, industries, objectives, budget_monthly, hours_per_week, deadline, team_size, vault_analysis, parcours, niche, selected_market, expertise_answers",
          )
          .eq("id", user.id)
          .maybeSingle(),
        fetch("/api/vault/resources").then((r) => r.json()),
      ]);

      setProfile(profileRes.data as Record<string, unknown> | null);
      setResources(resourcesRes.resources || []);

      // Charger l'historique des analyses
      const history = (profileRes.data as Record<string, unknown> | null)
        ?.vault_analysis_history as typeof analysisHistory | undefined;
      if (history && Array.isArray(history)) {
        setAnalysisHistory(history.slice(0, 5));
        // Le dernier delta est dans la premiere entree d'historique
        if (history.length > 0 && history[0].changes_since_last) {
          setChangesSinceLast(history[0].changes_since_last);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Auto-trigger analysis if profile has skills but no vault_analysis
  const hasAutoTriggered = React.useRef(false);
  React.useEffect(() => {
    if (
      profile &&
      !regenerating &&
      !hasAutoTriggered.current &&
      (profile.skills as string[] | null)?.length &&
      !(profile.vault_analysis as Record<string, unknown> | null)?.radar
    ) {
      hasAutoTriggered.current = true;
      handleRegenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleRegenerate = async () => {
    if (!profile) return;
    setRegenerating(true);
    try {
      const vaultSkills =
        (profile.vault_skills as {
          name: string;
          level: string;
          details?: string;
        }[]) || [];
      const body = {
        firstName: (profile.first_name as string) || "",
        situation: (profile.situation as string) || "",
        situationDetails:
          (profile.situation_details as Record<string, unknown>) || {},
        skills: (profile.skills as string[]) || [],
        vaultSkills,
        expertiseAnswers:
          (profile.expertise_answers as Record<string, string>) || {},
        parcours: (profile.parcours as string) || "",
        experienceLevel: (profile.experience_level as string) || "",
        currentRevenue: (profile.current_revenue as number) || 0,
        targetRevenue: (profile.target_revenue as number) || 0,
        industries: (profile.industries as string[]) || [],
        objectives: (profile.objectives as string[]) || [],
        hoursPerWeek: (profile.hours_per_week as number) || 0,
        formations: (profile.formations as string[]) || [],
      };

      const response = await fetch("/api/ai/analyze-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      // Extraire history et changes_since_last de la reponse
      const { changes_since_last: changes, history, ...analysisData } = data;
      setProfile((prev) =>
        prev ? { ...prev, vault_analysis: analysisData } : prev,
      );
      if (changes) setChangesSinceLast(changes);
      if (history && Array.isArray(history)) {
        setAnalysisHistory(history.slice(0, 5));
      }
      toast.success("Analyse du vault régénérée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/vault/resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        if (res.status === 403) {
          const errData = await res.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la génération");
      }
      setResources((prev) => prev.filter((r) => r.id !== id));
      toast.success("Ressource supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  };

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
      <div>
        <PageHeader
          title="Coffre-Fort"
          description="Ton coffre-fort de compétences et ressources."
        />
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-bg-tertiary" />
                    <div className="h-4 w-28 rounded bg-bg-tertiary" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-bg-tertiary/50" />
                    <div className="h-3 w-3/4 rounded bg-bg-tertiary/50" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded-full bg-bg-tertiary/50" />
                    <div className="h-6 w-20 rounded-full bg-bg-tertiary/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <PageHeader
          title="Coffre-Fort"
          description="Ton coffre-fort de compétences et ressources."
        />
        <Card className="mt-6 border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
              <Archive className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Vault non disponible
            </h3>
            <p className="text-sm text-text-secondary max-w-md mb-6 leading-relaxed">
              Complète l&apos;onboarding pour initialiser ton vault et débloquer
              l&apos;analyse IA de tes compétences.
            </p>
            <Button asChild>
              <a href="/onboarding">Commencer l&apos;onboarding</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const skills = profile.skills as string[] | null;
  const situation = profile.situation as string | null;
  const experienceLevel = profile.experience_level as string | null;
  const parcours = profile.parcours as string | null;
  const formations = profile.formations as string[] | null;
  const currentRevenue = profile.current_revenue as number | null;
  const targetRevenue = profile.target_revenue as number | null;
  const objectives = profile.objectives as string[] | null;
  const industries = profile.industries as string[] | null;
  const vaultAnalysis = profile.vault_analysis as VaultAnalysis | null;
  const parcoursLabel = parcours
    ? PARCOURS[parcours as ParcoursId]?.label
    : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Coffre-Fort"
        description="Ton coffre-fort de compétences et ressources."
        actions={
          <Button onClick={handleRegenerate} disabled={regenerating}>
            <RefreshCw
              className={cn("h-4 w-4 mr-2", regenerating && "animate-spin")}
            />
            Régénérer l&apos;analyse
          </Button>
        }
      />

      <Tabs defaultValue="vault" className="mt-6">
        <TabsList>
          <TabsTrigger value="vault">Coffre-Fort</TabsTrigger>
          <TabsTrigger value="extraction">Extraction</TabsTrigger>
          <TabsTrigger value="competitive">Avantage concurrentiel</TabsTrigger>
        </TabsList>

        <TabsContent value="vault" className="mt-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Skills */}
        <Card className="group hover:border-accent/20 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" />
              Compétences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skills && skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, i: number) => (
                  <Badge key={i} variant="default">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                Aucune compétence renseignée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Situation */}
        <Card className="group hover:border-accent/20 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent" />
              Situation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted uppercase">
                Profil :
              </span>
              <Badge variant="muted">{situation || "Non renseigné"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted uppercase">
                Niveau :
              </span>
              <Badge variant="muted">
                {experienceLevel || "Non renseigné"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted uppercase">
                Parcours :
              </span>
              <Badge variant="muted">
                {parcoursLabel || parcours || "Non défini"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Formations */}
        <Card className="group hover:border-accent/20 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-accent" />
              Formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formations && formations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formations.map((f: string, i: number) => (
                  <Badge key={i} variant="muted">
                    {f}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                Aucune formation renseignée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Objectifs */}
        <Card className="group hover:border-accent/20 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Objectifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-bg-tertiary">
                <p className="text-xs text-text-muted mb-1">Revenu actuel</p>
                <p className="text-lg font-semibold text-text-primary">
                  {currentRevenue
                    ? `${currentRevenue.toLocaleString("fr-FR")} \u20AC`
                    : "\u2014"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-bg-tertiary">
                <p className="text-xs text-text-muted mb-1">Objectif</p>
                <p className="text-lg font-semibold text-accent">
                  {targetRevenue
                    ? `${targetRevenue.toLocaleString("fr-FR")} \u20AC`
                    : "\u2014"}
                </p>
              </div>
            </div>
            {objectives && objectives.length > 0 && (
              <div>
                <p className="text-xs text-text-muted uppercase mb-2">
                  Objectifs
                </p>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((obj: string, i: number) => (
                    <Badge key={i} variant="default">
                      {obj}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {industries && industries.length > 0 && (
              <div>
                <p className="text-xs text-text-muted uppercase mb-2">
                  Industries cibles
                </p>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind: string, i: number) => (
                    <Badge key={i} variant="muted">
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resources section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-accent" />
            Ressources
            {resources.length > 0 && (
              <Badge variant="muted" className="ml-2">
                {resources.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResourceUpload
            onUploadComplete={(resource) => {
              setResources((prev) => [resource as VaultResource, ...prev]);
            }}
          />

          {resources.length > 0 && (
            <div className="space-y-2">
              {resources.map((r) => (
                <ResourceItem
                  key={r.id}
                  resource={r}
                  onDelete={handleDeleteResource}
                  deleting={deletingId === r.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Map — Radar + Mindmap */}
      {skills && skills.length > 0 && (
        <div className="mt-6">
          <VaultSkillMap />
        </div>
      )}

      {/* Evolution des scores depuis la dernière analyse */}
      {vaultAnalysis && changesSinceLast && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Évolution depuis la dernière analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(changesSinceLast).map(([key, delta]) => {
                const labels: Record<string, string> = {
                  marketing: "Marketing",
                  vente: "Vente",
                  copywriting: "Copywriting",
                  tech: "Tech",
                  design: "Design",
                  strategie: "Stratégie",
                  score_avantage_competitif: "Avantage compétitif",
                };
                const label = labels[key] || key;
                return (
                  <div
                    key={key}
                    className={cn(
                      "p-3 rounded-xl border flex items-center gap-3",
                      delta > 0
                        ? "bg-accent/5 border-accent/20"
                        : delta < 0
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-bg-tertiary border-border-default",
                    )}
                  >
                    {delta > 0 ? (
                      <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                    ) : delta < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-400 shrink-0" />
                    ) : (
                      <Minus className="h-4 w-4 text-text-muted shrink-0" />
                    )}
                    <div>
                      <p className="text-xs text-text-muted">{label}</p>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          delta > 0
                            ? "text-accent"
                            : delta < 0
                              ? "text-red-400"
                              : "text-text-secondary",
                        )}
                      >
                        {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis — Radar, score, forces, faiblesses, etc. */}
      {vaultAnalysis && vaultAnalysis.radar && (
        <div className="mt-6">
          <VaultResults analysis={vaultAnalysis} />
        </div>
      )}

      {/* Historique des analyses */}
      {analysisHistory.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              Historique des analyses
              <Badge variant="muted" className="ml-2">
                {analysisHistory.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisHistory.map((entry, index) => {
                const date = new Date(entry.created_at);
                const formattedDate = date.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const score = entry.analysis?.score_avantage_competitif ?? 0;
                const radarAvg = entry.analysis?.radar
                  ? Math.round(
                      Object.values(entry.analysis.radar).reduce(
                        (a, b) => a + b,
                        0,
                      ) / Object.values(entry.analysis.radar).length,
                    )
                  : 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-colors",
                      index === 0
                        ? "bg-accent/5 border-accent/20"
                        : "bg-bg-tertiary border-border-default",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                          index === 0
                            ? "bg-accent text-white"
                            : "bg-bg-secondary text-text-muted",
                        )}
                      >
                        {index === 0 ? "A" : index}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {index === 0
                            ? "Analyse actuelle"
                            : `Analyse #${analysisHistory.length - index}`}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formattedDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Score</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {score}/100
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Moy. radar</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {radarAvg}/100
                        </p>
                      </div>
                      {entry.changes_since_last && (
                        <div className="text-right">
                          <p className="text-xs text-text-muted">Delta</p>
                          {(() => {
                            const totalDelta =
                              entry.changes_since_last[
                                "score_avantage_competitif"
                              ] ?? 0;
                            return (
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  totalDelta > 0
                                    ? "text-accent"
                                    : totalDelta < 0
                                      ? "text-red-400"
                                      : "text-text-muted",
                                )}
                              >
                                {totalDelta > 0
                                  ? `+${totalDelta}`
                                  : totalDelta === 0
                                    ? "="
                                    : totalDelta}
                              </p>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="extraction" className="mt-6">
          <VaultExtraction />
        </TabsContent>

        <TabsContent value="competitive" className="mt-6">
          <VaultCompetitiveAdvantage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
