import { NextRequest, NextResponse } from "next/server";

/**
 * GET /r/[code]
 * Redirect vers le tracking endpoint puis vers la landing page.
 * Exemple : /r/TOM-A3K9 ou /r/TOM-A3K9?to=/welcome
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const searchParams = req.nextUrl.searchParams;
  const to = searchParams.get("to") || "/";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `https://${req.headers.get("host")}`;

  // Construire l'URL de tracking
  const trackUrl = new URL(`${appUrl}/api/affiliates/track`);
  trackUrl.searchParams.set("code", code);
  trackUrl.searchParams.set("to", to);
  trackUrl.searchParams.set("landing", req.nextUrl.pathname);
  const referer = req.headers.get("referer");
  if (referer) trackUrl.searchParams.set("ref", referer);

  // Copier le visitor_id cookie si présent
  const visitorId = req.cookies.get("sf_visitor_id")?.value;
  if (visitorId) trackUrl.searchParams.set("visitor_id", visitorId);

  return NextResponse.redirect(trackUrl);
}
