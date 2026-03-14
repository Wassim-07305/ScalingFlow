"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Target,
  Zap,
  Flame,
  Trophy,
  Package,
  PenTool,
  Megaphone,
  MessageCircle,
  BookOpen,
  Loader2,
  CheckCircle,
  Gift,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Challenge {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  target: number;
  current: number;
  xp_reward: number;
  completed: boolean;
}

// Definitions des défis possibles
const CHALLENGE_DEFINITIONS: {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  target: number;
  xp_reward: number;
  countQuery: (supabase: ReturnType<typeof createClient>, userId: string, weekStart: Date) => Promise<number>;
}[] = [
  {
    key: "offers_week",
    title: "Créateur d'offres",
    description: "Généré 2 offres cette semaine",
    icon: Package,
    color: "text-accent",
    target: 2,
    xp_reward: 100,
    countQuery: async (supabase, userId, weekStart) => {
      const { count } = await supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekStart.toISOString());
      return count ?? 0;
    },
  },
  {
    key: "content_week",
    title: "Machine à contenu",
    description: "Généré 5 contenus cette semaine",
    icon: PenTool,
    color: "text-[#A78BFA]",
    target: 5,
    xp_reward: 75,
    countQuery: async (supabase, userId, weekStart) => {
      const { count } = await supabase
        .from("content_pieces")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekStart.toISOString());
      return count ?? 0;
    },
  },
  {
    key: "ads_week",
    title: "Publiciste",
    description: "Crée 3 créatives publicitaires",
    icon: Megaphone,
    color: "text-info",
    target: 3,
    xp_reward: 75,
    countQuery: async (supabase, userId, weekStart) => {
      const { count } = await supabase
        .from("ad_creatives")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekStart.toISOString());
      return count ?? 0;
    },
  },
  {
    key: "community_week",
    title: "Membre actif",
    description: "Publie 2 posts dans la communauté",
    icon: MessageCircle,
    color: "text-info",
    target: 2,
    xp_reward: 50,
    countQuery: async (supabase, userId, weekStart) => {
      const { count } = await supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekStart.toISOString());
      return count ?? 0;
    },
  },
  {
    key: "streak_week",
    title: "Regularite",
    description: "Maintiens un streak de 5 jours",
    icon: Flame,
    color: "text-danger",
    target: 5,
    xp_reward: 100,
    countQuery: async (supabase, userId) => {
      const { data } = await supabase
        .from("profiles")
        .select("streak_days")
        .eq("id", userId)
        .single();
      return data?.streak_days ?? 0;
    },
  },
  {
    key: "academy_week",
    title: "Étudiant assidu",
    description: "Regarde 3 videos Academy",
    icon: BookOpen,
    color: "text-accent",
    target: 3,
    xp_reward: 60,
    countQuery: async (supabase, userId, weekStart) => {
      const { count } = await supabase
        .from("video_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("watched", true)
        .gte("watched_at", weekStart.toISOString());
      return count ?? 0;
    },
  },
];

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Lundi = debut de semaine
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekKey(): string {
  const weekStart = getWeekStart();
  return `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() - 1) / 7) + 1}`;
}

export function WeeklyChallenges() {
  const { user, profile, loading: userLoading } = useUser();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingChallenge, setClaimingChallenge] = useState<string | null>(null);

  useEffect(() => {
    if (!user || userLoading) return;

    const fetchChallenges = async () => {
      setLoading(true);
      const supabase = createClient();
      const weekStart = getWeekStart();
      const weekKey = getWeekKey();

      // Charger les défis complétés cette semaine
      const { data: completedData } = await supabase
        .from("challenge_completions")
        .select("challenge_key")
        .eq("user_id", user.id)
        .eq("week_key", weekKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completedKeys = new Set(
        ((completedData ?? []) as any[]).map((c: any) => c.challenge_key)
      );

      // Sélectionner 4 défis pour cette semaine (rotation basée sur l'ID utilisateur)
      const userSeed = user.id.charCodeAt(0) + user.id.charCodeAt(1);
      const weekSeed = weekStart.getTime();
      const combinedSeed = (userSeed + weekSeed) % CHALLENGE_DEFINITIONS.length;

      const selectedDefs = [
        ...CHALLENGE_DEFINITIONS.slice(combinedSeed),
        ...CHALLENGE_DEFINITIONS.slice(0, combinedSeed),
      ].slice(0, 4);

      // Calculer la progression de chaque defi
      const challengePromises = selectedDefs.map(async (def) => {
        const current = await def.countQuery(supabase, user.id, weekStart);
        return {
          id: `${weekKey}-${def.key}`,
          key: def.key,
          title: def.title,
          description: def.description,
          icon: def.icon,
          color: def.color,
          target: def.target,
          current: Math.min(current, def.target),
          xp_reward: def.xp_reward,
          completed: completedKeys.has(def.key),
        };
      });

      const results = await Promise.all(challengePromises);
      setChallenges(results);
      setLoading(false);
    };

    fetchChallenges();
  }, [user, userLoading]);

  const handleClaimReward = async (challenge: Challenge) => {
    if (!user || challenge.completed || challenge.current < challenge.target) return;

    setClaimingChallenge(challenge.key);
    const supabase = createClient();
    const weekKey = getWeekKey();

    // Enregistrer la completion
    const { error: insertError } = await supabase
      .from("challenge_completions")
      .insert({
        user_id: user.id,
        challenge_key: challenge.key,
        week_key: weekKey,
        xp_awarded: challenge.xp_reward,
      });

    if (insertError) {
      toast.error("Erreur lors de la reclamation");
      setClaimingChallenge(null);
      return;
    }

    // Attribuer les XP
    await fetch("/api/gamification/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityType: "challenge.completed",
        xpOverride: challenge.xp_reward,
      }),
    });

    // Mettre à jour l'UI
    setChallenges((prev) =>
      prev.map((c) =>
        c.key === challenge.key ? { ...c, completed: true } : c
      )
    );

    toast.success(`+${challenge.xp_reward} XP ! Défi "${challenge.title}" accompli !`);
    setClaimingChallenge(null);
  };

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalXP = challenges.reduce((sum, c) => sum + (c.completed ? c.xp_reward : 0), 0);
  const maxXP = challenges.reduce((sum, c) => sum + c.xp_reward, 0);

  if (loading || userLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Défis de la semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Défis de la semaine
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="muted" className="gap-1">
              <Trophy className="h-3 w-3" />
              {completedCount}/{challenges.length}
            </Badge>
            <Badge variant="default" className="gap-1">
              <Zap className="h-3 w-3" />
              {totalXP}/{maxXP} XP
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {challenges.map((challenge) => {
            const Icon = challenge.icon;
            const progress = (challenge.current / challenge.target) * 100;
            const isReady = challenge.current >= challenge.target && !challenge.completed;
            const isClaiming = claimingChallenge === challenge.key;

            return (
              <div
                key={challenge.id}
                className={cn(
                  "relative p-4 rounded-xl border transition-all",
                  challenge.completed
                    ? "bg-accent/5 border-accent/20"
                    : isReady
                      ? "bg-accent/10 border-accent/40 cursor-pointer hover:border-accent/60"
                      : "bg-bg-tertiary border-border-default"
                )}
                onClick={() => isReady && handleClaimReward(challenge)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                      challenge.completed ? "bg-accent/20" : "bg-bg-secondary"
                    )}
                  >
                    {challenge.completed ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : (
                      <Icon className={cn("h-5 w-5", challenge.color)} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={cn(
                          "text-sm font-medium",
                          challenge.completed
                            ? "text-text-muted line-through"
                            : "text-text-primary"
                        )}
                      >
                        {challenge.title}
                      </h4>
                      {challenge.completed && (
                        <Badge variant="cyan" className="text-[10px]">
                          Termine
                        </Badge>
                      )}
                      {isReady && !isClaiming && (
                        <Badge variant="default" className="text-[10px] gap-0.5 animate-pulse">
                          <Gift className="h-2.5 w-2.5" />
                          Reclamer
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mb-2">
                      {challenge.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={progress}
                        className={cn("h-1.5 flex-1", challenge.completed && "opacity-50")}
                      />
                      <span className="text-[10px] text-text-muted shrink-0">
                        {challenge.current}/{challenge.target}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        challenge.completed ? "text-accent" : "text-text-muted"
                      )}
                    >
                      +{challenge.xp_reward} XP
                    </span>
                  </div>
                </div>

                {isClaiming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/80 rounded-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
