import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Meta Pixel Verification Endpoint ───────────────────────
// POST /api/integrations/meta/verify-pixel
// Vérifie qu'un pixel Meta existe via le Graph API

const META_GRAPH_VERSION = "v21.0";

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
    const { pixel_id, access_token } = body;

    if (!pixel_id || !access_token) {
      return NextResponse.json(
        { valid: false, error: "Le Pixel ID et l'Access Token sont requis." },
        { status: 400 }
      );
    }

    // Call Meta Graph API to verify the pixel exists
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixel_id}?fields=name,id&access_token=${access_token}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      const errorMessage =
        result.error?.message || "Pixel introuvable ou token invalide.";
      return NextResponse.json(
        { valid: false, error: errorMessage },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      pixelName: result.name || "",
      pixelId: result.id || pixel_id,
    });
  } catch (error) {
    console.error("[meta/verify-pixel] Error:", error);
    return NextResponse.json(
      { valid: false, error: "Erreur interne lors de la vérification du pixel." },
      { status: 500 }
    );
  }
}
