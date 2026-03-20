import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOAuthState } from "@/lib/utils/oauth-state";

// ─── GoHighLevel OAuth: Callback Handler ─────────────────────
// GET /api/integrations/crm-connect/callback?code=xxx&state=xxx

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/settings?error=ghl_missing_params`,
      );
    }

    // SECURITY: Verify HMAC-signed state to prevent CSRF
    const stateUserId = verifyOAuthState(state);
    if (!stateUserId) {
      return NextResponse.redirect(
        `${appUrl}/settings?error=ghl_invalid_state`,
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== stateUserId) {
      return NextResponse.redirect(
        `${appUrl}/settings?error=ghl_auth_mismatch`,
      );
    }

    // Exchange code for tokens
    const tokenRes = await fetch(
      "https://services.leadconnectorhq.com/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GHL_CLIENT_ID!,
          client_secret: process.env.GHL_CLIENT_SECRET!,
          grant_type: "authorization_code",
          code,
          redirect_uri: `${appUrl}/api/integrations/crm-connect/callback`,
        }),
      },
    );

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(`${appUrl}/settings?error=ghl_token_error`);
    }

    // Store in connected_accounts
    await supabase.from("connected_accounts").upsert(
      {
        user_id: user.id,
        provider: "ghl",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(
          Date.now() + (tokenData.expires_in || 86400) * 1000,
        ).toISOString(),
        provider_account_id:
          tokenData.locationId || tokenData.companyId || null,
        provider_user_id: tokenData.userId || null,
        scopes: tokenData.scope?.split(" ") || [],
        metadata: {
          locationId: tokenData.locationId,
          companyId: tokenData.companyId,
          userType: tokenData.userType,
        },
      },
      { onConflict: "user_id,provider" },
    );

    return NextResponse.redirect(`${appUrl}/settings?success=ghl_connected`);
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?error=ghl_error`);
  }
}
