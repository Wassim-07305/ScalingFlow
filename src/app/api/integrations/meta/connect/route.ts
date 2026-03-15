import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOAuthState } from "@/lib/utils/oauth-state";

// ─── Meta Ads OAuth: Start Flow ──────────────────────────────
// GET /api/integrations/meta/connect
// Redirects user to Facebook Login with required permissions

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const clientId = process.env.META_APP_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "META_APP_ID non configure" },
        { status: 500 }
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/meta/callback`;
    const scopes = [
      "ads_management",
      "ads_read",
      "business_management",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_manage_insights",
    ].join(",");

    // SECURITY: HMAC-signed state to prevent CSRF
    const state = createOAuthState(user.id);

    const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    return NextResponse.redirect(authUrl.toString());
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la connexion Meta" },
      { status: 500 }
    );
  }
}
