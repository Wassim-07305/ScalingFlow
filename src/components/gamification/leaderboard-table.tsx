"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, TrendingUp, TrendingDown, Minus, ChevronDown, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

interface LeaderboardEntry {
  rank: number;
  name: string;
  userId: string;
  xp: number;
  streak: number;
  level: number;
  change: "up" | "down" | "same";
}

interface LeaderboardTableProps {
  className?: string;
}

const PAGE_SIZE = 20;

export function LeaderboardTable({ className }: LeaderboardTableProps) {
  const { user } = useUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPage = async (offset: number) => {
    const supabase = createClient();

    const { data, error, count } = await supabase
      .from("leaderboard_scores")
      .select("*, profiles(id, full_name, avatar_url, level, streak_days, xp_points)", { count: "exact" })
      .order("composite_score", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data) return [];

    if (count !== null) setTotalCount(count);
    setHasMore((data?.length ?? 0) >= PAGE_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row: any, index: number) => {
      const profile = row.profiles as {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        level: number;
        streak_days: number;
        xp_points: number;
      } | null;

      const currentRank = offset + index + 1;
      const previousRank = (row.rank_position as number | null) ?? currentRank;
      const change: "up" | "down" | "same" =
        previousRank > currentRank ? "up" :
        previousRank < currentRank ? "down" : "same";

      return {
        rank: currentRank,
        name: profile?.full_name || "Anonyme",
        userId: profile?.id || row.user_id,
        xp: profile?.xp_points ?? row.progress_score ?? 0,
        streak: profile?.streak_days ?? 0,
        level: profile?.level ?? 1,
        change,
      } as LeaderboardEntry;
    });
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const supabase = createClient();

      const { data, error, count } = await supabase
        .from("leaderboard_scores")
        .select("*, profiles(id, full_name, avatar_url, level, streak_days, xp_points)", { count: "exact" })
        .order("composite_score", { ascending: false })
        .limit(PAGE_SIZE);

      if (!error && data && data.length > 0) {
        if (count !== null) setTotalCount(count);
        setHasMore(data.length >= PAGE_SIZE);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: LeaderboardEntry[] = (data as any[]).map((row: any, index: number) => {
          const profile = row.profiles as {
            id: string;
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
            userId: profile?.id || row.user_id,
            xp: profile?.xp_points ?? row.progress_score ?? 0,
            streak: profile?.streak_days ?? 0,
            level: profile?.level ?? 1,
            change,
          };
        });
        setEntries(mapped);

        // Update rank_position for next comparison (non-blocking)
        Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data as any[]).map((row: any, index: number) =>
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

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const newEntries = await fetchPage(entries.length);
    setEntries((prev) => [...prev, ...newEntries]);
    setLoadingMore(false);
  };

  const myEntry = user ? entries.find((e) => e.userId === user.id) : null;

  const rankColors: Record<number, string> = {
    1: "text-yellow-400",
    2: "text-gray-300",
    3: "text-amber-600",
  };

  // État vide : aucune donnée dans le classement
  if (!loading && entries.length === 0) {
    return (
      <Card className={className}>
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
    <div className={cn("space-y-4", className)}>
      {/* Your rank card */}
      {myEntry && (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Star className="h-5 w-5 text-accent" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Ta position</p>
                <p className="text-xs text-text-muted">
                  #{myEntry.rank} sur {totalCount} participants
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-accent">{myEntry.xp.toLocaleString("fr-FR")} XP</p>
                <p className="text-xs text-text-muted">Niveau {myEntry.level}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Classement Global
          {totalCount > 0 && (
            <span className="text-sm font-normal text-text-muted ml-auto">
              {totalCount} participant{totalCount > 1 ? "s" : ""}
            </span>
          )}
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
            entries.map((entry) => (
              <div
                key={entry.rank}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all",
                  entry.rank <= 3 ? "bg-accent/5 border border-accent/10" : "bg-bg-tertiary",
                  entry.userId === user?.id && "ring-1 ring-accent/40"
                )}
              >
                {/* Rank */}
                <span className={cn(
                  "w-8 text-center font-bold text-lg",
                  rankColors[entry.rank] || "text-text-muted"
                )}>
                  {entry.rank}
                </span>

                {/* Avatar */}
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-bg-tertiary text-text-secondary text-xs">
                    {entry.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                {/* Name + Level */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{entry.name}</p>
                  <p className="text-xs text-text-muted">Niveau {entry.level}</p>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-danger" />
                  <span className="text-xs text-text-muted">{entry.streak}j</span>
                </div>

                {/* XP */}
                <Badge variant="default" className="min-w-[80px] justify-center">
                  {entry.xp.toLocaleString("fr-FR")} XP
                </Badge>

                {/* Change */}
                {entry.change === "up" ? (
                  <TrendingUp className="h-4 w-4 text-accent" />
                ) : entry.change === "down" ? (
                  <TrendingDown className="h-4 w-4 text-danger" />
                ) : (
                  <Minus className="h-4 w-4 text-text-muted" />
                )}
              </div>
            ))
          )}
          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                <ChevronDown className={cn("h-4 w-4", loadingMore && "animate-bounce")} />
                {loadingMore ? "Chargement..." : "Voir plus"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
