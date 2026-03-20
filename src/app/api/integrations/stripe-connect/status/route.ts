import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

// ─── Stripe Connect: Check Account Status ────────────────────
// GET /api/integrations/stripe-connect/status

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: connection } = await supabase
      .from("connected_accounts")
      .select("provider_account_id, metadata")
      .eq("user_id", user.id)
      .eq("provider", "stripe_connect")
      .maybeSingle();

    if (!connection?.provider_account_id) {
      return NextResponse.json({ connected: false });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
    });

    const account = await stripe.accounts.retrieve(
      connection.provider_account_id,
    );

    const isComplete = account.details_submitted && account.charges_enabled;

    // Update metadata with latest status
    await supabase
      .from("connected_accounts")
      .update({
        metadata: {
          ...((connection.metadata as Record<string, unknown>) || {}),
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        },
      })
      .eq("user_id", user.id)
      .eq("provider", "stripe_connect");

    return NextResponse.json({
      connected: true,
      account_id: connection.provider_account_id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      complete: isComplete,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 },
    );
  }
}
