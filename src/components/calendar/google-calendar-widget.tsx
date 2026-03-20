"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
  Link2,
  CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
}

interface GroupedEvents {
  date: string;
  label: string;
  events: CalendarEvent[];
}

function formatTime(isoString: string): string {
  if (!isoString) return "";
  // Handle all-day events (date only, no time)
  if (isoString.length === 10) return "Journée entière";
  const d = new Date(isoString);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.getTime() === today.getTime()) return "Aujourd'hui";
  if (d.getTime() === tomorrow.getTime()) return "Demain";

  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getDateKey(isoString: string): string {
  if (!isoString) return "";
  if (isoString.length === 10) return isoString;
  return isoString.split("T")[0];
}

function groupByDay(events: CalendarEvent[]): GroupedEvents[] {
  const groups: Map<string, CalendarEvent[]> = new Map();

  for (const evt of events) {
    const dateKey = getDateKey(evt.start);
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(evt);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, evts]) => ({
      date,
      label: formatDateLabel(date),
      events: evts,
    }));
}

// ─── Skeleton ───────────────────────────────────────────────
function EventSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-28 bg-bg-tertiary rounded" />
          <div className="space-y-2">
            <div className="h-[68px] bg-bg-tertiary/50 rounded-xl border border-border-default/30" />
            <div className="h-[68px] bg-bg-tertiary/50 rounded-xl border border-border-default/30" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Widget ─────────────────────────────────────────────────
export function GoogleCalendarWidget({ className }: { className?: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/integrations/google-calendar/events");
      const data = await res.json();

      if (data.connected === false || data.error?.includes("non configuré") || data.error?.includes("CLIENT_ID")) {
        setConnected(false);
        setEvents([]);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Erreur inconnue");
        return;
      }

      setConnected(true);
      setEvents(data.events || []);
    } catch {
      setError("Impossible de charger les événements.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const grouped = groupByDay(events);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-default/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <CalendarIcon className="h-4 w-4 text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">
            Google Calendar
          </h3>
          {connected && (
            <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Connecté
            </span>
          )}
        </div>
        {connected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="h-8 w-8 p-0 rounded-lg hover:bg-bg-tertiary"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-text-muted",
                refreshing && "animate-spin",
              )}
            />
          </Button>
        )}
      </div>

      <div className="p-5">
        {/* Loading state */}
        {loading && connected === null && <EventSkeleton />}

        {/* Not connected */}
        {!loading && connected === false && (
          <div className="text-center py-10 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <CalendarIcon className="h-7 w-7 text-accent" />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary mb-1">
                Connecte Google Calendar
              </p>
              <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
                Synchronise tes événements pour voir ton planning directement
                dans ScalingFlow.
              </p>
            </div>
            <Button
              onClick={() => {
                window.location.href =
                  "/api/integrations/google-calendar/connect";
              }}
              className="rounded-xl bg-accent hover:bg-accent/90 text-white"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Connecter Google Calendar
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {/* Connected, no events */}
        {!loading && connected && events.length === 0 && !error && (
          <div className="text-center py-10 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto">
              <CalendarX className="h-6 w-6 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-0.5">
                Aucun événement à venir
              </p>
              <p className="text-xs text-text-muted">
                Aucun événement dans les 30 prochains jours.
              </p>
            </div>
          </div>
        )}

        {/* Events list */}
        {!loading && connected && events.length > 0 && (
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.date} className="space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl border border-border-default/50 bg-bg-tertiary/30 hover:border-accent/20 hover:bg-bg-tertiary/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {evt.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                              <Clock className="h-3 w-3" />
                              {formatTime(evt.start)}
                              {evt.end &&
                                evt.start.length > 10 &&
                                ` — ${formatTime(evt.end)}`}
                            </span>
                            {evt.location && (
                              <span className="inline-flex items-center gap-1 text-xs text-text-muted truncate max-w-[180px]">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={`https://calendar.google.com/calendar/event?eid=${btoa(evt.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Ouvrir ${evt.title} dans Google Calendar`}
                          className="p-1.5 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-bg-tertiary"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-text-muted hover:text-accent" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refreshing indicator */}
        {refreshing && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          </div>
        )}
      </div>
    </div>
  );
}
