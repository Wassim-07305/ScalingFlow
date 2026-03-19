import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/affiliate-payouts
 * Cron mensuel (à configurer dans vercel.json ou Supabase pg_cron).
 *
 * 1. Auto-approuve les commissions pending créées il y a > 30 jours
 * 2. Pour chaque affilié avec des commissions approved >= min_payout :
 *    - Appelle /api/affiliates/payout pour déclencher le payout
 *    - Si Stripe Connect non configuré : laisse en pending pour paiement manuel
 */
export async function GET(req: NextRequest) {
  // Vérifier le secret CRON
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: { affiliate_id: string; action: string; amount?: number; error?: string }[] = [];

  try {
    // ─── 1. Auto-approuver les commissions pending > 30 jours ─────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: toApprove } = await supabase
      .from("commissions")
      .select("id")
      .eq("status", "pending")
      .lte("created_at", thirtyDaysAgo);

    if (toApprove && toApprove.length > 0) {
      await supabase
        .from("commissions")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .in(
          "id",
          toApprove.map((c) => c.id),
        );
    }

    // ─── 2. Déclencher les payouts ────────────────────────────────────────
    // Récupérer les affiliés avec des commissions approved
    const { data: eligibleAffiliates } = await supabase
      .from("affiliates")
      .select(
        `id, stripe_account_id, user_id,
         affiliate_programs!inner(min_payout)`,
      )
      .eq("status", "active");

    const appUrl =
      process.env.NEXT_PUBLIC_APP_DOMAIN ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://scalingflow.com";

    for (const aff of eligibleAffiliates || []) {
      const program = aff.affiliate_programs as unknown as { min_payout: number };
      const minPayout = program.min_payout ?? 50;

      // Vérifier si des commissions approved existent
      const { data: approvedComms } = await supabase
        .from("commissions")
        .select("id, amount")
        .eq("affiliate_id", aff.id)
        .eq("status", "approved");

      if (!approvedComms || approvedComms.length === 0) continue;

      const total = approvedComms.reduce((s, c) => s + c.amount, 0);
      if (total < minPayout) continue;

      // Déclencher le payout via l'API
      try {
        const res = await fetch(`${appUrl}/api/affiliates/payout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cronSecret ?? ""}`,
          },
          body: JSON.stringify({ affiliate_id: aff.id }),
        });
        const json = await res.json();

        if (res.ok) {
          results.push({ affiliate_id: aff.id, action: "payout", amount: json.amount });
        } else {
          // Notifier l'admin si le payout échoue (compte Connect invalide)
          results.push({ affiliate_id: aff.id, action: "payout_failed", error: json.error });

          try {
            const { resend } = await import("@/lib/resend/client");
            if (resend) {
              const { data: adminProfiles } = await supabase
                .from("profiles")
                .select("email")
                .eq("role", "admin")
                .limit(3);

              for (const admin of adminProfiles || []) {
                if (admin.email) {
                  await resend.emails
                    .send({
                      from: "ScalingFlow <noreply@scalingflow.com>",
                      to: admin.email,
                      subject: `⚠️ Payout affilié échoué — ${aff.id}`,
                      html: `<p>Le payout pour l'affilié <strong>${aff.id}</strong> a échoué : ${json.error}</p><p>Montant : ${total.toFixed(2)}€</p>`,
                    })
                    .catch(() => {});
                }
              }
            }
          } catch {
            // ignore email failure
          }
        }
      } catch (err) {
        results.push({
          affiliate_id: aff.id,
          action: "error",
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    }

    return NextResponse.json({
      success: true,
      approved: toApprove?.length ?? 0,
      payouts: results,
      processed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("cron affiliate-payouts error:", err);
    return NextResponse.json({ error: "Erreur cron" }, { status: 500 });
  }
}
