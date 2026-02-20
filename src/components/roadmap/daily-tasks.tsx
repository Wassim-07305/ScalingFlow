"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Clock, Flame } from "lucide-react";

const MOCK_TASKS = [
  { id: 1, title: "Finaliser la page d'opt-in", category: "funnel", priority: "high", completed: false, duration: "30 min" },
  { id: 2, title: "Enregistrer la vidéo VSL", category: "assets", priority: "high", completed: false, duration: "2h" },
  { id: 3, title: "Publier 1 post LinkedIn", category: "content", priority: "medium", completed: true, duration: "15 min" },
  { id: 4, title: "Optimiser les créatives Meta", category: "ads", priority: "medium", completed: false, duration: "45 min" },
  { id: 5, title: "Regarder module 3 Academy", category: "academy", priority: "low", completed: true, duration: "30 min" },
  { id: 6, title: "Répondre aux leads", category: "sales", priority: "high", completed: false, duration: "20 min" },
];

interface DailyTasksProps {
  className?: string;
}

export function DailyTasks({ className }: DailyTasksProps) {
  const [tasks, setTasks] = React.useState(MOCK_TASKS);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  const priorityColor: Record<string, string> = {
    high: "text-neon-red",
    medium: "text-neon-orange",
    low: "text-neon-cyan",
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-neon-orange" />
            Tâches du jour
          </CardTitle>
          <Badge variant="default">
            <Flame className="h-3 w-3 mr-1" />
            {completedCount}/{tasks.length}
          </Badge>
        </div>
        <div className="w-full h-2 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-orange to-neon-cyan transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                task.completed ? "bg-bg-tertiary/50 opacity-60" : "bg-bg-tertiary hover:bg-bg-tertiary/80"
              )}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
              />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  task.completed ? "text-text-muted line-through" : "text-text-primary"
                )}>
                  {task.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />
                  {task.duration}
                </span>
                <span className={cn("text-xs font-medium", priorityColor[task.priority])}>
                  {task.priority === "high" ? "!!!" : task.priority === "medium" ? "!!" : "!"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
