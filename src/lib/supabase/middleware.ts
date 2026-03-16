import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveOrganization } from "@/lib/whitelabel/resolve-org";

export async function updateSession(request: NextRequest) {
  const publicRoutes = [
    "/login",
    "/register",
    "/welcome",
    "/forgot-password",
    "/reset-password",
    "/diagnostic",
  ];
  const isPublicFunnel = request.nextUrl.pathname.startsWith("/f/");
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route,
  );
  const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  let supabaseResponse = NextResponse.next({
    request,
  });

  /* ── Custom domain / subdomain detection ── */
  let resolvedOrgId: string | null = null;
  let resolvedOrgSlug: string | null = null;

  try {
    const hostname = request.headers.get("host") || "";
    const appHost = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
      : "localhost";

    // Ne pas résoudre pour le domaine principal ou localhost
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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          // Re-appliquer les headers org après recréation de la réponse
          if (resolvedOrgId) {
            supabaseResponse.headers.set("x-org-id", resolvedOrgId);
            supabaseResponse.headers.set("x-org-slug", resolvedOrgSlug!);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users to landing page
    // API routes handle their own auth (return 401 JSON, not redirect)
    if (!user && !isPublicRoute && !isPublicFunnel && !isApiRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      return NextResponse.redirect(url);
    }

    // Authenticated user on public route → check onboarding status
    if (user && isPublicRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      const url = request.nextUrl.clone();
      url.pathname = profile?.onboarding_completed ? "/" : "/onboarding";
      return NextResponse.redirect(url);
    }

    // Authenticated user on protected routes (not onboarding, not API)
    // → if onboarding not completed, force them to /onboarding
    if (user && !isOnboarding && !isApiRoute && !isPublicRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !profile.onboarding_completed) {
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

  return supabaseResponse;
}
