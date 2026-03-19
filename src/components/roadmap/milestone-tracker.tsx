"use client";

import { useEffect, useState, useMemo} from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Lock, Trophy, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  milestone_order: number;
  badge_name: string | null;
  icon: string | null;
}

interface UserMilestone {
  milestone_id: string;
  completed: boolean;
  completed_at: string | null;
}

// Milestones par defaut si la table est vide
const FALLBACK_MILESTONES: Milestone[] = [
  {
    id: "1",
    title: "Profil complete",
    description: "Onboarding termine",
    milestone_order: 1,
    badge_name: "Premier pas",
    icon: null,
  },
  {
    id: "2",
    title: "Marché validé",
    description: "Score viabilité > 70",
    milestone_order: 2,
    badge_name: "Explorateur",
    icon: null,
  },
  {
    id: "3",
    title: "Offre créée",
    description: "Offre générée et validée",
    milestone_order: 3,
    badge_name: "Créateur",
    icon: null,
  },
  {
    id: "4",
    title: "Funnel construit",
    description: "3 pages de funnel pretes",
    milestone_order: 4,
    badge_name: "Stratege",
    icon: null,
  },
  {
    id: "5",
    title: "1er Lead",
    description: "Premier lead capture",
    milestone_order: 5,
    badge_name: null,
    icon: null,
  },
  {
    id: "6",
    title: "1ere Vente",
    description: "Premier client converti",
    milestone_order: 6,
    badge_name: "Scaler",
    icon: null,
  },
  {
    id: "7",
    title: "5K/mois",
    description: "Atteindre 5 000 EUR de MRR",
    milestone_order: 7,
    badge_name: "Expert",
    icon: null,
  },
  {
    id: "8",
    title: "10K/mois",
    description: "Atteindre 10 000 EUR de MRR",
    milestone_order: 8,
    badge_name: "Legende",
    icon: null,
  },
];

interface MilestoneTrackerProps {
  className?: string;
}

export function MilestoneTracker({ className }: MilestoneTrackerProps) {
  const { user, profile, loading: userLoading } = useUser();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [userMilestones, setUserMilestones] = useState<UserMilestone[]>([]);
  const [autoDetectedCounts, setAutoDetectedCounts] = useState({ offers: 0, funnels: 0, leads: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
      const supabase = useMemo(() => createClient(), []);

      const [milestonesRes, userMilestonesRes, offersCount, funnelsCount, leadsCount] = await Promise.all([
        supabase
          .from("milestones")
          .select("id, title, description, milestone_order, badge_name, icon")
          .order("milestone_order", { ascending: true }),
        supabase
          .from("user_milestones")
          .select("milestone_id, completed, completed_at")
          .eq("user_id", user.id),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("funnels")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("funnel_leads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const dbMilestones = milestonesRes.data ?? [];
      setMilestones(
        dbMilestones.length > 0 ? dbMilestones : FALLBACK_MILESTONES,
      );
      setUserMilestones((userMilestonesRes.data ?? []) as UserMilestone[]);
      // Auto-détection des milestones depuis les données réelles
      setAutoDetectedCounts({
        offers: offersCount.count ?? 0,
        funnels: funnelsCount.count ?? 0,
        leads: leadsCount.count ?? 0,
      });
      } catch (err) {
        console.error("MilestoneTracker: erreur de chargement", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Détecter automatiquement les milestones complétés par les données existantes
  const completedIds = new Set(
    userMilestones.filter((um) => um.completed).map((um) => um.milestone_id),
  );

  // Auto-detection basée sur le profil (pour les milestones "profil complete", etc.)
  const autoCompletedTitles = new Set<string>();
  if (profile?.onboarding_completed) autoCompletedTitles.add("Profil complete");
  if (profile?.market_viability_score && profile.market_viability_score > 70)
    autoCompletedTitles.add("Marché validé");
  if (autoDetectedCounts.offers > 0) autoCompletedTitles.add("Offre créée");
  if (autoDetectedCounts.funnels > 0) autoCompletedTitles.add("Funnel construit");
  if (autoDetectedCounts.leads > 0) autoCompletedTitles.add("1er Lead");

  const getStatus = (milestone: Milestone, index: number) => {
    if (completedIds.has(milestone.id)) return "completed";
    if (autoCompletedTitles.has(milestone.title)) return "completed";

    // Le premier non-complete est "in_progress"
    const allPreviousCompleted = milestones
      .slice(0, index)
      .every((m) => completedIds.has(m.id) || autoCompletedTitles.has(m.title));
    if (allPreviousCompleted && index === 0) return "in_progress";
    if (allPreviousCompleted) return "in_progress";

    return "locked";
  };

  const isLoading = userLoading || loading;

  const completedCount = milestones.filter(
    (m) => completedIds.has(m.id) || autoCompletedTitles.has(m.title),
  ).length;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Milestones
          {!isLoading && (
            <span className="text-xs font-normal text-text-muted ml-auto">
              {completedCount}/{milestones.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border-default" />
            <div className="space-y-4">
              {milestones.map((milestone, index) => {
                const status = getStatus(milestone, index);
                return (
                  <div
                    key={milestone.id}
                    className="relative flex items-start gap-4 pl-12"
                  >
                    <div className="absolute left-2.5">
                      {status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-accent" />
                      ) : status === "in_progress" ? (
                        <Circle className="h-5 w-5 text-accent animate-pulse" />
                      ) : (
                        <Lock className="h-5 w-5 text-text-muted" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex-1 p-3 rounded-xl",
                        status === "completed"
                          ? "bg-accent/5 border border-accent/20"
                          : status === "in_progress"
                            ? "bg-accent/5 border border-accent/20"
                            : "bg-bg-tertiary border border-border-default opacity-60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-text-primary text-sm">
                            {milestone.title}
                          </h4>
                          <p className="text-xs text-text-muted mt-0.5">
                            {milestone.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {milestone.badge_name && status === "completed" && (
                            <Badge variant="cyan" className="text-[10px]">
                              {milestone.badge_name}
                            </Badge>
                          )}
                          <Badge
                            variant={status === "completed" ? "cyan" : "muted"}
                          >
                            #{milestone.milestone_order}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
