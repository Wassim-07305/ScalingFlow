"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Clock, Flame, Loader2, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  task_type: "action" | "video" | "review" | "launch" | null;
  related_module: string | null;
  estimated_minutes: number | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  task_order: number | null;
  created_at: string;
}

function getPriority(taskType: Task["task_type"]): "high" | "medium" | "low" {
  if (taskType === "launch" || taskType === "action") return "high";
  if (taskType === "review") return "medium";
  if (taskType === "video") return "low";
  return "medium";
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h${remainder > 0 ? remainder : ""}`;
}

interface DailyTasksProps {
  className?: string;
  refreshKey?: number;
}

export function DailyTasks({ className, refreshKey }: DailyTasksProps) {
  const { user, loading: userLoading } = useUser();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("task_order", { ascending: true });

      if (error) {
        toast.error("Impossible de charger les tâches");
        setLoading(false);
        return;
      }

      setTasks(data ?? []);
      setLoading(false);
    };

    fetchTasks();
  }, [user, userLoading, supabase, refreshKey]);

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Only allow completing, not un-completing (prevents XP farming)
    if (task.completed) return;

    // Mise à jour optimiste
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: true,
              completed_at: new Date().toISOString(),
            }
          : t,
      ),
    );

    const { error } = await supabase
      .from("tasks")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      // Rollback en cas d'erreur
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: task.completed,
                completed_at: task.completed_at,
              }
            : t,
        ),
      );
      toast.error("Impossible de mettre à jour la tâche");
    } else {
      // Award XP when task is completed
      try {
        const res = await fetch("/api/gamification/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activityType: "task.completed" }),
        });
        if (res.ok) {
          toast.success("+20 XP — Tâche complétée !");
        }
      } catch {
        // XP award is non-blocking
      }
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const priorityColor: Record<string, string> = {
    high: "text-danger",
    medium: "text-accent",
    low: "text-accent",
  };

  if (loading || userLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Tâches du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary/30 animate-pulse"
              >
                <div className="h-4 w-4 rounded bg-bg-tertiary" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-bg-tertiary" />
                </div>
                <div className="h-4 w-12 rounded bg-bg-tertiary" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Tâches du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ListChecks className="h-10 w-10 text-text-muted/40 mb-3" />
            <p className="text-sm text-text-muted">
              Aucune tâche pour le moment. Tes tâches apparaîtront ici au fur et
              à mesure de ta progression.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Tâches du jour
          </CardTitle>
          <Badge variant="default">
            <Flame className="h-3 w-3 mr-1" />
            {completedCount}/{tasks.length}
          </Badge>
        </div>
        <div className="w-full h-2 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-accent transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => {
            const priority = getPriority(task.task_type);
            const duration = formatDuration(task.estimated_minutes);

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all",
                  task.completed
                    ? "bg-bg-tertiary/50 opacity-60"
                    : "bg-bg-tertiary hover:bg-bg-tertiary/80",
                )}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      task.completed
                        ? "text-text-muted line-through"
                        : "text-text-primary",
                    )}
                  >
                    {task.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {duration && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="h-3 w-3" />
                      {duration}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      priorityColor[priority],
                    )}
                  >
                    {priority === "high"
                      ? "!!!"
                      : priority === "medium"
                        ? "!!"
                        : "!"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
