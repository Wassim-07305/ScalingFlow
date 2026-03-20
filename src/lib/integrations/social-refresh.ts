import { createClient } from "@/lib/supabase/server";

// ─── Social OAuth Token Refresh ─────────────────────────────
// Automatise le renouvellement des tokens OAuth pour YouTube (Google),
// LinkedIn et TikTok. Suit le meme pattern que refreshGHLToken().

type SocialProvider = "google" | "linkedin" | "tiktok";

type ProviderRefreshConfig = {
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  /** Nom du champ client_id dans le body (TikTok utilise "client_key") */
  clientIdField: string;
  /** Content-Type pour la requete de refresh */
  contentType: string;
  /** Transformer la reponse brute en objet normalise */
  parseResponse: (raw: Record<string, unknown>) => {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
};

const PROVIDER_CONFIGS: Record<SocialProvider, ProviderRefreshConfig> = {
  google: {
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    clientIdField: "client_id",
    contentType: "application/x-www-form-urlencoded",
    parseResponse: (raw) => ({
      access_token: raw.access_token as string | undefined,
      refresh_token: raw.refresh_token as string | undefined,
      expires_in: raw.expires_in as number | undefined,
    }),
  },
  linkedin: {
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    clientIdField: "client_id",
    contentType: "application/x-www-form-urlencoded",
    parseResponse: (raw) => ({
      access_token: raw.access_token as string | undefined,
      refresh_token: raw.refresh_token as string | undefined,
      expires_in: raw.expires_in as number | undefined,
    }),
  },
  tiktok: {
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    clientIdField: "client_key",
    contentType: "application/x-www-form-urlencoded",
    parseResponse: (raw) => {
      // TikTok enveloppe la reponse dans un champ "data"
      const data = (raw.data as Record<string, unknown>) || raw;
      return {
        access_token: data.access_token as string | undefined,
        refresh_token: data.refresh_token as string | undefined,
        expires_in: data.expires_in as number | undefined,
      };
    },
  },
};

/** Marge de securite : on refresh 5 minutes avant l'expiration reelle */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Verifie si le token OAuth d'un provider social est encore valide.
 * Si expire (ou sur le point d'expirer), tente un refresh automatique.
 * Retourne le token valide ou `null` si le refresh echoue.
 *
 * Usage :
 * ```ts
 * const token = await refreshSocialToken(supabase, user.id, "google");
 * if (!token) return NextResponse.json({ error: "Token expire" }, { status: 401 });
 * ```
 */
export async function refreshSocialToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  provider: SocialProvider,
): Promise<string | null> {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    console.error(`[social-refresh] Provider inconnu : ${provider}`);
    return null;
  }

  // 1. Lire le compte connecte
  const { data: connection, error: fetchError } = await supabase
    .from("connected_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (fetchError || !connection) {
    console.warn(
      `[social-refresh] Aucun compte ${provider} trouve pour user ${userId}`,
    );
    return null;
  }

  // 2. Verifier si le token est encore valide
  if (connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at).getTime();
    const now = Date.now();

    if (expiresAt > now + EXPIRY_BUFFER_MS) {
      // Token encore valide — pas besoin de refresh
      return connection.access_token;
    }
  } else {
    // Pas de date d'expiration enregistree — on suppose valide
    return connection.access_token;
  }

  // 3. Token expire ou bientot expire — tenter le refresh
  if (!connection.refresh_token) {
    console.warn(
      `[social-refresh] Token ${provider} expire mais aucun refresh_token disponible (user ${userId}). L'utilisateur doit reconnecter son compte.`,
    );
    return null;
  }

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    console.error(
      `[social-refresh] Variables d'env manquantes : ${config.clientIdEnv} ou ${config.clientSecretEnv}`,
    );
    return null;
  }

  try {
    const body = new URLSearchParams({
      [config.clientIdField]: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    });

    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": config.contentType },
      body,
    });

    if (!res.ok) {
      console.error(
        `[social-refresh] Erreur HTTP ${res.status} lors du refresh ${provider} (user ${userId})`,
      );
      return null;
    }

    const raw = await res.json();
    const parsed = config.parseResponse(raw);

    if (!parsed.access_token) {
      console.error(
        `[social-refresh] Reponse ${provider} sans access_token :`,
        JSON.stringify(raw).slice(0, 500),
      );
      return null;
    }

    // 4. Mettre a jour les tokens en base
    const defaultExpiresIn = provider === "linkedin" ? 5184000 : 3600;
    const expiresIn = parsed.expires_in || defaultExpiresIn;

    const { error: updateError } = await supabase
      .from("connected_accounts")
      .update({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token || connection.refresh_token,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", provider);

    if (updateError) {
      console.error(
        `[social-refresh] Erreur lors de la mise a jour du token ${provider} :`,
        updateError.message,
      );
      // On retourne quand meme le token — il est valide meme si le save a echoue
    }

    console.log(
      `[social-refresh] Token ${provider} rafraichi avec succes (user ${userId}, expire dans ${expiresIn}s)`,
    );

    return parsed.access_token;
  } catch (err) {
    console.error(
      `[social-refresh] Exception lors du refresh ${provider} (user ${userId}) :`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
