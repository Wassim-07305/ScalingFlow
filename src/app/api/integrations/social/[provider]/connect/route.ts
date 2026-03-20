import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOAuthState } from "@/lib/utils/oauth-state";

// ─── Social OAuth: Start Flow (#56) ──────────────────────────
// GET /api/integrations/social/[provider]/connect
// Supports: instagram, google (YouTube), linkedin, tiktok

type ProviderConfig = {
  authUrl: string;
  scopes: string;
  clientIdEnv: string;
  extraParams?: Record<string, string>;
};

const PROVIDERS: Record<string, ProviderConfig> = {
  instagram: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    scopes:
      "instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement",
    clientIdEnv: "META_APP_ID",
    extraParams: {},
  },
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes:
      "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/yt-analytics.readonly",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scopes: "openid profile email w_member_social",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    extraParams: {},
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scopes: "user.info.basic,video.list,video.publish",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    extraParams: {},
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    const config = PROVIDERS[provider];

    if (!config) {
      return NextResponse.json(
        {
          error: `Provider "${provider}" non supporte. Utilise: ${Object.keys(PROVIDERS).join(", ")}`,
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const clientId = process.env[config.clientIdEnv];
    if (!clientId) {
      return NextResponse.json(
        { error: `${config.clientIdEnv} non configure` },
        { status: 500 },
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/social/${provider}/callback`;
    // SECURITY: HMAC-signed state to prevent CSRF
    const state = createOAuthState(user.id);

    const authUrl = new URL(config.authUrl);

    if (provider === "tiktok") {
      authUrl.searchParams.set("client_key", clientId);
    } else {
      authUrl.searchParams.set("client_id", clientId);
    }

    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    if (provider === "tiktok") {
      authUrl.searchParams.set("scope", config.scopes);
    } else if (provider === "google") {
      authUrl.searchParams.set("scope", config.scopes);
    } else {
      authUrl.searchParams.set("scope", config.scopes);
    }

    // Add extra params
    if (config.extraParams) {
      for (const [key, value] of Object.entries(config.extraParams)) {
        authUrl.searchParams.set(key, value);
      }
    }

    return NextResponse.redirect(authUrl.toString());
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 },
    );
  }
}
