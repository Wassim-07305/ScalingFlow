"use client";

import React, { useEffect, useState, useMemo} from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface CalendarEvent {
  title: string;
  type: string;
  platform: string;
}

const typeToColor: Record<
  string,
  "default" | "blue" | "cyan" | "purple" | "muted"
> = {
  instagram_reel: "purple",
  instagram_story: "purple",
  instagram_carousel: "purple",
  instagram_post: "purple",
  youtube_video: "default",
  youtube_short: "default",
  linkedin_post: "blue",
  tiktok_video: "cyan",
  blog_post: "muted",
  strategy: "blue",
  reels: "purple",
  youtube: "default",
  stories: "purple",
  carousel: "purple",
  editorial: "muted",
};

interface ContentCalendarProps {
  className?: string;
}

export function ContentCalendar({ className }: ContentCalendarProps) {
  const { user } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchContent = async () => {
      setLoading(true);
      const supabase = createClient();

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from("content_pieces")
        .select("title, content_type, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: true });

      const grouped: Record<string, CalendarEvent[]> = {};
      for (const item of data ?? []) {
        const day = String(new Date(item.created_at).getDate());
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({
          title: item.title || item.content_type || "Contenu",
          type: item.content_type || "post",
          platform: item.content_type || "post",
        });
      }

      setEvents(grouped);
      setLoading(false);
    };

    fetchContent();
  }, [user, currentMonth]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const monthName = currentMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs text-text-muted py-2 font-medium"
              >
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              const dayEvents = day ? events[String(day)] : undefined;
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[80px] p-1.5 rounded-lg border transition-all",
                    day
                      ? "border-border-default bg-bg-secondary hover:border-border-hover"
                      : "border-transparent",
                    isToday && "border-accent/50 bg-accent/5",
                  )}
                >
                  {day && (
                    <>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isToday ? "text-accent" : "text-text-muted",
                        )}
                      >
                        {day}
                      </span>
                      {dayEvents && (
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.map((e, j) => (
                            <Badge
                              key={j}
                              variant={typeToColor[e.platform] || "muted"}
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
        )}
      </CardContent>
    </Card>
  );
}
