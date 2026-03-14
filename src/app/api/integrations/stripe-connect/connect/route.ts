import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

// ─── Stripe Connect OAuth: Start Onboarding (#55) ────────────
// GET /api/integrations/stripe-connect/connect

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
    });

    // Check if user already has a connected account
    const { data: connection } = await supabase
      .from("connected_accounts")
      .select("provider_account_id")
      .eq("user_id", user.id)
      .eq("provider", "stripe_connect")
      .single();

    let accountId = connection?.provider_account_id;

    if (!accountId) {
      // Create a new connected account
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      const account = await stripe.accounts.create({
        type: "express",
        email: profile?.email || user.email,
        metadata: { scalingflow_user_id: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Store in connected_accounts
      await supabase.from("connected_accounts").upsert(
        {
          user_id: user.id,
          provider: "stripe_connect",
          access_token: "stripe_express", // Express accounts don't use OAuth tokens
          provider_account_id: accountId,
          provider_user_id: accountId,
          metadata: { type: "express" },
        },
        { onConflict: "user_id,provider" }
      );

      // Also update legacy field
      await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", user.id);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/stripe-connect/connect`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=stripe_connected`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur Stripe Connect: ${message}` },
      { status: 500 }
    );
  }
}
