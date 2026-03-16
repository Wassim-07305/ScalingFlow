import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Google Calendar OAuth: Disconnect ───────────────────────
// POST /api/integrations/google-calendar/disconnect

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Optionally revoke token at Google
    const { data: connection } = await supabase
      .from("connected_accounts")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("provider", "google_calendar")
      .single();

    if (connection?.access_token) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${connection.access_token}`,
          { method: "POST" },
        );
      } catch {
        // Revocation failure is non-critical
      }
    }

    // Delete from connected_accounts
    await supabase
      .from("connected_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "google_calendar");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion" },
      { status: 500 },
    );
  }
}
