import crypto from "crypto";

// ─── Meta Conversions API (CAPI) Helper ─────────────────────
// Envoie des événements server-side à Meta pour un tracking fiable

const META_CAPI_VERSION = "v21.0";

export type CAPIEventName =
  | "Lead"
  | "Schedule"
  | "Purchase"
  | "ViewContent"
  | "InitiateCheckout"
  | "CompleteRegistration";

export interface CAPIUserData {
  email?: string;
  phone?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook click ID
  fbp?: string; // Facebook browser ID
}

export interface CAPICustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
}

/**
 * Hash une valeur PII en SHA256 (norme Meta CAPI)
 */
function hashSHA256(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex");
}

/**
 * Prépare les user_data avec hash automatique des PII
 */
function buildUserData(userData: CAPIUserData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (userData.email) {
    result.em = [hashSHA256(userData.email)];
  }
  if (userData.phone) {
    // Retirer espaces et caractères spéciaux avant hash
    const cleanPhone = userData.phone.replace(/[\s\-\(\)\+]/g, "");
    result.ph = [hashSHA256(cleanPhone)];
  }
  if (userData.clientIpAddress) {
    result.client_ip_address = userData.clientIpAddress;
  }
  if (userData.clientUserAgent) {
    result.client_user_agent = userData.clientUserAgent;
  }
  if (userData.fbc) {
    result.fbc = userData.fbc;
  }
  if (userData.fbp) {
    result.fbp = userData.fbp;
  }

  return result;
}

/**
 * Génère un event_id unique pour la déduplication pixel/CAPI.
 * Le même event_id doit être envoyé côté client (pixel) et côté serveur (CAPI)
 * pour que Meta déduplique les événements.
 */
export function generateEventId(): string {
  return `${Date.now()}_${crypto.randomUUID()}`;
}

/**
 * Envoie un événement de conversion à Meta Conversions API
 */
export async function sendConversionEvent(
  pixelId: string,
  accessToken: string,
  eventName: CAPIEventName,
  userData: CAPIUserData,
  customData?: CAPICustomData,
  sourceUrl?: string,
  eventId?: string
): Promise<{ success: boolean; events_received?: number; event_id?: string; error?: string }> {
  try {
    // F54 — event_id pour la déduplication pixel/CAPI
    const dedupEventId = eventId || generateEventId();

    const eventPayload: Record<string, unknown> = {
      event_name: eventName,
      event_id: dedupEventId,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: buildUserData(userData),
    };

    if (sourceUrl) {
      eventPayload.event_source_url = sourceUrl;
    }

    if (customData) {
      const cd: Record<string, unknown> = {};
      if (customData.value !== undefined) cd.value = customData.value;
      if (customData.currency) cd.currency = customData.currency;
      if (customData.content_name) cd.content_name = customData.content_name;
      if (customData.content_category) cd.content_category = customData.content_category;
      if (Object.keys(cd).length > 0) {
        eventPayload.custom_data = cd;
      }
    }

    const body = {
      data: [eventPayload],
      access_token: accessToken,
    };

    const response = await fetch(
      `https://graph.facebook.com/${META_CAPI_VERSION}/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("[meta-capi] Erreur:", result);
      return {
        success: false,
        error: result.error?.message || "Erreur Meta CAPI",
      };
    }

    return {
      success: true,
      events_received: result.events_received,
      event_id: dedupEventId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[meta-capi] Exception:", message);
    return { success: false, error: message };
  }
}

/**
 * Récupère le pixel_id et access_token Meta depuis connected_accounts.
 * Retourne null si non configuré.
 */
export async function getMetaPixelConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<{ pixelId: string; accessToken: string } | null> {
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("access_token, provider_account_id, metadata")
    .eq("user_id", userId)
    .eq("provider", "meta")
    .single();

  if (!account?.access_token) return null;

  // pixel_id peut être dans metadata ou provider_account_id
  const metadata = account.metadata as Record<string, unknown> | null;
  const pixelId =
    (metadata?.pixel_id as string) ||
    (account.provider_account_id as string) ||
    "";

  if (!pixelId) return null;

  return {
    pixelId,
    accessToken: account.access_token as string,
  };
}

/**
 * Envoie un événement CAPI si le pixel Meta est configuré pour l'utilisateur.
 * Silencieux si non configuré (non-bloquant).
 */
export async function sendCAPIIfConfigured(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  eventName: CAPIEventName,
  userData: CAPIUserData,
  customData?: CAPICustomData,
  sourceUrl?: string,
  eventId?: string
): Promise<void> {
  try {
    const config = await getMetaPixelConfig(supabase, userId);
    if (!config) return;

    const result = await sendConversionEvent(
      config.pixelId,
      config.accessToken,
      eventName,
      userData,
      customData,
      sourceUrl,
      eventId
    );

    if (!result.success) {
      console.warn(`[meta-capi] Échec envoi ${eventName} pour user ${userId}:`, result.error);
    }
  } catch (error) {
    console.warn(`[meta-capi] Exception non-bloquante pour ${eventName}:`, error);
  }
}
