import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendConversionEvent,
  getMetaPixelConfig,
  type CAPIEventName,
  type CAPIUserData,
  type CAPICustomData,
} from "@/lib/tracking/meta-capi";

// ─── Meta Conversions API (CAPI) Endpoint ───────────────────
// POST /api/integrations/meta/conversions
// Envoie un événement de conversion à Meta côté serveur

const VALID_EVENTS: CAPIEventName[] = [
  "Lead",
  "Schedule",
  "Purchase",
  "ViewContent",
  "InitiateCheckout",
  "CompleteRegistration",
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const {
      eventName,
      email,
      phone,
      value,
      currency,
      sourceUrl,
      contentName,
      contentCategory,
      eventId,
      fbc,
      fbp,
    } = body;

    // Validation du nom d'événement
    if (!eventName || !VALID_EVENTS.includes(eventName)) {
      return NextResponse.json(
        {
          error: `Événement invalide. Événements acceptés : ${VALID_EVENTS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Récupérer la config pixel de l'utilisateur
    const config = await getMetaPixelConfig(supabase, user.id);
    if (!config) {
      return NextResponse.json(
        {
          error:
            "Pixel Meta non configuré. Connecte ton compte Meta dans les paramètres.",
        },
        { status: 404 },
      );
    }

    // F54 — Extraire fbc/fbp depuis les cookies si non fournis dans le body
    const cookieHeader = req.headers.get("cookie") || "";
    const extractCookie = (name: string): string | undefined => {
      const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
      return match?.[1];
    };

    // Construire les données utilisateur avec fbc/fbp pour la déduplication
    const userData: CAPIUserData = {
      email: email || undefined,
      phone: phone || undefined,
      clientIpAddress:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        undefined,
      clientUserAgent: req.headers.get("user-agent") || undefined,
      fbc: fbc || extractCookie("_fbc") || undefined,
      fbp: fbp || extractCookie("_fbp") || undefined,
    };

    // Construire les données personnalisées
    const customData: CAPICustomData = {};
    if (value !== undefined) customData.value = Number(value);
    if (currency) customData.currency = currency;
    if (contentName) customData.content_name = contentName;
    if (contentCategory) customData.content_category = contentCategory;

    // Envoyer l'événement avec event_id pour déduplication
    const result = await sendConversionEvent(
      config.pixelId,
      config.accessToken,
      eventName as CAPIEventName,
      userData,
      Object.keys(customData).length > 0 ? customData : undefined,
      sourceUrl,
      eventId,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erreur lors de l'envoi de l'événement" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      events_received: result.events_received,
      event_name: eventName,
      event_id: result.event_id,
    });
  } catch (error) {
    console.error("[meta/conversions] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de l'envoi de l'événement" },
      { status: 500 },
    );
  }
}
