import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendCAPIIfConfigured } from "@/lib/tracking/meta-capi";

// ─── Inbound Webhook for CRM/GHL Lead Sync (#52) ────────────
// Accepts leads from GoHighLevel, Zapier, Make, or any CRM
// POST /api/webhooks/leads
// Headers: x-api-key: <user's webhook key from settings>
// Body: { email, name?, phone?, source?, tags?[], value?, notes? }

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        { error: "Missing or invalid x-api-key header" },
        { status: 401 },
      );
    }

    const supabase = await createClient();

    // Find the user by their webhook API key (stored in profiles.webhook_api_key)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("webhook_api_key", apiKey)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.email && !body.phone) {
      return NextResponse.json(
        { error: "email or phone is required" },
        { status: 400 },
      );
    }

    // Insert into a leads tracking table or notifications
    // For now, create a notification to inform the user
    await supabase.from("notifications").insert({
      user_id: profile.id,
      type: "message",
      title: `Nouveau lead : ${body.name || body.email || body.phone}`,
      message: [
        body.email && `Email: ${body.email}`,
        body.phone && `Tel: ${body.phone}`,
        body.source && `Source: ${body.source}`,
        body.value && `Valeur: ${body.value}€`,
        body.notes && `Notes: ${body.notes}`,
      ]
        .filter(Boolean)
        .join(" | "),
    });

    // Envoyer événement Lead à Meta CAPI (non-bloquant)
    sendCAPIIfConfigured(
      supabase,
      profile.id,
      "Lead",
      { email: body.email, phone: body.phone },
      body.value ? { value: Number(body.value), currency: "EUR" } : undefined,
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Lead received and notification created",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Erreur interne du webhook" },
      { status: 500 },
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/leads",
    method: "POST",
    headers: { "x-api-key": "your-webhook-api-key" },
    body: {
      email: "string (required if no phone)",
      phone: "string (required if no email)",
      name: "string (optional)",
      source: "string (optional, e.g. 'ghl', 'zapier')",
      tags: "string[] (optional)",
      value: "number (optional, deal value in EUR)",
      notes: "string (optional)",
    },
  });
}
