import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Google Calendar: Sync daily plan actions as events ───
// POST /api/integrations/google-calendar/sync-daily-plan

interface DailyAction {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  category?: string;
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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { date, actions } = (await req.json()) as {
      date: string;
      actions: DailyAction[];
    };

    if (!actions || actions.length === 0) {
      return NextResponse.json(
        { error: "Aucune action à synchroniser" },
        { status: 400 },
      );
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
        {
          error: "Google Calendar non connecté",
          hint: "Connecte ton Google Agenda dans les paramètres",
        },
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
          },
          { status: 401 },
        );
      }
    }

    // Create events for each action, stacked sequentially starting at 9:00 AM
    const baseDate = date || new Date().toISOString().split("T")[0];
    let currentStartMinutes = 9 * 60; // 9:00 AM in minutes

    const createdEvents: string[] = [];

    for (const action of actions) {
      const startHour = Math.floor(currentStartMinutes / 60);
      const startMin = currentStartMinutes % 60;
      const endMinutes = currentStartMinutes + (action.duration_minutes || 30);
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;

      const startDateTime = `${baseDate}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00`;
      const endDateTime = `${baseDate}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;

      const event = {
        summary: `[ScalingFlow] ${action.title}`,
        description: action.description
          ? `${action.description}\n\nCatégorie: ${action.category || "Général"}\nDurée: ${action.duration_minutes} min`
          : `Durée: ${action.duration_minutes} min`,
        start: { dateTime: startDateTime, timeZone: "Europe/Paris" },
        end: { dateTime: endDateTime, timeZone: "Europe/Paris" },
        colorId: "2", // Sage green
      };

      const calRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        },
      );

      if (calRes.ok) {
        const created = await calRes.json();
        createdEvents.push(created.id);
      }

      currentStartMinutes = endMinutes + 5; // 5-minute gap between actions
    }

    return NextResponse.json({
      success: true,
      events_created: createdEvents.length,
      total_actions: actions.length,
    });
  } catch (error) {
    console.error("Google Calendar sync error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 },
    );
  }
}
