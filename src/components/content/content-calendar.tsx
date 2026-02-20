"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MOCK_EVENTS: Record<string, { title: string; type: string; platform: string }[]> = {
  "3": [{ title: "Post LinkedIn - Étude de cas", type: "post", platform: "linkedin" }],
  "5": [{ title: "Thread Twitter - Astuces IA", type: "thread", platform: "twitter" }],
  "8": [{ title: "Carousel Instagram", type: "carousel", platform: "instagram" }],
  "10": [{ title: "Post LinkedIn - Résultats", type: "post", platform: "linkedin" }],
  "12": [{ title: "Vidéo courte - Tips", type: "video", platform: "instagram" }],
  "15": [{ title: "Newsletter", type: "email", platform: "email" }],
  "17": [{ title: "Post LinkedIn - Story", type: "post", platform: "linkedin" }],
  "20": [
    { title: "Thread Twitter", type: "thread", platform: "twitter" },
    { title: "Post Instagram", type: "post", platform: "instagram" },
  ],
  "22": [{ title: "Post LinkedIn - Méthode", type: "post", platform: "linkedin" }],
  "25": [{ title: "Carousel LinkedIn", type: "carousel", platform: "linkedin" }],
  "28": [{ title: "Newsletter mensuelle", type: "email", platform: "email" }],
};

interface ContentCalendarProps {
  className?: string;
}

export function ContentCalendar({ className }: ContentCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const monthName = currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const platformColor: Record<string, "default" | "blue" | "cyan" | "purple" | "muted"> = {
    linkedin: "blue",
    twitter: "cyan",
    instagram: "purple",
    email: "default",
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize">{monthName}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(new Date(year, month + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-text-muted py-2 font-medium">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            const events = day ? MOCK_EVENTS[String(day)] : undefined;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[80px] p-1.5 rounded-lg border transition-all",
                  day ? "border-border-default bg-bg-secondary hover:border-border-hover" : "border-transparent",
                  isToday && "border-neon-orange/50 bg-neon-orange/5"
                )}
              >
                {day && (
                  <>
                    <span className={cn(
                      "text-xs font-medium",
                      isToday ? "text-neon-orange" : "text-text-muted"
                    )}>
                      {day}
                    </span>
                    {events && (
                      <div className="mt-1 space-y-0.5">
                        {events.map((e, j) => (
                          <Badge
                            key={j}
                            variant={platformColor[e.platform] || "muted"}
                            className="text-[10px] px-1 py-0 block truncate"
                          >
                            {e.title}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
