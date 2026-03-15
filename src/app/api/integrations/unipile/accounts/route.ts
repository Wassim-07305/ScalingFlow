import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnipileClient } from "@/lib/unipile/client";

// ─── Unipile Accounts: List connected accounts ─────────────────
// GET /api/integrations/unipile/accounts

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Fetch accounts directly from Unipile API (source of truth)
    const unipile = getUnipileClient();
    const result = await unipile.account.getAll();
    const items = Array.isArray(result)
      ? result
      : (result as { items?: Array<Record<string, unknown>> }).items || [];

    const accounts = items.map((account: Record<string, unknown>) => {
      const connParams = account.connection_params as Record<string, unknown> | undefined;
      const im = connParams?.im as Record<string, unknown> | undefined;

      return {
        id: String(account.id),
        provider: String(account.type || "unknown").toLowerCase(),
        name: im?.username || account.name || null,
        username: im?.publicIdentifier || im?.username || null,
        connected_at: account.created_at || null,
        status: "connected",
      };
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[Unipile Accounts]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des comptes" },
      { status: 500 }
    );
  }
}
