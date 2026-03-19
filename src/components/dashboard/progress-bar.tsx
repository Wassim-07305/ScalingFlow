"use client";

import { useEffect, useState, useMemo} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
];

export function ProgressBar() {
  const { user, profile, loading: userLoading } = useUser();
  const [taskProgress, setTaskProgress] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const [completedRes, totalRes] = await Promise.all([
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("completed", true),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

        setTaskProgress({
          completed: completedRes.count ?? 0,
          total: totalRes.count ?? 0,
        });
      } catch {
        // Show empty state rather than infinite skeleton
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  const isLoading = userLoading || loading;
  const xp = profile?.xp_points ?? 0;
  const level = profile?.level ?? 1;

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold =
    LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const xpPercent =
    xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  const taskPercent =
    taskProgress.total > 0
      ? Math.round((taskProgress.completed / taskProgress.total) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* XP Progress */}
      <Card className="group transition-all duration-300 hover:border-accent/20 hover:shadow-[0_0_20px_rgba(52,211,153,0.06)]">
        <CardContent className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-bg-tertiary animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-20 rounded bg-bg-tertiary animate-pulse" />
                  <div className="h-3 w-16 rounded bg-bg-tertiary animate-pulse" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary animate-pulse" />
              <div className="h-3 w-40 rounded bg-bg-tertiary animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted transition-transform duration-300 group-hover:scale-110">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Niveau {level}
                  </p>
                  <p className="text-xs text-text-muted">{xp} XP total</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                {xpInLevel} / {xpNeeded} XP pour le niveau {level + 1}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Roadmap Progress */}
      <Card className="group transition-all duration-300 hover:border-info/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)]">
        <CardContent className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-bg-tertiary animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-bg-tertiary animate-pulse" />
                  <div className="h-3 w-20 rounded bg-bg-tertiary animate-pulse" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary animate-pulse" />
              <div className="h-3 w-24 rounded bg-bg-tertiary animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/12 transition-transform duration-300 group-hover:scale-110">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Progression roadmap
                  </p>
                  <p className="text-xs text-text-muted">
                    {taskProgress.completed} / {taskProgress.total} tâches
                  </p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-info transition-all duration-700"
                  style={{ width: `${taskPercent}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                {taskPercent}% complété
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
