import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveOrganization } from "@/lib/whitelabel/resolve-org";

export async function updateSession(request: NextRequest) {
  const t_total = Date.now();
  const path = request.nextUrl.pathname;

  const publicRoutes = [
    "/login",
    "/register",
    "/welcome",
    "/forgot-password",
    "/reset-password",
    "/diagnostic",
  ];
  const isPublicFunnel = path.startsWith("/f/");
  const isPublicRoute = publicRoutes.some((route) => path === route);
  const isOnboarding = path.startsWith("/onboarding");
  const isApiRoute = path.startsWith("/api/");

  let supabaseResponse = NextResponse.next({ request });

  /* ── Custom domain / subdomain detection ── */
  let resolvedOrgId: string | null = null;
  let resolvedOrgSlug: string | null = null;

  try {
    const hostname = request.headers.get("host") || "";
    const appHost = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
      : "localhost";

    const isMainDomain =
      hostname.split(":")[0] === appHost ||
      hostname.startsWith("localhost") ||
      hostname.startsWith("127.0.0.1");

    if (!isMainDomain) {
      const org = await resolveOrganization(hostname);
      if (org) {
        resolvedOrgId = org.id;
        resolvedOrgSlug = org.slug;
        supabaseResponse.headers.set("x-org-id", org.id);
        supabaseResponse.headers.set("x-org-slug", org.slug);
      }
    }
  } catch {
    // La résolution d'org ne doit pas bloquer la navigation
  }

  // Timing metrics
  let getUserMs = 0;
  let profileMs = 0;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      if (!isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/welcome";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          if (resolvedOrgId) {
            supabaseResponse.headers.set("x-org-id", resolvedOrgId);
            supabaseResponse.headers.set("x-org-slug", resolvedOrgSlug!);
          }
        },
      },
    });

    // ── getSession (local cookie read, no network) ──
    const t_getUser = Date.now();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    getUserMs = Date.now() - t_getUser;

    // Redirect unauthenticated users
    if (!user && !isPublicRoute && !isPublicFunnel && !isApiRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      return NextResponse.redirect(url);
    }

    // ── Onboarding check (cookie-first, DB fallback) ──
    if (user && !isApiRoute) {
      const hasCookie =
        request.cookies.get("sf_onboarding")?.value === "1";

      let onboardingCompleted = hasCookie;

      if (!hasCookie) {
        // Cookie absent → query DB (first visit or cookie cleared)
        const t_profile = Date.now();
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();
        profileMs = Date.now() - t_profile;
        onboardingCompleted = profile?.onboarding_completed ?? false;

        // Persist cookie so future requests skip the DB query
        if (onboardingCompleted) {
          supabaseResponse.cookies.set("sf_onboarding", "1", {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
            httpOnly: true,
          });
        }
      }

      if (isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = onboardingCompleted ? "/" : "/onboarding";
        return NextResponse.redirect(url);
      }

      if (!isOnboarding && !isPublicFunnel && !onboardingCompleted) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }
  } catch {
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      return NextResponse.redirect(url);
    }
  }

  const totalMs = Date.now() - t_total;

  // Log to Vercel Function Logs
  console.log(
    `[middleware] ${path} — total:${totalMs}ms getUser:${getUserMs}ms profile:${profileMs}ms`,
  );

  // Server-Timing header (visible in Chrome DevTools → Network → Timing)
  supabaseResponse.headers.set(
    "Server-Timing",
    `total;dur=${totalMs}, getUser;dur=${getUserMs}, profile;dur=${profileMs}`,
  );

  return supabaseResponse;
}
