import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOAuthState } from "@/lib/utils/oauth-state";

// ─── Google Calendar OAuth: Callback Handler ─────────────────
// GET /api/integrations/google-calendar/callback

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${appUrl}/settings?tab=integrations&error=google_calendar_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/settings?tab=integrations&error=google_calendar_missing_params`
      );
    }

    // SECURITY: Verify HMAC-signed state to prevent CSRF
    const stateUserId = verifyOAuthState(state);
    if (!stateUserId) {
      return NextResponse.redirect(
        `${appUrl}/settings?tab=integrations&error=google_calendar_invalid_state`
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== stateUserId) {
      return NextResponse.redirect(
        `${appUrl}/settings?tab=integrations&error=google_calendar_auth_mismatch`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      return NextResponse.redirect(
        `${appUrl}/settings?tab=integrations&error=google_calendar_config_error`
      );
    }

    const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("Google Calendar token error:", tokenData);
      return NextResponse.redirect(
        `${appUrl}/settings?tab=integrations&error=google_calendar_token_error`
      );
    }

    const accessToken = tokenData.access_token as string;
    const refreshToken = (tokenData.refresh_token as string) || null;
    const expiresIn = (tokenData.expires_in as number) || 3600;

    // Get user email for display
    let email = "";
    try {
      const profileRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const profile = await profileRes.json();
      email = profile.email || "";
    } catch {
      // Profile fetch failed, continue without it
    }

    // Store in connected_accounts
    await supabase.from("connected_accounts").upsert(
      {
        user_id: user.id,
        provider: "google_calendar",
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: new Date(
          Date.now() + expiresIn * 1000
        ).toISOString(),
        provider_user_id: email,
        provider_username: email,
        scopes: [
          "calendar.readonly",
          "calendar.events",
        ],
        metadata: { raw_scopes: tokenData.scope },
      },
      { onConflict: "user_id,provider" }
    );

    return NextResponse.redirect(
      `${appUrl}/settings?tab=integrations&success=google_calendar_connected`
    );
  } catch (err) {
    console.error("Google Calendar callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/settings?tab=integrations&error=google_calendar_error`
    );
  }
}
