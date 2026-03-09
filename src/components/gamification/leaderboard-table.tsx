"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  level: number;
  change: "up" | "down" | "same";
}

interface LeaderboardTableProps {
  className?: string;
}

export function LeaderboardTable({ className }: LeaderboardTableProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("leaderboard_scores")
        .select("*, profiles(full_name, avatar_url, level, streak_days, xp_points)")
        .order("composite_score", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mapped: LeaderboardEntry[] = data.map((row, index) => {
          const profile = row.profiles as {
            full_name: string | null;
            avatar_url: string | null;
            level: number;
            streak_days: number;
            xp_points: number;
          } | null;

          const currentRank = index + 1;
          const previousRank = (row.rank_position as number | null) ?? currentRank;
          const change: "up" | "down" | "same" =
            previousRank > currentRank ? "up" :
            previousRank < currentRank ? "down" : "same";

          return {
            rank: currentRank,
            name: profile?.full_name || "Anonyme",
            xp: profile?.xp_points ?? row.progress_score ?? 0,
            streak: profile?.streak_days ?? 0,
            level: profile?.level ?? 1,
            change,
          };
        });
        setEntries(mapped);

        // Update rank_position for next comparison (non-blocking)
        Promise.all(
          data.map((row, index) =>
            supabase
              .from("leaderboard_scores")
              .update({ rank_position: index + 1 })
              .eq("id", row.id)
          )
        ).catch(() => {});
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const rankColors: Record<number, string> = {
    1: "text-yellow-400",
    2: "text-gray-300",
    3: "text-amber-600",
  };

  // Etat vide : aucune donnee dans le classement
  if (!loading && entries.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Classement Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-text-muted/30 mb-4" />
            <p className="text-text-muted text-sm">
              Le classement sera disponible bientôt.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Classement Global
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl bg-bg-tertiary animate-pulse"
              >
                <span className="w-8 h-6 bg-bg-tertiary rounded" />
                <div className="h-9 w-9 rounded-full bg-bg-tertiary" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-24 bg-bg-tertiary rounded" />
                  <div className="h-3 w-16 bg-bg-tertiary rounded" />
                </div>
                <div className="h-4 w-12 bg-bg-tertiary rounded" />
                <div className="h-6 w-20 bg-bg-tertiary rounded" />
                <div className="h-4 w-4 bg-bg-tertiary rounded" />
              </div>
            ))
          ) : (
            entries.map((user) => (
              <div
                key={user.rank}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all",
                  user.rank <= 3 ? "bg-accent/5 border border-accent/10" : "bg-bg-tertiary"
                )}
              >
                {/* Rank */}
                <span className={cn(
                  "w-8 text-center font-bold text-lg",
                  rankColors[user.rank] || "text-text-muted"
                )}>
                  {user.rank}
                </span>

                {/* Avatar */}
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-bg-tertiary text-text-secondary text-xs">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                {/* Name + Level */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{user.name}</p>
                  <p className="text-xs text-text-muted">Niveau {user.level}</p>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-danger" />
                  <span className="text-xs text-text-muted">{user.streak}j</span>
                </div>

                {/* XP */}
                <Badge variant="default" className="min-w-[80px] justify-center">
                  {user.xp.toLocaleString("fr-FR")} XP
                </Badge>

                {/* Change */}
                {user.change === "up" ? (
                  <TrendingUp className="h-4 w-4 text-accent" />
                ) : user.change === "down" ? (
                  <TrendingDown className="h-4 w-4 text-danger" />
                ) : (
                  <Minus className="h-4 w-4 text-text-muted" />
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
