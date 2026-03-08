"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { VaultDocuments } from "@/components/vault/vault-documents";
import { VaultExtraction } from "@/components/vault/vault-extraction";
import { VaultSkillMap } from "@/components/vault/vault-skill-map";
import { VaultCompetitiveAdvantage } from "@/components/vault/vault-competitive-advantage";
import { TabBar } from "@/components/shared/tab-bar";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Archive,
  Sparkles,
  Brain,
  Target,
  GraduationCap,
  Briefcase,
  RefreshCw,
  Upload,
  MessageSquare,
  Map,
  Trophy,
} from "lucide-react";

const TABS = [
  { key: "vault", label: "Vue d'ensemble", icon: Archive },
  { key: "documents", label: "Documents", icon: Upload },
  { key: "extraction", label: "Extraction IA", icon: MessageSquare },
  { key: "cartographie", label: "Cartographie", icon: Map },
  { key: "avantage", label: "Avantage", icon: Trophy },
] as const;

export default function VaultPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState<string>("vault");
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<Record<string, unknown> | null>(null);
  const [regenerating, setRegenerating] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("skills, vault_skills, situation, situation_details, formations, experience_level, current_revenue, target_revenue, industries, objectives, budget_monthly, hours_per_week, deadline, team_size, vault_analysis, parcours, niche, selected_market")
        .eq("id", user.id)
        .single();
      setProfile(data as Record<string, unknown> | null);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleRegenerate = async () => {
    const confirmed = window.confirm(
      "Es-tu sur de vouloir regenerer l'analyse ? L'analyse actuelle sera remplacee."
    );
    if (!confirmed) return;

    setRegenerating(true);
    try {
      const response = await fetch("/api/ai/analyze-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Erreur lors de l'analyse");
      const data = await response.json();
      setProfile((prev) => prev ? { ...prev, vault_analysis: data.vault_analysis } : prev);
      toast.success("Analyse du vault regeneree !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setRegenerating(false);
    }
  };

  const skills = profile?.skills as string[] | null;
  const situation = profile?.situation as string | null;
  const experienceLevel = profile?.experience_level as string | null;
  const parcours = profile?.parcours as string | null;
  const formations = profile?.formations as string[] | null;
  const currentRevenue = profile?.current_revenue as number | null;
  const targetRevenue = profile?.target_revenue as number | null;
  const objectives = profile?.objectives as string[] | null;
  const industries = profile?.industries as string[] | null;
  const vaultAnalysis = profile?.vault_analysis as Record<string, unknown> | string | null;

  return (
    <div>
      <PageHeader
        title="Vault"
        description="Ton coffre-fort de competences et ressources."
        actions={
          activeTab === "vault" ? (
            <Button onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw className={cn("h-4 w-4 mr-2", regenerating && "animate-spin")} />
              Regenerer l&apos;analyse
            </Button>
          ) : undefined
        }
      />

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "vault" && (
        <>
          {loading ? (
            <AILoading text="Chargement du vault" />
          ) : !profile ? (
            <EmptyState
              icon={Archive}
              title="Vault non disponible"
              description="Complete l'onboarding pour initialiser ton vault."
            />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-accent" />
                      Competences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {skills && skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="default">{skill}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">Aucune competence renseignee</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-accent" />
                      Situation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted uppercase">Profil :</span>
                      <Badge variant="muted">{situation || "Non renseigne"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted uppercase">Niveau :</span>
                      <Badge variant="muted">{experienceLevel || "Non renseigne"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted uppercase">Parcours :</span>
                      <Badge variant="muted">{parcours || "Non defini"}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
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
                          <Badge key={i} variant="muted">{f}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">Aucune formation renseignee</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
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
                          {currentRevenue ? `${currentRevenue.toLocaleString("fr-FR")} \u20AC` : "\u2014"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-tertiary">
                        <p className="text-xs text-text-muted mb-1">Objectif</p>
                        <p className="text-lg font-semibold text-accent">
                          {targetRevenue ? `${targetRevenue.toLocaleString("fr-FR")} \u20AC` : "\u2014"}
                        </p>
                      </div>
                    </div>
                    {objectives && objectives.length > 0 && (
                      <div>
                        <p className="text-xs text-text-muted uppercase mb-2">Objectifs</p>
                        <div className="flex flex-wrap gap-2">
                          {objectives.map((obj: string, i: number) => (
                            <Badge key={i} variant="default">{obj}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {industries && industries.length > 0 && (
                      <div>
                        <p className="text-xs text-text-muted uppercase mb-2">Industries cibles</p>
                        <div className="flex flex-wrap gap-2">
                          {industries.map((ind: string, i: number) => (
                            <Badge key={i} variant="muted">{ind}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {vaultAnalysis && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      Analyse IA du Vault
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof vaultAnalysis === "string" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <div className="text-text-secondary text-sm whitespace-pre-wrap">
                          {vaultAnalysis}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(vaultAnalysis as Record<string, unknown>).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <h4 className="text-sm font-medium text-text-primary capitalize">
                              {key.replace(/_/g, " ")}
                            </h4>
                            {Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-1.5">
                                {value.map((item, i) => (
                                  <Badge key={i} variant="muted" className="text-xs">
                                    {typeof item === "string" ? item : JSON.stringify(item)}
                                  </Badge>
                                ))}
                              </div>
                            ) : typeof value === "object" && value !== null ? (
                              <div className="rounded-lg bg-bg-tertiary p-3 space-y-2">
                                {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                                  <div key={subKey} className="flex items-start gap-2">
                                    <span className="text-xs text-text-muted font-medium min-w-[120px] capitalize">
                                      {subKey.replace(/_/g, " ")}:
                                    </span>
                                    <span className="text-sm text-text-secondary">
                                      {typeof subValue === "string" ? subValue : JSON.stringify(subValue)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-text-secondary">{String(value)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {activeTab === "documents" && <VaultDocuments />}
      {activeTab === "extraction" && <VaultExtraction />}
      {activeTab === "cartographie" && <VaultSkillMap />}
      {activeTab === "avantage" && <VaultCompetitiveAdvantage />}
    </div>
  );
}
