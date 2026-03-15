"use client";

import { PageHeader } from "@/components/layout/page-header";
import { GoogleCalendarWidget } from "@/components/calendar/google-calendar-widget";
import { EditorialCalendar } from "@/components/content/editorial-calendar";

export default function CalendarPage() {
  return (
    <div>
      <PageHeader
        title="Calendrier"
        description="Ton planning et ton calendrier éditorial réunis."
      />

      <div className="space-y-6">
        {/* Google Calendar events */}
        <GoogleCalendarWidget />

        {/* Editorial calendar */}
        <EditorialCalendar />
      </div>
    </div>
  );
}
