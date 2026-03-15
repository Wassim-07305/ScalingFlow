"use client";

import { GoogleCalendarWidget } from "@/components/calendar/google-calendar-widget";
import { EditorialCalendar } from "@/components/content/editorial-calendar";
import { CalendarDays, Sparkles } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border-default/50 bg-gradient-to-br from-accent/5 via-bg-secondary to-bg-secondary p-6 md:p-8 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <CalendarDays className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Calendrier
              </h1>
              <p className="text-sm text-text-secondary">
                Ton planning et ton calendrier éditorial réunis au même endroit.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Google Calendar section */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <CalendarDays className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Google Calendar
            </h2>
          </div>
          <GoogleCalendarWidget />
        </section>

        {/* Editorial calendar section */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <Sparkles className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Calendrier éditorial
            </h2>
          </div>
          <EditorialCalendar />
        </section>
      </div>
    </div>
  );
}
