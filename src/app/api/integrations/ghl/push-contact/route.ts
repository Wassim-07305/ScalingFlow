import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GoHighLevel: Push Contact (#52) ─────────────────────────
// POST /api/integrations/ghl/push-contact
// Push a lead/contact to GHL CRM

const GHL_API_URL = "https://services.leadconnectorhq.com";

async function refreshGHLToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  refreshToken: string,
) {
  const res = await fetch(`${GHL_API_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID!,
      client_secret: process.env.GHL_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (data.access_token) {
    await supabase
      .from("connected_accounts")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        token_expires_at: new Date(
          Date.now() + (data.expires_in || 86400) * 1000,
        ).toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "ghl");

    return data.access_token;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Parse body once upfront (ReadableStream can only be consumed once)
    const body = await req.json();

    // Get GHL credentials
    const { data: connection } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "ghl")
      .single();

    if (!connection) {
      // Fallback: try using the legacy webhook URL
      const { data: profile } = await supabase
        .from("profiles")
        .select("ghl_webhook_url")
        .eq("id", user.id)
        .single();

      if (profile?.ghl_webhook_url) {
        // SECURITY: Validate webhook URL to prevent SSRF
        try {
          const webhookUrl = new URL(profile.ghl_webhook_url);
          const wh = webhookUrl.hostname.toLowerCase();
          const blocked = [
            /^localhost$/,
            /^127\./,
            /^10\./,
            /^172\.(1[6-9]|2\d|3[0-1])\./,
            /^192\.168\./,
            /^0\./,
            /^169\.254\./,
            /\.internal$/,
            /\.local$/,
          ];
          if (
            blocked.some((p) => p.test(wh)) ||
            !["http:", "https:"].includes(webhookUrl.protocol)
          ) {
            return NextResponse.json(
              { error: "URL webhook non autorisée" },
              { status: 400 },
            );
          }
        } catch {
          return NextResponse.json(
            { error: "URL webhook invalide" },
            { status: 400 },
          );
        }

        // Push via webhook
        const res = await fetch(profile.ghl_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          return NextResponse.json(
            { error: "Erreur lors de l'envoi au webhook GHL" },
            { status: 502 },
          );
        }

        return NextResponse.json({ success: true, method: "webhook" });
      }

      return NextResponse.json(
        { error: "Connecte GoHighLevel d'abord." },
        { status: 400 },
      );
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    if (
      connection.token_expires_at &&
      new Date(connection.token_expires_at) < new Date()
    ) {
      if (connection.refresh_token) {
        accessToken = await refreshGHLToken(
          supabase,
          user.id,
          connection.refresh_token,
        );
        if (!accessToken) {
          return NextResponse.json(
            { error: "Token GHL expire. Reconnecte ton compte." },
            { status: 401 },
          );
        }
      }
    }

    const { email, phone, name, firstName, lastName, tags, source, notes } =
      body;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "email ou phone requis" },
        { status: 400 },
      );
    }

    const locationId =
      connection.metadata?.locationId || connection.provider_account_id;

    // Create or update contact in GHL
    const contactBody: Record<string, unknown> = {
      email: email || undefined,
      phone: phone || undefined,
      name: name || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      tags: tags || [],
      source: source || "ScalingFlow",
    };

    if (notes) {
      contactBody.customFields = [{ key: "notes", value: notes }];
    }

    const res = await fetch(`${GHL_API_URL}/contacts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Version: "2021-07-28",
        ...(locationId ? { Location: locationId } : {}),
      },
      body: JSON.stringify(contactBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: `GHL API: ${data.message || JSON.stringify(data)}` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      contact: data.contact || data,
      method: "oauth_api",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du push contact GHL" },
      { status: 500 },
    );
  }
}
