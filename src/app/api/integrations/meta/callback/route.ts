import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOAuthState } from "@/lib/utils/oauth-state";

// ─── Meta Ads OAuth: Callback Handler ────────────────────────
// GET /api/integrations/meta/callback?code=xxx&state=xxx

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    if (error) {
      return NextResponse.redirect(`${appUrl}/settings?error=meta_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/settings?error=meta_missing_params`,
      );
    }

    // SECURITY: Verify HMAC-signed state to prevent CSRF
    const stateUserId = verifyOAuthState(state);
    if (!stateUserId) {
      return NextResponse.redirect(
        `${appUrl}/settings?error=meta_invalid_state`,
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== stateUserId) {
      return NextResponse.redirect(
        `${appUrl}/settings?error=meta_auth_mismatch`,
      );
    }

    // Exchange code for access token
    const tokenUrl = new URL(`${META_GRAPH_URL}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
    tokenUrl.searchParams.set(
      "redirect_uri",
      `${appUrl}/api/integrations/meta/callback`,
    );
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(`${appUrl}/settings?error=meta_token_error`);
    }

    // Exchange for long-lived token (60 days)
    const longLivedUrl = new URL(`${META_GRAPH_URL}/oauth/access_token`);
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    longLivedUrl.searchParams.set(
      "client_secret",
      process.env.META_APP_SECRET!,
    );
    longLivedUrl.searchParams.set("fb_exchange_token", tokenData.access_token);

    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedRes.json();

    const accessToken = longLivedData.access_token || tokenData.access_token;
    const expiresIn = longLivedData.expires_in || 5184000; // 60 days default

    // Get user's ad accounts
    const meRes = await fetch(
      `${META_GRAPH_URL}/me?fields=id,name&access_token=${accessToken}`,
    );
    const meData = await meRes.json();

    const adAccountsRes = await fetch(
      `${META_GRAPH_URL}/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`,
    );
    const adAccountsData = await adAccountsRes.json();
    const adAccounts = adAccountsData.data || [];

    // Use first active ad account
    const activeAccount =
      adAccounts.find(
        (a: { account_status: number }) => a.account_status === 1,
      ) || adAccounts[0];

    const adAccountId = activeAccount?.id?.replace("act_", "") || "";

    // Store in connected_accounts
    await supabase.from("connected_accounts").upsert(
      {
        user_id: user.id,
        provider: "meta",
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        provider_user_id: meData.id,
        provider_username: meData.name,
        provider_account_id: adAccountId,
        scopes: [
          "ads_management",
          "ads_read",
          "business_management",
          "pages_read_engagement",
        ],
        metadata: { ad_accounts: adAccounts },
      },
      { onConflict: "user_id,provider" },
    );

    // Also update legacy profile fields for backward compatibility
    await supabase
      .from("profiles")
      .update({
        meta_access_token: accessToken,
        meta_ad_account_id: adAccountId,
      })
      .eq("id", user.id);

    return NextResponse.redirect(`${appUrl}/settings?success=meta_connected`);
  } catch {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    return NextResponse.redirect(`${appUrl}/settings?error=meta_error`);
  }
}
