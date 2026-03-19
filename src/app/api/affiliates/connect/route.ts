import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_DOMAIN ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://scalingflow.com";

/**
 * POST /api/affiliates/connect
 * Crée ou récupère un compte Stripe Connect Express pour l'affilié.
 * Retourne une URL d'onboarding Stripe.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe non configuré" },
        { status: 503 },
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const adminClient = createAdminClient();

    // Récupérer l'affilié
    const { data: affiliate } = await adminClient
      .from("affiliates")
      .select("id, stripe_account_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json(
        { error: "Tu dois d'abord rejoindre le programme partenaire" },
        { status: 404 },
      );
    }

    let accountId = affiliate.stripe_account_id;

    // Créer le compte Connect si besoin
    if (!accountId) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: profile?.email || user.email || undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          supabase_user_id: user.id,
          affiliate_id: affiliate.id,
        },
      });

      accountId = account.id;

      await adminClient
        .from("affiliates")
        .update({ stripe_account_id: accountId })
        .eq("id", affiliate.id);
    }

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_DOMAIN}/affiliate?connect=refresh`,
      return_url: `${APP_DOMAIN}/affiliate?connect=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("stripe connect error:", err);
    return NextResponse.json({ error: "Erreur Stripe Connect" }, { status: 500 });
  }
}
