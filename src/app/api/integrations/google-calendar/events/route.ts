import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Google Calendar: Fetch upcoming events (next 30 days) ───
// GET /api/integrations/google-calendar/events

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    if (data.error) return null;
    return { access_token: data.access_token, expires_in: data.expires_in };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get Google Calendar connection
    const { data: connection } = await supabase
      .from("connected_accounts")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", user.id)
      .eq("provider", "google_calendar")
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: "Google Calendar non connecté", connected: false },
        { status: 404 },
      );
    }

    let accessToken = connection.access_token;

    // Refresh token if expired
    const expiresAt = connection.token_expires_at
      ? new Date(connection.token_expires_at).getTime()
      : 0;

    if (Date.now() > expiresAt - 60_000 && connection.refresh_token) {
      const refreshed = await refreshAccessToken(connection.refresh_token);
      if (refreshed) {
        accessToken = refreshed.access_token;

        // Update stored token
        await supabase
          .from("connected_accounts")
          .update({
            access_token: refreshed.access_token,
            token_expires_at: new Date(
              Date.now() + refreshed.expires_in * 1000,
            ).toISOString(),
          })
          .eq("user_id", user.id)
          .eq("provider", "google_calendar");
      } else {
        return NextResponse.json(
          {
            error:
              "Impossible de rafraîchir le token. Reconnecte Google Calendar.",
            connected: false,
          },
          { status: 401 },
        );
      }
    }

    // Fetch events from Google Calendar API
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const calUrl = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    );
    calUrl.searchParams.set("timeMin", now.toISOString());
    calUrl.searchParams.set("timeMax", in30Days.toISOString());
    calUrl.searchParams.set("singleEvents", "true");
    calUrl.searchParams.set("orderBy", "startTime");
    calUrl.searchParams.set("maxResults", "100");

    const calRes = await fetch(calUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!calRes.ok) {
      if (calRes.status === 401) {
        return NextResponse.json(
          {
            error: "Token expiré. Reconnecte Google Calendar.",
            connected: false,
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: "Erreur Google Calendar API" },
        { status: 502 },
      );
    }

    const calData = await calRes.json();
    const items: GoogleCalendarEvent[] = calData.items || [];

    const events: CalendarEvent[] = items.map((item) => ({
      id: item.id,
      title: item.summary || "Sans titre",
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      location: item.location || "",
      description: item.description || "",
    }));

    return NextResponse.json({ events, connected: true });
  } catch (error) {
    console.error("Google Calendar events error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des événements" },
      { status: 500 },
    );
  }
}
