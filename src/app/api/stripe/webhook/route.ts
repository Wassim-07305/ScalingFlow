import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getPlanByPriceId } from "@/lib/stripe/plans";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Client admin Supabase (service role) pour les webhooks
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configure" },
        { status: 503 }
      );
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET non defini");
      return NextResponse.json(
        { error: "Configuration webhook manquante" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Erreur verification signature webhook:", err);
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    if (!supabase) {
      console.error("Supabase admin client non disponible");
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          // Recuperer les details de l'abonnement
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = priceId ? getPlanByPriceId(priceId) : null;

          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_plan: plan?.id || "pro",
              stripe_customer_id: session.customer as string,
            })
            .eq("id", userId);

          console.log(
            `Abonnement active pour user ${userId}, plan: ${plan?.name || "inconnu"}`
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const status = subscription.status === "active" ? "active" : subscription.status;

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (profiles && profiles.length > 0) {
          await supabase
            .from("profiles")
            .update({ subscription_status: status })
            .eq("id", profiles[0].id);

          console.log(
            `Abonnement mis a jour pour user ${profiles[0].id}, statut: ${status}`
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (profiles && profiles.length > 0) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "canceled", subscription_plan: "free" })
            .eq("id", profiles[0].id);

          console.log(
            `Abonnement annule pour user ${profiles[0].id}`
          );
        }
        break;
      }

      default:
        console.log(`Evenement Stripe non gere: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erreur webhook Stripe:", error);
    return NextResponse.json(
      { error: "Erreur interne webhook" },
      { status: 500 }
    );
  }
}
