import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOMAIN_REGEX =
  /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/;

function getAppDomain(): string {
  if (process.env.NEXT_PUBLIC_APP_DOMAIN) return process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
    } catch {}
  }
  return "scalingflow.io";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { funnel_id, slug, custom_domain } = body;

    if (!funnel_id) {
      return NextResponse.json({ error: "funnel_id requis" }, { status: 400 });
    }

    // Validate custom_domain format if provided
    if (custom_domain && !DOMAIN_REGEX.test(custom_domain)) {
      return NextResponse.json(
        { error: "Format de domaine invalide. Ex: offre.monsite.com" },
        { status: 400 },
      );
    }

    // Fetch the funnel (user_id check enforces ownership)
    const { data: funnel, error: fetchError } = await supabase
      .from("funnels")
      .select("*")
      .eq("id", funnel_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !funnel) {
      return NextResponse.json({ error: "Funnel introuvable" }, { status: 404 });
    }

    // Validate funnel completeness
    const missing: string[] = [];
    const pages = ["optin_page", "vsl_page", "thankyou_page"] as const;
    for (const page of pages) {
      const data = funnel[page] as Record<string, unknown> | null;
      if (!data || !data.headline) {
        missing.push(page);
      }
    }
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Funnel incomplet. Pages manquantes : ${missing.join(", ")}`,
          missing,
        },
        { status: 422 },
      );
    }

    // Generate slug if not provided (same logic as publish route)
    const finalSlug =
      slug ||
      funnel.funnel_name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      `funnel-${Date.now()}`;

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("funnels")
      .select("id")
      .eq("published_slug", finalSlug)
      .neq("id", funnel_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ce slug est déjà utilisé. Choisis un autre nom." },
        { status: 409 },
      );
    }

    // Register custom domain in Vercel if provided
    let vercelError: string | null = null;
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    if (custom_domain && vercelToken && vercelProjectId) {
      try {
        const vercelRes = await fetch(
          `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: custom_domain }),
          },
        );

        if (!vercelRes.ok) {
          const vercelData = await vercelRes.json().catch(() => ({}));
          const code = vercelData?.error?.code;
          if (code === "domain_already_in_use") {
            return NextResponse.json(
              {
                error:
                  "Ce domaine est déjà utilisé par un autre projet Vercel. Retire-le d'abord depuis le dashboard Vercel.",
              },
              { status: 409 },
            );
          }
          // Non-blocking: log the error but continue with deployment
          vercelError = vercelData?.error?.message || "Vercel API error";
          console.warn("[funnel/deploy] Vercel domain registration failed:", vercelError);
        }
      } catch (err) {
        console.warn("[funnel/deploy] Vercel API call failed:", err);
        vercelError = "Impossible de contacter l'API Vercel";
      }
    } else if (custom_domain && (!vercelToken || !vercelProjectId)) {
      console.warn("[funnel/deploy] VERCEL_TOKEN or VERCEL_PROJECT_ID not set — skipping domain registration");
    }

    // Publish the funnel
    const { error: updateError } = await supabase
      .from("funnels")
      .update({
        published: true,
        published_slug: finalSlug,
        published_at: new Date().toISOString(),
        custom_domain: custom_domain || null,
        status: "published",
      })
      .eq("id", funnel_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[funnel/deploy] Update error:", updateError);
      return NextResponse.json(
        { error: `Erreur lors de la publication : ${updateError.message}` },
        { status: 500 },
      );
    }

    const appDomain = getAppDomain();
    const subdomainUrl = `https://${finalSlug}.${appDomain}`;
    const initialStatus = custom_domain ? "pending" : "active";

    // Upsert deployment record
    const { data: deployment, error: deployError } = await supabase
      .from("funnel_deployments")
      .upsert(
        {
          user_id: user.id,
          funnel_id,
          domain: subdomainUrl,
          custom_domain: custom_domain || null,
          deploy_status: vercelError ? "error" : initialStatus,
          ssl_status: custom_domain ? "pending" : "active",
          dns_verified: !custom_domain,
        },
        { onConflict: "funnel_id" },
      )
      .select("id")
      .single();

    if (deployError) {
      console.error("[funnel/deploy] Deployment upsert error:", deployError);
      // Non-fatal: funnel is published, just the tracking row failed
    }

    return NextResponse.json({
      ok: true,
      slug: finalSlug,
      url: subdomainUrl,
      custom_domain: custom_domain || null,
      deployment_id: deployment?.id || null,
      deploy_status: vercelError ? "error" : initialStatus,
      ...(vercelError && { vercel_warning: vercelError }),
    });
  } catch (err) {
    console.error("[funnel/deploy] Unexpected error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
