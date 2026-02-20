"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Flame, Zap, Trophy, Star, Target, BookOpen, Megaphone, PenTool } from "lucide-react";

const MOCK_DATA = {
  totalXp: 3450,
  level: 7,
  nextLevelXp: 5000,
  streak: 12,
  badges: 5,
  rank: 23,
  modules: [
    { name: "Onboarding", icon: Target, progress: 100, color: "text-accent" },
    { name: "Offre", icon: Star, progress: 85, color: "text-accent" },
    { name: "Funnel", icon: Target, progress: 40, color: "text-info" },
    { name: "Academy", icon: BookOpen, progress: 58, color: "text-accent" },
    { name: "Ads", icon: Megaphone, progress: 25, color: "text-[#A78BFA]" },
    { name: "Contenu", icon: PenTool, progress: 10, color: "text-accent" },
  ],
};

interface ProgressOverviewProps {
  className?: string;
}

export function ProgressOverview({ className }: ProgressOverviewProps) {
  const levelProgress = (MOCK_DATA.totalXp / MOCK_DATA.nextLevelXp) * 100;

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
                  <AnimatedCounter value={MOCK_DATA.totalXp} />
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Niveau {MOCK_DATA.level}</span>
                <span>Niveau {MOCK_DATA.level + 1}</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
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
                  <AnimatedCounter value={MOCK_DATA.streak} /> jours
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
                  #<AnimatedCounter value={MOCK_DATA.rank} />
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
            {MOCK_DATA.modules.map((mod) => (
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges obtenus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {["Explorateur", "Premier pas", "Créateur", "Stratège", "Flamme"].map((badge, i) => (
              <div key={badge} className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  i < MOCK_DATA.badges ? "bg-accent/15" : "bg-bg-tertiary opacity-40"
                )}>
                  <Star className={cn(
                    "h-7 w-7",
                    i < MOCK_DATA.badges ? "text-accent" : "text-text-muted"
                  )} />
                </div>
                <span className="text-[10px] text-text-muted">{badge}</span>
              </div>
            ))}
            {["Scaler", "Expert", "Légende"].map((badge) => (
              <div key={badge} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-bg-tertiary opacity-40">
                  <Star className="h-7 w-7 text-text-muted" />
                </div>
                <span className="text-[10px] text-text-muted">{badge}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
