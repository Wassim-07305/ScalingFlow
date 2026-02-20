"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Sophie M.", xp: 12450, streak: 45, change: "up", level: 15 },
  { rank: 2, name: "Thomas D.", xp: 11200, streak: 32, change: "up", level: 14 },
  { rank: 3, name: "Julie L.", xp: 10800, streak: 28, change: "same", level: 13 },
  { rank: 4, name: "Marc B.", xp: 9500, streak: 21, change: "down", level: 12 },
  { rank: 5, name: "Emma R.", xp: 8900, streak: 19, change: "up", level: 11 },
  { rank: 6, name: "Lucas P.", xp: 7600, streak: 15, change: "same", level: 10 },
  { rank: 7, name: "Camille V.", xp: 6300, streak: 14, change: "up", level: 9 },
  { rank: 8, name: "Antoine G.", xp: 5100, streak: 12, change: "down", level: 8 },
  { rank: 9, name: "Léa F.", xp: 4200, streak: 9, change: "same", level: 7 },
  { rank: 10, name: "Hugo N.", xp: 3800, streak: 7, change: "up", level: 6 },
];

interface LeaderboardTableProps {
  className?: string;
}

export function LeaderboardTable({ className }: LeaderboardTableProps) {
  const rankColors: Record<number, string> = {
    1: "text-yellow-400",
    2: "text-gray-300",
    3: "text-amber-600",
  };

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
          {MOCK_LEADERBOARD.map((user) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
