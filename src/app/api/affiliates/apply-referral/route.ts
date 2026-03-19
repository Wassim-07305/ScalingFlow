import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/affiliates/apply-referral
 * Appelé juste après l'inscription d'un user pour lier son compte au referral affilié.
 *
 * Lit le cookie sf_ref et le cookie sf_visitor_id pour:
 * - Mettre à jour le referral (referred_user_id, status=signed_up)
 * - Mettre à jour le profil (referred_by = affiliate_code)
 * - Incrémenter total_referrals de l'affilié
 * - Envoyer un email à l'affilié
 * - Ajouter XP à l'affilié (affiliate.referral_signup)
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

    const affiliateCode = req.cookies.get("sf_ref")?.value;
    const visitorId = req.cookies.get("sf_visitor_id")?.value;

    if (!affiliateCode) {
      return NextResponse.json({ applied: false, reason: "no_ref_cookie" });
    }

    const adminClient = createAdminClient();

    // Vérifier si l'user a déjà un referred_by (ne pas écraser)
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("referred_by, full_name, email")
      .eq("id", user.id)
      .single();

    if (existingProfile?.referred_by) {
      return NextResponse.json({ applied: false, reason: "already_referred" });
    }

    // Charger l'affilié
    const { data: affiliate } = await adminClient
      .from("affiliates")
      .select(
        `id, user_id,
         profiles!affiliates_user_id_fkey(full_name, email)`,
      )
      .eq("affiliate_code", affiliateCode)
      .eq("status", "active")
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json({ applied: false, reason: "invalid_code" });
    }

    // Empêcher l'auto-parrainage
    if (affiliate.user_id === user.id) {
      return NextResponse.json({ applied: false, reason: "self_referral" });
    }

    // Trouver le referral à mettre à jour
    let referralQuery = adminClient
      .from("referrals")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "clicked");

    if (visitorId) {
      referralQuery = referralQuery.eq("visitor_id", visitorId);
    }

    const { data: referral } = await referralQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();

    if (referral) {
      await adminClient
        .from("referrals")
        .update({
          referred_user_id: user.id,
          status: "signed_up",
          signed_up_at: now,
        })
        .eq("id", referral.id);
    } else {
      // Créer le referral si on n'a pas pu tracker le clic (lien direct sans cookie tracking)
      await adminClient.from("referrals").insert({
        affiliate_id: affiliate.id,
        visitor_id: visitorId || `user-${user.id}`,
        referred_user_id: user.id,
        status: "signed_up",
        signed_up_at: now,
      });
    }

    // Mettre à jour le profil
    await adminClient
      .from("profiles")
      .update({ referred_by: affiliateCode })
      .eq("id", user.id);

    // Incrémenter total_referrals de l'affilié
    try {
      const { error: rpcError } = await adminClient.rpc("increment_affiliate_referrals", {
        p_affiliate_id: affiliate.id,
      });
      if (rpcError) throw rpcError;
    } catch {
      // Fallback direct si la fonction RPC n'existe pas
      const { data: aff } = await adminClient
        .from("affiliates")
        .select("total_referrals")
        .eq("id", affiliate.id)
        .single();
      if (aff) {
        await adminClient
          .from("affiliates")
          .update({ total_referrals: (aff.total_referrals || 0) + 1 })
          .eq("id", affiliate.id);
      }
    }

    // Envoyer email à l'affilié (non-bloquant)
    const affiliateProfile = affiliate.profiles as {
      full_name?: string;
      email?: string;
    } | null;

    if (affiliateProfile?.email) {
      try {
        const { resend } = await import("@/lib/resend/client");
        const { affiliateNewReferralEmail } = await import("@/lib/resend/templates");
        if (resend) {
          const affiliateFirstName =
            affiliateProfile.full_name?.split(" ")[0] || "Partenaire";
          const referredFirstName =
            existingProfile?.full_name?.split(" ")[0] ||
            user.email?.split("@")[0] ||
            "Quelqu'un";

          const emailContent = affiliateNewReferralEmail(
            affiliateFirstName,
            referredFirstName,
          );
          await resend.emails
            .send({
              from: "ScalingFlow <noreply@scalingflow.com>",
              to: affiliateProfile.email,
              subject: emailContent.subject,
              html: emailContent.html,
            })
            .catch(() => {});
        }
      } catch {
        // email failure non-bloquant
      }
    }

    // XP pour l'affilié (non-bloquant)
    try {
      const { awardXPForUser } = await import("@/lib/affiliates/award-affiliate-xp");
      await awardXPForUser(affiliate.user_id, "affiliate.referral_signup");
    } catch {
      // xp failure non-bloquant
    }

    return NextResponse.json({ applied: true, affiliate_code: affiliateCode });
  } catch (err) {
    console.error("apply-referral error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
