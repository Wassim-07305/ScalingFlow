import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOAuthState } from "@/lib/utils/oauth-state";

// ─── GoHighLevel OAuth: Start Flow (#52) ─────────────────────
// GET /api/integrations/crm-connect/connect

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const clientId = process.env.GHL_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "GHL_CLIENT_ID non configure" },
        { status: 500 },
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/crm-connect/callback`;
    const scopes = [
      "contacts.readonly",
      "contacts.write",
      "opportunities.readonly",
      "opportunities.write",
      "locations.readonly",
    ].join(" ");

    const state = createOAuthState(user.id);

    const authUrl = new URL(
      "https://marketplace.gohighlevel.com/oauth/chooselocation",
    );
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    return NextResponse.redirect(authUrl.toString());
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la connexion GHL" },
      { status: 500 },
    );
  }
}
