import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

/**
 * POST /api/affiliates/payout
 * Body : { affiliate_id?: string }  (admin uniquement si affiliate_id est fourni)
 *
 * - Récupère les commissions approved pour l'affilié
 * - Vérifie que le total >= min_payout
 * - Si stripe_account_id : Stripe Transfer
 * - Sinon : payout créé avec status='pending' (paiement manuel)
 * - Met à jour les commissions et l'affilié
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

    const body = await req.json().catch(() => ({}));
    const adminClient = createAdminClient();

    // Si affiliate_id fourni : vérifier que l'appelant est admin
    let affiliateId: string;
    if (body.affiliate_id) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      affiliateId = body.affiliate_id;
    } else {
      // Affilié demande son propre payout
      const { data: affiliate } = await adminClient
        .from("affiliates")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!affiliate) {
        return NextResponse.json({ error: "Compte affilié introuvable" }, { status: 404 });
      }
      affiliateId = affiliate.id;
    }

    // Charger l'affilié + programme
    const { data: affiliate } = await adminClient
      .from("affiliates")
      .select(
        `id, user_id, stripe_account_id, total_paid,
         affiliate_programs!inner(min_payout, commission_type)`,
      )
      .eq("id", affiliateId)
      .single();

    if (!affiliate) {
      return NextResponse.json({ error: "Affilié introuvable" }, { status: 404 });
    }

    const program = affiliate.affiliate_programs as { min_payout: number };
    const minPayout = program.min_payout ?? 50;

    // Récupérer les commissions approved
    const { data: approvedCommissions } = await adminClient
      .from("commissions")
      .select("id, amount, currency")
      .eq("affiliate_id", affiliateId)
      .eq("status", "approved");

    if (!approvedCommissions || approvedCommissions.length === 0) {
      return NextResponse.json(
        { error: "Aucune commission approuvée à payer" },
        { status: 400 },
      );
    }

    const total = approvedCommissions.reduce((s, c) => s + c.amount, 0);
    const currency = approvedCommissions[0]?.currency ?? "eur";

    if (total < minPayout) {
      return NextResponse.json(
        {
          error: `Montant minimum de paiement non atteint (${total.toFixed(2)}€ / ${minPayout}€ requis)`,
        },
        { status: 400 },
      );
    }

    const commissionIds = approvedCommissions.map((c) => c.id);
    const now = new Date().toISOString();

    let stripeTransferId: string | null = null;
    let payoutStatus: "pending" | "processing" | "completed" = "pending";

    // Stripe Transfer si compte Connect configuré
    if (affiliate.stripe_account_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const transfer = await stripe.transfers.create({
          amount: Math.round(total * 100), // en centimes
          currency,
          destination: affiliate.stripe_account_id,
          description: `ScalingFlow affiliate payout — ${commissionIds.length} commissions`,
          metadata: {
            affiliate_id: affiliateId,
            commission_ids: commissionIds.join(","),
          },
        });
        stripeTransferId = transfer.id;
        payoutStatus = "completed";
      } catch (stripeErr) {
        console.error("stripe transfer error:", stripeErr);
        // Continuer avec payout manuel si Stripe échoue
      }
    }

    // Créer le payout
    const { data: payout, error: payoutError } = await adminClient
      .from("payouts")
      .insert({
        affiliate_id: affiliateId,
        amount: total,
        currency,
        method: affiliate.stripe_account_id ? "stripe" : "bank_transfer",
        stripe_transfer_id: stripeTransferId,
        status: payoutStatus,
        commissions_included: commissionIds,
        processed_at: payoutStatus === "completed" ? now : null,
      })
      .select("id")
      .single();

    if (payoutError || !payout) {
      return NextResponse.json({ error: "Impossible de créer le payout" }, { status: 500 });
    }

    // Mettre à jour les commissions
    await adminClient
      .from("commissions")
      .update({
        status: "paid",
        paid_at: now,
        payout_id: payout.id,
      })
      .in("id", commissionIds);

    // Mettre à jour le total payé de l'affilié
    await adminClient
      .from("affiliates")
      .update({ total_paid: (affiliate.total_paid ?? 0) + total })
      .eq("id", affiliateId);

    // Email confirmation affilié (non-bloquant)
    try {
      const { resend } = await import("@/lib/resend/client");
      const { affiliatePayoutEmail } = await import("@/lib/resend/templates");
      if (resend) {
        const { data: affProfile } = await adminClient
          .from("profiles")
          .select("full_name, email")
          .eq("id", affiliate.user_id)
          .single();

        if (affProfile?.email) {
          const firstName = affProfile.full_name?.split(" ")[0] || "Partenaire";
          const emailContent = affiliatePayoutEmail(firstName, total, currency);
          await resend.emails
            .send({
              from: "ScalingFlow <noreply@scalingflow.com>",
              to: affProfile.email,
              subject: emailContent.subject,
              html: emailContent.html,
            })
            .catch(() => {});
        }
      }
    } catch {
      // email failure non-bloquant
    }

    return NextResponse.json({
      success: true,
      amount: total,
      currency,
      payout_id: payout.id,
      status: payoutStatus,
      stripe_transfer_id: stripeTransferId,
    });
  } catch (err) {
    console.error("payout error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
