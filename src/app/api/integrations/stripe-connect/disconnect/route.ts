import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Stripe Connect: Disconnect ──────────────────────────────

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await supabase
      .from("connected_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "stripe_connect");

    await supabase
      .from("profiles")
      .update({ stripe_connect_account_id: null })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la deconnexion" },
      { status: 500 }
    );
  }
}
