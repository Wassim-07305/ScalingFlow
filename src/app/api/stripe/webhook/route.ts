import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getPlanByPriceId } from "@/lib/stripe/plans";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend/client";
import {
  subscriptionActivatedEmail,
  subscriptionCanceledEmail,
  paymentFailedEmail,
} from "@/lib/resend/templates";
import type Stripe from "stripe";

const FROM = "ScalingFlow <noreply@scalingflow.com>";

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
      return NextResponse.json(
        { error: "Configuration webhook manquante" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    if (!supabase) {
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

          // Envoyer email de confirmation d'abonnement
          if (resend && session.customer_email) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", userId)
              .single();

            const firstName = profile?.full_name?.split(" ")[0] || "Utilisateur";
            const emailContent = subscriptionActivatedEmail(firstName, plan?.name || "Pro");

            await resend.emails.send({
              from: FROM,
              to: session.customer_email,
              subject: emailContent.subject,
              html: emailContent.html,
            }).catch(() => {});
          }
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

          // Envoyer email d'annulation
          if (resend) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", profiles[0].id)
              .single();

            if (profile?.email) {
              const firstName = profile.full_name?.split(" ")[0] || "Utilisateur";
              const emailContent = subscriptionCanceledEmail(firstName);

              await resend.emails.send({
                from: FROM,
                to: profile.email,
                subject: emailContent.subject,
                html: emailContent.html,
              }).catch(() => {});
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (profiles && profiles.length > 0) {
          // Mettre a jour le statut
          await supabase
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("id", profiles[0].id);

          // Envoyer email d'alerte de paiement echoue
          if (resend && profiles[0].email) {
            const firstName = profiles[0].full_name?.split(" ")[0] || "Utilisateur";
            const emailContent = paymentFailedEmail(firstName);

            await resend.emails.send({
              from: FROM,
              to: profiles[0].email,
              subject: emailContent.subject,
              html: emailContent.html,
            }).catch(() => {});
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur interne webhook" },
      { status: 500 }
    );
  }
}
