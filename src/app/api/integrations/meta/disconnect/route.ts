import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Meta Ads OAuth: Disconnect ──────────────────────────────
// POST /api/integrations/meta/disconnect

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Remove from connected_accounts
    await supabase
      .from("connected_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "meta");

    // Clear legacy profile fields
    await supabase
      .from("profiles")
      .update({
        meta_access_token: null,
        meta_ad_account_id: null,
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la deconnexion" },
      { status: 500 }
    );
  }
}
