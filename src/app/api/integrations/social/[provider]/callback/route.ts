import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Social OAuth: Callback Handler (#56) ────────────────────
// GET /api/integrations/social/[provider]/callback

type TokenConfig = {
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  profileUrl?: string;
  profileFields?: string;
  mapProvider: string; // provider name in connected_accounts
};

const TOKEN_CONFIGS: Record<string, TokenConfig> = {
  instagram: {
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    profileUrl: "https://graph.facebook.com/v21.0/me/accounts",
    mapProvider: "instagram",
  },
  google: {
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    profileUrl: "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    mapProvider: "google",
  },
  linkedin: {
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    mapProvider: "linkedin",
  },
  tiktok: {
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    profileUrl: "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
    mapProvider: "tiktok",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    const { provider } = await params;
    const config = TOKEN_CONFIGS[provider];

    if (!config) {
      return NextResponse.redirect(`${appUrl}/settings?error=unknown_provider`);
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${appUrl}/settings?error=${provider}_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${appUrl}/settings?error=${provider}_missing_params`);
    }

    const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(`${appUrl}/settings?error=${provider}_auth_mismatch`);
    }

    const clientId = process.env[config.clientIdEnv]!;
    const clientSecret = process.env[config.clientSecretEnv]!;
    const redirectUri = `${appUrl}/api/integrations/social/${provider}/callback`;

    // Exchange code for token
    let tokenData: Record<string, unknown>;

    if (provider === "tiktok") {
      const res = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });
      const raw = await res.json();
      tokenData = raw.data || raw;
    } else if (provider === "google") {
      const res = await fetch(config.tokenUrl, {
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
      tokenData = await res.json();
    } else if (provider === "linkedin") {
      const res = await fetch(config.tokenUrl, {
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
      tokenData = await res.json();
    } else {
      // Instagram / Meta
      const url = new URL(config.tokenUrl);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("client_secret", clientSecret);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("code", code);
      const res = await fetch(url.toString());
      tokenData = await res.json();
    }

    if (tokenData.error) {
      return NextResponse.redirect(`${appUrl}/settings?error=${provider}_token_error`);
    }

    const accessToken = tokenData.access_token as string;
    const refreshToken = (tokenData.refresh_token as string) || null;
    const expiresIn = (tokenData.expires_in as number) || 5184000;

    // Get user profile
    let providerUserId = "";
    let providerUsername = "";

    if (config.profileUrl && accessToken) {
      try {
        if (provider === "instagram") {
          // Get Instagram Business Account through Facebook Pages
          const pagesRes = await fetch(
            `${config.profileUrl}?fields=id,name,instagram_business_account{id,username}&access_token=${accessToken}`
          );
          const pagesData = await pagesRes.json();
          const page = pagesData.data?.[0];
          const igAccount = page?.instagram_business_account;
          providerUserId = igAccount?.id || page?.id || "";
          providerUsername = igAccount?.username || page?.name || "";
        } else if (provider === "google") {
          const res = await fetch(config.profileUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          const channel = data.items?.[0];
          providerUserId = channel?.id || "";
          providerUsername = channel?.snippet?.title || "";
        } else if (provider === "linkedin") {
          const res = await fetch(config.profileUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          providerUserId = data.sub || "";
          providerUsername = data.name || "";
        } else if (provider === "tiktok") {
          const res = await fetch(config.profileUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          const tiktokUser = data.data?.user;
          providerUserId = tiktokUser?.open_id || (tokenData.open_id as string) || "";
          providerUsername = tiktokUser?.display_name || "";
        }
      } catch {
        // Profile fetch failed, continue without it
      }
    }

    // Store in connected_accounts
    await supabase.from("connected_accounts").upsert(
      {
        user_id: user.id,
        provider: config.mapProvider,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        provider_user_id: providerUserId,
        provider_username: providerUsername,
        scopes: [],
        metadata: { raw_scopes: tokenData.scope },
      },
      { onConflict: "user_id,provider" }
    );

    return NextResponse.redirect(`${appUrl}/settings?success=${provider}_connected`);
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?error=social_oauth_error`);
  }
}
