import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAffiliateCode } from "@/lib/affiliates/generate-code";

const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_DOMAIN ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://scalingflow.com";

/**
 * POST /api/affiliates/register
 * Inscrit un utilisateur Pro/Premium comme affilié.
 * Corps optionnel : { accept_terms: true }
 *
 * Crée ou utilise le programme par défaut (premier admin).
 * Génère un affiliate_code unique et le referral_link.
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

    // Vérifier que le user est Pro ou Premium
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, subscription_status, subscription_plan, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    const isPaidUser =
      profile.role === "admin" ||
      (profile.subscription_status === "active" &&
        ["starter", "pro", "scale", "agency", "premium"].includes(profile.subscription_plan || ""));

    if (!isPaidUser) {
      return NextResponse.json(
        { error: "Plan Pro ou Premium requis pour rejoindre le programme partenaire" },
        { status: 403 },
      );
    }

    const adminClient = createAdminClient();

    // Récupérer ou créer le programme par défaut
    let { data: program } = await adminClient
      .from("affiliate_programs")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!program) {
      // Créer le programme par défaut (owner = cet admin)
      const { data: newProgram, error: programError } = await adminClient
        .from("affiliate_programs")
        .insert({
          owner_id: user.id,
          name: "Programme Partenaire ScalingFlow",
          commission_type: "recurring",
          commission_rate: 20.0,
          recurring_months: 12,
          cookie_duration_days: 90,
          min_payout: 50.0,
          payout_frequency: "monthly",
          is_active: true,
        })
        .select("id")
        .maybeSingle();

      if (programError || !newProgram) {
        return NextResponse.json(
          { error: "Impossible de créer le programme" },
          { status: 500 },
        );
      }
      program = newProgram;
    }

    // Vérifier que l'utilisateur n'est pas déjà affilié
    const { data: existingAffiliate } = await adminClient
      .from("affiliates")
      .select("id, affiliate_code, referral_link")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .maybeSingle();

    if (existingAffiliate) {
      return NextResponse.json({
        message: "Déjà inscrit au programme",
        affiliate: existingAffiliate,
      });
    }

    // Générer un code unique
    const firstName = profile.full_name?.split(" ")[0] || "SF";
    let affiliateCode: string;
    let attempts = 0;

    do {
      affiliateCode = generateAffiliateCode(firstName);
      const { data: codeExists } = await adminClient
        .from("affiliates")
        .select("id")
        .eq("affiliate_code", affiliateCode)
        .maybeSingle();

      if (!codeExists) break;
      attempts++;
    } while (attempts < 10);

    const referralLink = `${APP_DOMAIN}/r/${affiliateCode}`;

    const { data: newAffiliate, error: affiliateError } = await adminClient
      .from("affiliates")
      .insert({
        user_id: user.id,
        program_id: program.id,
        affiliate_code: affiliateCode,
        referral_link: referralLink,
        status: "active",
        tier: "standard",
      })
      .select("id, affiliate_code, referral_link, tier, total_earned, total_referrals")
      .maybeSingle();

    if (affiliateError || !newAffiliate) {
      return NextResponse.json(
        { error: "Impossible de créer le compte affilié" },
        { status: 500 },
      );
    }

    // Notifier l'admin par email (non-bloquant)
    try {
      const { resend } = await import("@/lib/resend/client");
      const { adminNewAffiliateEmail } = await import("@/lib/resend/templates");
      if (resend) {
        const { data: adminProfiles } = await adminClient
          .from("profiles")
          .select("email")
          .eq("role", "admin")
          .limit(5);

        for (const adminProfile of adminProfiles || []) {
          if (adminProfile.email) {
            const emailContent = adminNewAffiliateEmail(
              profile.full_name || user.email || "Inconnu",
            );
            await resend.emails
              .send({
                from: "ScalingFlow <noreply@scalingflow.com>",
                to: adminProfile.email,
                subject: emailContent.subject,
                html: emailContent.html,
              })
              .catch(() => {});
          }
        }
      }
    } catch {
      // email failure non-bloquant
    }

    return NextResponse.json({
      message: "Inscription au programme partenaire réussie",
      affiliate: newAffiliate,
    });
  } catch (err) {
    console.error("affiliate register error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * GET /api/affiliates/register
 * Récupère le statut affilié de l'utilisateur connecté.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select(
        `id, affiliate_code, referral_link, status, tier,
         custom_commission_rate, total_earned, total_paid,
         total_referrals, total_conversions, created_at, stripe_account_id,
         affiliate_programs(name, commission_rate, commission_type,
           recurring_months, min_payout, payout_frequency, terms_url)`,
      )
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ affiliate: affiliate || null });
  } catch (err) {
    console.error("affiliate get error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
