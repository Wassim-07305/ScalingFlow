import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Unipile Publish: Post to social media ──────────────────────
// POST /api/integrations/unipile/publish
// Body: { account_id, text, media_urls?: string[] }

async function verifyAccountExists(accountId: string) {
  try {
    const apiUrl = process.env.UNIPILE_API_URL;
    const accessToken = process.env.UNIPILE_ACCESS_TOKEN;
    if (!apiUrl || !accessToken) return false;

    const res = await fetch(`${apiUrl}/api/v1/accounts`, {
      headers: { "X-API-KEY": accessToken, accept: "application/json" },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const items = data.items || [];
    return items.some(
      (a: Record<string, unknown>) => String(a.id) === accountId,
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { account_id, text, media_urls } = body as {
      account_id?: string;
      text?: string;
      media_urls?: string[];
    };

    if (!account_id) {
      return NextResponse.json(
        { error: "Le champ account_id est requis" },
        { status: 400 },
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Le champ text est requis" },
        { status: 400 },
      );
    }

    // Verify ownership
    const isValid = await verifyAccountExists(account_id);
    if (!isValid) {
      return NextResponse.json(
        { error: "Compte non trouvé ou accès non autorisé" },
        { status: 403 },
      );
    }

    // Use direct REST call to Unipile posts API (SDK may not expose it)
    const apiUrl = process.env.UNIPILE_API_URL;
    const accessToken = process.env.UNIPILE_ACCESS_TOKEN;

    if (!apiUrl || !accessToken) {
      return NextResponse.json(
        { error: "Configuration Unipile manquante" },
        { status: 500 },
      );
    }

    const formData = new FormData();
    formData.append("account_id", account_id);
    formData.append("text", text);

    if (media_urls && media_urls.length > 0) {
      for (const url of media_urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const buffer = await res.arrayBuffer();
          const contentType = res.headers.get("content-type") || "image/jpeg";
          const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
          const filename = `media_${Date.now()}.${ext}`;
          formData.append("attachments", new Blob([buffer], { type: contentType }), filename);
        } catch {
          console.warn("[Unipile Publish] Impossible de télécharger le média:", url);
        }
      }
    }

    const response = await fetch(`${apiUrl}/api/v1/posts`, {
      method: "POST",
      headers: {
        "X-API-KEY": accessToken,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        "[Unipile Publish] Erreur API :",
        response.status,
        errorData,
      );
      let detail = "";
      try {
        const json = JSON.parse(errorData);
        detail = json.detail || json.message || json.error || errorData;
      } catch {
        detail = errorData;
      }
      return NextResponse.json(
        {
          error: `Erreur publication: HTTP ${response.status} — ${typeof detail === "string" ? detail.slice(0, 300) : JSON.stringify(detail).slice(0, 300)}`,
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const result = await response.json();
    return NextResponse.json({ post: result });
  } catch (error) {
    console.error("[Unipile Publish]", error);
    return NextResponse.json(
      { error: "Erreur lors de la publication" },
      { status: 500 },
    );
  }
}
