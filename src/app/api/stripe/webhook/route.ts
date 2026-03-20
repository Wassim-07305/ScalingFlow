import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getPlanByPriceId, resolvePlanId } from "@/lib/stripe/plans";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend/client";
import {
  subscriptionActivatedEmail,
  subscriptionCanceledEmail,
  paymentFailedEmail,
  affiliateCommissionEmail,
} from "@/lib/resend/templates";
import type Stripe from "stripe";
import { sendCAPIIfConfigured } from "@/lib/tracking/meta-capi";
import { getJourney } from "@/lib/services/attribution-engine";
import { calculateCommission } from "@/lib/affiliates/commission-calculator";
import { awardXPForUser } from "@/lib/affiliates/award-affiliate-xp";

const FROM = "ScalingFlow <noreply@scalingflow.com>";

// Parse Meta ad IDs from utm_content if formatted as "campaign:{id}|adset:{id}|ad:{id}"
function parseMetaIds(
  utmContent: string | null,
): { campaign_id: string; adset_id: string; ad_id: string } | null {
  if (!utmContent) return null;
  const match = utmContent.match(
    /campaign:([^|]+)\|adset:([^|]+)\|ad:([^|]+)/,
  );
  if (!match) return null;
  return { campaign_id: match[1], adset_id: match[2], ad_id: match[3] };
}

// Client admin Supabase (service role) pour les webhooks
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

// ─── Logique commissions affiliation ─────────────────────────────────────────

async function processAffiliateCommission(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  opts: {
    userId: string;
    paymentId: string;
    amount: number;
    currency: string;
    isRecurring: boolean;
  },
) {
  const { userId, paymentId, amount, currency, isRecurring } = opts;

  // Charger le profil pour récupérer referred_by
  const { data: profile } = await supabase
    .from("profiles")
    .select("referred_by, email")
    .eq("id", userId)
    .single();

  if (!profile?.referred_by) return;

  // Charger l'affilié et son programme
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select(
      `id, user_id, custom_commission_rate, status,
       affiliate_programs!inner(
         id, commission_type, commission_rate,
         recurring_months, is_active,
         owner_id
       )`,
    )
    .eq("affiliate_code", profile.referred_by)
    .eq("status", "active")
    .single();

  if (!affiliate || !affiliate.affiliate_programs) return;

  const prog = affiliate.affiliate_programs as {
    id: string;
    commission_type: string;
    commission_rate: number;
    recurring_months: number | null;
    is_active: boolean;
    owner_id: string;
  };

  if (!prog.is_active) return;

  // Pour les commissions récurrentes : vérifier la limite de mois
  let existingCount = 0;
  if (isRecurring && prog.commission_type === "recurring" && prog.recurring_months !== null) {
    const { count } = await supabase
      .from("commissions")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_id", affiliate.id)
      .neq("status", "cancelled");

    existingCount = count || 0;
  }

  const result = calculateCommission({
    sourceAmount: amount,
    commissionType: prog.commission_type as "one_time" | "recurring" | "tiered",
    commissionRate: prog.commission_rate,
    customRate: affiliate.custom_commission_rate,
    existingCommissionsCount: existingCount,
    recurringMonths: prog.recurring_months,
  });

  if (!result.eligible || result.amount <= 0) return;

  // Trouver le referral associé
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, status")
    .eq("affiliate_id", affiliate.id)
    .eq("referred_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!referral) return;

  // Créer la commission
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  await supabase.from("commissions").insert({
    affiliate_id: affiliate.id,
    referral_id: referral.id,
    payment_id: paymentId,
    amount: result.amount,
    commission_rate: result.rate,
    source_amount: amount,
    currency,
    status: "pending",
    period_start: periodStart,
    period_end: periodEnd,
  });

  // Marquer le referral comme converti si c'est le premier paiement
  if (referral.status !== "converted") {
    await supabase
      .from("referrals")
      .update({ status: "converted", converted_at: now.toISOString() })
      .eq("id", referral.id);

    // Mettre à jour les totaux de l'affilié (première conversion)
    const { data: aff } = await supabase
      .from("affiliates")
      .select("total_earned, total_conversions")
      .eq("id", affiliate.id)
      .single();

    if (aff) {
      await supabase
        .from("affiliates")
        .update({
          total_earned: (aff.total_earned || 0) + result.amount,
          total_conversions: (aff.total_conversions || 0) + 1,
        })
        .eq("id", affiliate.id);
    }

    // XP + badges pour la conversion
    await awardXPForUser(affiliate.user_id, "affiliate.conversion").catch(() => {});
  } else {
    // Recurring : juste incrémenter total_earned
    const { data: aff } = await supabase
      .from("affiliates")
      .select("total_earned")
      .eq("id", affiliate.id)
      .single();

    if (aff) {
      await supabase
        .from("affiliates")
        .update({ total_earned: (aff.total_earned || 0) + result.amount })
        .eq("id", affiliate.id);
    }
  }

  // Email à l'affilié (non-bloquant)
  if (resend) {
    const { data: affiliateProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", affiliate.user_id)
      .single();

    if (affiliateProfile?.email) {
      const firstName = affiliateProfile.full_name?.split(" ")[0] || "Partenaire";
      const emailContent = affiliateCommissionEmail(firstName, result.amount, currency);
      resend.emails
        .send({
          from: FROM,
          to: affiliateProfile.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
        .catch(() => {});
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configuré" },
        { status: 503 },
      );
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 },
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Configuration webhook manquante" },
        { status: 500 },
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 },
      );
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          // Récupérer les details de l'abonnement
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = priceId ? getPlanByPriceId(priceId) : null;

          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_plan: resolvePlanId(plan?.id || "scale"),
              stripe_customer_id: session.customer as string,
            })
            .eq("id", userId);

          // Stocker l'attribution UTM → créative/campagne
          const utmContent = session.metadata?.utm_content || null;
          const parsedMetaIds = parseMetaIds(utmContent);
          await supabase.from("payment_attributions").insert({
            user_id: userId,
            stripe_payment_id:
              (session.payment_intent as string) || session.id,
            stripe_session_id: session.id,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || "eur",
            utm_source: session.metadata?.utm_source || null,
            utm_medium: session.metadata?.utm_medium || null,
            utm_campaign: session.metadata?.utm_campaign || null,
            utm_content: utmContent,
            utm_term: session.metadata?.utm_term || null,
            fbclid: session.metadata?.fbclid || null,
            meta_campaign_id: parsedMetaIds?.campaign_id || null,
            meta_adset_id: parsedMetaIds?.adset_id || null,
            meta_ad_id: parsedMetaIds?.ad_id || null,
          });

          // Enrichir l'attribution avec le parcours multi-touch (non-bloquant)
          getJourney(supabase, { userId })
            .then((journey) => {
              if (journey.length === 0) return;
              const firstTouch = journey[0];
              const lastTouch = journey[journey.length - 1];
              return supabase
                .from("payment_attributions")
                .update({
                  first_touch_source: firstTouch.source,
                  first_touch_channel: firstTouch.channel,
                  last_touch_source: lastTouch.source,
                  last_touch_channel: lastTouch.channel,
                  journey_json: journey,
                })
                .eq("user_id", userId)
                .eq(
                  "stripe_session_id",
                  session.id,
                );
            })
            .catch(() => {});

          // Envoyer événement Purchase à Meta CAPI (non-bloquant)
          sendCAPIIfConfigured(
            supabase,
            userId,
            "Purchase",
            { email: session.customer_email || undefined },
            {
              value: (session.amount_total || 0) / 100,
              currency: (session.currency || "eur").toUpperCase(),
            },
          ).catch(() => {});

          // Envoyer email de confirmation d'abonnement
          if (resend && session.customer_email) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", userId)
              .single();

            const firstName =
              profile?.full_name?.split(" ")[0] || "Utilisateur";
            const emailContent = subscriptionActivatedEmail(
              firstName,
              plan?.name || "Pro",
            );

            await resend.emails
              .send({
                from: FROM,
                to: session.customer_email,
                subject: emailContent.subject,
                html: emailContent.html,
              })
              .catch(() => {});
          }

          // ─── Commissions d'affiliation ─────────────────────────────────────
          processAffiliateCommission(supabase, {
            userId,
            paymentId: (session.payment_intent as string) || session.id,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || "eur",
            isRecurring: false,
          }).catch(() => {});
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        // Ignorer la 1ère facture (déjà couverte par checkout.session.completed)
        if (invoice.billing_reason === "subscription_create") break;

        const customerId = invoice.customer as string;
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (profiles && profiles.length > 0) {
          const userId = profiles[0].id;
          processAffiliateCommission(supabase, {
            userId,
            paymentId: ((invoice as unknown as Record<string, unknown>).payment_intent as string | null) ?? invoice.id,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency || "eur",
            isRecurring: true,
          }).catch(() => {});
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const status =
          subscription.status === "active" ? "active" : subscription.status;

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
            .update({
              subscription_status: "canceled",
              subscription_plan: "free",
            })
            .eq("id", profiles[0].id);

          // Envoyer email d'annulation
          if (resend) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", profiles[0].id)
              .single();

            if (profile?.email) {
              const firstName =
                profile.full_name?.split(" ")[0] || "Utilisateur";
              const emailContent = subscriptionCanceledEmail(firstName);

              await resend.emails
                .send({
                  from: FROM,
                  to: profile.email,
                  subject: emailContent.subject,
                  html: emailContent.html,
                })
                .catch(() => {});
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
            const firstName =
              profiles[0].full_name?.split(" ")[0] || "Utilisateur";
            const emailContent = paymentFailedEmail(firstName);

            await resend.emails
              .send({
                from: FROM,
                to: profiles[0].email,
                subject: emailContent.subject,
                html: emailContent.html,
              })
              .catch(() => {});
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
      { status: 500 },
    );
  }
}

