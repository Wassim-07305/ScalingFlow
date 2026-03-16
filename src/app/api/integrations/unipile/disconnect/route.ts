import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnipileClient } from "@/lib/unipile/client";

// ─── Unipile Disconnect: Remove a connected account ─────────────
// POST /api/integrations/unipile/disconnect
// Body: { account_id: string }

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
    const { account_id } = body as { account_id?: string };

    if (!account_id) {
      return NextResponse.json(
        { error: "Le champ account_id est requis" },
        { status: 400 },
      );
    }

    // Delete from Unipile directly
    const unipile = getUnipileClient();
    try {
      await unipile.account.delete(account_id);
    } catch (err) {
      console.error("[Unipile Disconnect] Erreur SDK :", err);
      return NextResponse.json(
        { error: "Compte non trouvé ou erreur lors de la suppression" },
        { status: 404 },
      );
    }

    // Also remove from Supabase if the table exists
    try {
      await supabase
        .from("connected_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("provider_account_id", account_id);
    } catch {
      // Table may not exist yet — not critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Unipile Disconnect]", error);
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion du compte" },
      { status: 500 },
    );
  }
}
