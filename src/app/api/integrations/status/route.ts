import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Integration Status: Get all connected accounts ──────────
// GET /api/integrations/status

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { data: connections } = await supabase
      .from("connected_accounts")
      .select("provider, provider_username, provider_account_id, token_expires_at, connected_at, metadata")
      .eq("user_id", user.id);

    const status: Record<string, {
      connected: boolean;
      username?: string;
      accountId?: string;
      expiresAt?: string;
      connectedAt?: string;
      metadata?: Record<string, unknown>;
    }> = {};

    const allProviders = ["meta", "ghl", "stripe_connect", "instagram", "google", "linkedin", "tiktok"];

    for (const provider of allProviders) {
      const conn = connections?.find((c) => c.provider === provider);
      status[provider] = conn
        ? {
            connected: true,
            username: conn.provider_username || undefined,
            accountId: conn.provider_account_id || undefined,
            expiresAt: conn.token_expires_at || undefined,
            connectedAt: conn.connected_at || undefined,
            metadata: (conn.metadata as Record<string, unknown>) || undefined,
          }
        : { connected: false };
    }

    return NextResponse.json({ status });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du statut" },
      { status: 500 }
    );
  }
}
