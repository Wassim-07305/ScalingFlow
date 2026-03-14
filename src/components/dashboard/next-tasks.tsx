"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Play,
  BookOpen,
  RotateCcw,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string;
  task_type: "action" | "video" | "review" | "launch";
  related_module: string;
  estimated_minutes: number;
  completed: boolean;
  task_order: number;
}

const taskTypeConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  action: { icon: Play, color: "text-accent", label: "Action" },
  video: { icon: BookOpen, color: "text-info", label: "Video" },
  review: { icon: RotateCcw, color: "text-[#A78BFA]", label: "Revision" },
  launch: { icon: Rocket, color: "text-accent", label: "Lancement" },
};

export function NextTasks() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .eq("completed", false)
          .order("task_order", { ascending: true })
          .limit(5);

        if (data) setTasks(data as Task[]);
      } catch {
        // Show empty tasks rather than infinite skeleton
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const toggleTask = async (taskId: string) => {
    const supabase = createClient();
    await supabase.from("tasks").update({ completed: true }).eq("id", taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-accent" />
            Prochaines tâches
          </CardTitle>
          <Link href="/roadmap">
            <Button variant="ghost" size="sm">
              Voir tout
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-bg-tertiary animate-pulse"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              Toutes les tâches sont complétées !
            </p>
            <Link href="/roadmap">
              <Button variant="outline" size="sm" className="mt-3">
                Générer une nouvelle roadmap
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const config = taskTypeConfig[task.task_type] || taskTypeConfig.action;
              const TypeIcon = config.icon;

              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 py-3 px-2 rounded-lg hover:bg-bg-tertiary transition-colors group"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-0.5 shrink-0"
                  >
                    <Circle className="h-5 w-5 text-text-muted group-hover:text-accent transition-colors" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="muted"
                        className={cn("text-[10px] gap-1", config.color)}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        {task.estimated_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
