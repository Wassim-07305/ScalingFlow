import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashIp } from "@/lib/affiliates/hash-ip";

/**
 * GET /api/affiliates/track?code=TOM-A3K9&to=/&landing=/r/TOM-A3K9
 *
 * - Charge l'affilié + programme (vérifie is_active)
 * - Hash IP pour RGPD
 * - Rate limit : 100 clics / ip_hash / heure
 * - Dédoublonnage : si visitor_id a déjà un referral pour cet affilié, skip création
 * - Crée le referral (status: 'clicked')
 * - Crée un touchpoint (source='affiliate', content=affiliate_code)
 * - Pose le cookie sf_ref (last-click wins)
 * - Redirige vers la landing page
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const to = searchParams.get("to") || "/";
  const landing = searchParams.get("landing") || "/";
  const referer = searchParams.get("ref") || req.headers.get("referer") || null;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_DOMAIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    `https://${req.headers.get("host")}`;

  const redirectUrl = new URL(to.startsWith("http") ? to : `${appUrl}${to}`);

  if (!code) {
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = createAdminClient();

    // Charger l'affilié et son programme
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select(
        `id, affiliate_code, program_id,
         affiliate_programs!inner(is_active, cookie_duration_days, name)`,
      )
      .eq("affiliate_code", code)
      .eq("status", "active")
      .single();

    if (!affiliate || !affiliate.affiliate_programs) {
      return NextResponse.redirect(redirectUrl);
    }

    const program = affiliate.affiliate_programs as unknown as {
      is_active: boolean;
      cookie_duration_days: number;
      name: string;
    };

    if (!program.is_active) {
      return NextResponse.redirect(redirectUrl);
    }

    // Hash IP pour RGPD
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ipHash = await hashIp(ip);

    // Rate limiting : max 100 clics / ip_hash / heure
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentClicks } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo);

    if ((recentClicks ?? 0) >= 100) {
      return NextResponse.redirect(redirectUrl);
    }

    // Visitor ID (depuis cookie ou query param)
    const visitorId =
      searchParams.get("visitor_id") ||
      req.cookies.get("sf_visitor_id")?.value ||
      crypto.randomUUID();

    // Dédoublonnage : visitor_id a déjà un referral actif pour cet affilié ?
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .eq("visitor_id", visitorId)
      .in("status", ["clicked", "signed_up", "converted"])
      .maybeSingle();

    if (!existingReferral) {
      // Créer le referral
      await supabase.from("referrals").insert({
        affiliate_id: affiliate.id,
        visitor_id: visitorId,
        landing_page: landing,
        ip_hash: ipHash,
        status: "clicked",
      });

      // Créer le touchpoint dans le système d'attribution
      await supabase.from("touchpoints").insert({
        visitor_id: visitorId,
        source: "affiliate",
        medium: "referral",
        content: code,
        campaign: affiliate.program_id,
        referrer: referer,
        landing_page: landing,
        event_type: "pageview",
        channel: "referral",
      });
    }

    // Construire la réponse avec le cookie sf_ref et sf_visitor_id
    const response = NextResponse.redirect(redirectUrl);

    const cookieDays = program.cookie_duration_days ?? 90;
    const cookieMaxAge = cookieDays * 24 * 60 * 60;

    // Cookie sf_ref (last-click wins)
    response.cookies.set("sf_ref", code, {
      maxAge: cookieMaxAge,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Persist visitor_id si pas déjà présent
    if (!req.cookies.get("sf_visitor_id")) {
      response.cookies.set("sf_visitor_id", visitorId, {
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (err) {
    console.error("affiliate track error:", err);
    return NextResponse.redirect(redirectUrl);
  }
}
