"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import { ResourceUpload, ResourceItem } from "@/components/vault/resource-upload";
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
} from "lucide-react";
import { PARCOURS, type ParcoursId } from "@/lib/parcours";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { VaultSkillMap } from "@/components/vault/vault-skill-map";

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
  const [profile, setProfile] = React.useState<Record<string, unknown> | null>(null);
  const [regenerating, setRegenerating] = React.useState(false);
  const [resources, setResources] = React.useState<VaultResource[]>([]);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  // Fetch profile + resources
  React.useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      const [profileRes, resourcesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name, skills, vault_skills, situation, situation_details, formations, experience_level, current_revenue, target_revenue, industries, objectives, budget_monthly, hours_per_week, deadline, team_size, vault_analysis, parcours, niche, selected_market, expertise_answers")
          .eq("id", user.id)
          .single(),
        fetch("/api/vault/resources").then((r) => r.json()),
      ]);

      setProfile(profileRes.data as Record<string, unknown> | null);
      setResources(resourcesRes.resources || []);
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
      const vaultSkills = (profile.vault_skills as { name: string; level: string; details?: string }[]) || [];
      const body = {
        firstName: (profile.first_name as string) || "",
        situation: (profile.situation as string) || "",
        situationDetails: (profile.situation_details as Record<string, unknown>) || {},
        skills: (profile.skills as string[]) || [],
        vaultSkills,
        expertiseAnswers: (profile.expertise_answers as Record<string, string>) || {},
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
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      setProfile((prev) => prev ? { ...prev, vault_analysis: data } : prev);
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
          if (errData.usage) { setUsageLimited(errData.usage); return; }
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
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} />;
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Coffre-Fort" description="Ton coffre-fort de compétences et ressources." />
        <AILoading text="Chargement du vault" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <PageHeader title="Coffre-Fort" description="Ton coffre-fort de compétences et ressources." />
        <EmptyState
          icon={Archive}
          title="Vault non disponible"
          description="Complète l'onboarding pour initialiser ton vault."
        />
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
  const parcoursLabel = parcours ? PARCOURS[parcours as ParcoursId]?.label : null;

  return (
    <div>
      <PageHeader
        title="Coffre-Fort"
        description="Ton coffre-fort de compétences et ressources."
        actions={
          <Button onClick={handleRegenerate} disabled={regenerating}>
            <RefreshCw className={cn("h-4 w-4 mr-2", regenerating && "animate-spin")} />
            Régénérer l&apos;analyse
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Skills */}
        <Card>
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
                  <Badge key={i} variant="default">{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Aucune compétence renseignée</p>
            )}
          </CardContent>
        </Card>

        {/* Situation */}
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
              <Badge variant="muted">{situation || "Non renseigné"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted uppercase">Niveau :</span>
              <Badge variant="muted">{experienceLevel || "Non renseigné"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted uppercase">Parcours :</span>
              <Badge variant="muted">{parcoursLabel || parcours || "Non défini"}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Formations */}
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
              <p className="text-sm text-text-muted">Aucune formation renseignée</p>
            )}
          </CardContent>
        </Card>

        {/* Objectifs */}
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

      {/* Resources section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-accent" />
            Ressources
            {resources.length > 0 && (
              <Badge variant="muted" className="ml-2">{resources.length}</Badge>
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

      {/* AI Analysis — Radar, score, forces, faiblesses, etc. */}
      {vaultAnalysis && vaultAnalysis.radar && (
        <div className="mt-6">
          <VaultResults analysis={vaultAnalysis} />
        </div>
      )}
    </div>
  );
}
