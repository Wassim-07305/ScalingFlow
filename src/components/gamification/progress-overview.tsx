"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame, Zap, Trophy, Star, Target, BookOpen, Megaphone, PenTool, Lock } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { BADGE_DEFINITIONS, getBadgeDefinition } from "@/lib/gamification/badges";

interface ModuleProgress {
  name: string;
  icon: typeof Target;
  progress: number;
  color: string;
}

interface ProgressOverviewProps {
  className?: string;
}

export function ProgressOverview({ className }: ProgressOverviewProps) {
  const { user, profile, loading: userLoading } = useUser();
  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchModuleProgress = async () => {
      const supabase = createClient();

      // Requetes paralleles pour compter les items par module + rang
      const [offersRes, funnelsRes, adsRes, contentRes, leaderboardRes, videosRes, watchedRes] =
        await Promise.all([
          supabase
            .from("offers")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("funnels")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("ad_creatives")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("content_pieces")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("leaderboard_scores")
            .select("rank_position")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("academy_videos")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("video_progress")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("watched", true),
        ]);

      // Calcul progression onboarding
      const onboardingProgress = profile?.onboarding_completed
        ? 100
        : Math.round(((profile?.onboarding_step ?? 0) / 6) * 100);

      const offerProgress = (offersRes.count ?? 0) >= 1 ? 100 : 0;
      const funnelProgress = (funnelsRes.count ?? 0) >= 1 ? 100 : 0;
      const totalVideos = videosRes.count ?? 0;
      const watchedVideos = watchedRes.count ?? 0;
      const academyProgress = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;
      const adsProgress = (adsRes.count ?? 0) >= 1 ? 100 : 0;
      const contentProgress = (contentRes.count ?? 0) >= 1 ? 100 : 0;

      setModules([
        { name: "Onboarding", icon: Target, progress: onboardingProgress, color: "text-accent" },
        { name: "Offre", icon: Star, progress: offerProgress, color: "text-accent" },
        { name: "Funnel", icon: Target, progress: funnelProgress, color: "text-info" },
        { name: "Academy", icon: BookOpen, progress: academyProgress, color: "text-accent" },
        { name: "Ads", icon: Megaphone, progress: adsProgress, color: "text-[#A78BFA]" },
        { name: "Contenu", icon: PenTool, progress: contentProgress, color: "text-accent" },
      ]);

      // Rang depuis leaderboard_scores
      if (leaderboardRes.data?.rank_position) {
        setRank(leaderboardRes.data.rank_position);
      }

      setDataLoading(false);
    };

    fetchModuleProgress();
  }, [user, profile]);

  const isLoading = userLoading || dataLoading;

  const totalXp = profile?.xp_points ?? 0;
  const level = profile?.level ?? 1;
  const nextLevelXp = level * 1000;
  const streak = profile?.streak_days ?? 0;
  const badges = profile?.badges ?? [];

  const levelProgress = nextLevelXp > 0 ? (totalXp / nextLevelXp) * 100 : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* XP + Level + Streak */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total XP</p>
                <p className="text-2xl font-bold text-accent">
                  {isLoading ? (
                    <span className="inline-block w-16 h-7 bg-bg-tertiary rounded animate-pulse" />
                  ) : (
                    <AnimatedCounter value={totalXp} />
                  )}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Niveau {level}</span>
                <span>Niveau {level + 1}</span>
              </div>
              <Progress value={isLoading ? 0 : levelProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-danger/15 flex items-center justify-center">
                <Flame className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Streak</p>
                <p className="text-2xl font-bold text-danger">
                  {isLoading ? (
                    <span className="inline-block w-16 h-7 bg-bg-tertiary rounded animate-pulse" />
                  ) : (
                    <><AnimatedCounter value={streak} /> jours</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Classement</p>
                <p className="text-2xl font-bold text-accent">
                  {isLoading ? (
                    <span className="inline-block w-10 h-7 bg-bg-tertiary rounded animate-pulse" />
                  ) : rank !== null ? (
                    <>
                      #<AnimatedCounter value={rank} />
                    </>
                  ) : (
                    <span className="text-text-muted">&mdash;</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progression par module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-5 w-5 bg-bg-tertiary rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="inline-block w-20 h-4 bg-bg-tertiary rounded animate-pulse" />
                      <span className="inline-block w-8 h-4 bg-bg-tertiary rounded animate-pulse" />
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              modules.map((mod) => (
                <div key={mod.name} className="flex items-center gap-4">
                  <mod.icon className={cn("h-5 w-5", mod.color)} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-text-primary">{mod.name}</span>
                      <span className="text-sm text-text-muted">{mod.progress}%</span>
                    </div>
                    <Progress value={mod.progress} className="h-2" />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {BADGE_DEFINITIONS.map((badgeDef) => {
                const unlocked = badges.includes(badgeDef.id);
                const Icon = unlocked ? badgeDef.icon : Lock;
                return (
                  <Tooltip key={badgeDef.id}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-1.5 cursor-pointer">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                            unlocked
                              ? "bg-gradient-to-br from-bg-secondary to-bg-tertiary ring-2 ring-accent/30"
                              : "bg-bg-tertiary opacity-50"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-7 w-7 transition-colors",
                              unlocked ? badgeDef.color : "text-text-muted"
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[11px] text-center leading-tight",
                            unlocked ? "text-text-primary font-medium" : "text-text-muted"
                          )}
                        >
                          {badgeDef.name}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-semibold">{badgeDef.name}</p>
                      <p className="text-xs text-text-secondary">{badgeDef.description}</p>
                      {!unlocked && (
                        <p className="text-xs text-text-muted mt-1 italic">Non debloque</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
