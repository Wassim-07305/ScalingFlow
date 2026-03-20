import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deploymentId = searchParams.get("deployment_id");
    const domain = searchParams.get("domain");

    if (!deploymentId && !domain) {
      return NextResponse.json(
        { error: "deployment_id ou domain requis" },
        { status: 400 },
      );
    }

    // Fetch deployment (RLS via user_id filter)
    let query = supabase
      .from("funnel_deployments")
      .select("id, custom_domain, deploy_status, ssl_status, dns_verified")
      .eq("user_id", user.id);

    if (deploymentId) {
      query = query.eq("id", deploymentId);
    } else {
      query = query.eq("custom_domain", domain!);
    }

    const { data: deployment, error } = await query.maybeSingle();

    if (error || !deployment) {
      return NextResponse.json(
        { error: "Déploiement introuvable" },
        { status: 404 },
      );
    }

    // Subdomain-only deployments are always "live"
    if (!deployment.custom_domain) {
      return NextResponse.json({
        deployment_id: deployment.id,
        deploy_status: "active",
        dns_verified: true,
        ssl_status: "active",
      });
    }

    // Already verified — return cached status without calling Vercel again
    if (deployment.dns_verified) {
      return NextResponse.json({
        deployment_id: deployment.id,
        deploy_status: deployment.deploy_status,
        dns_verified: true,
        ssl_status: deployment.ssl_status,
      });
    }

    // Check Vercel domain verification status
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json({
        deployment_id: deployment.id,
        deploy_status: deployment.deploy_status,
        dns_verified: false,
        ssl_status: deployment.ssl_status,
        warning: "Vercel API non configurée",
      });
    }

    let dnsVerified = false;
    let vercelVerification: unknown[] = [];

    try {
      const vercelRes = await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${deployment.custom_domain}`,
        {
          headers: { Authorization: `Bearer ${vercelToken}` },
        },
      );

      if (vercelRes.ok) {
        const data = await vercelRes.json();
        dnsVerified = data.verified === true;
        vercelVerification = data.verification || [];
      }
    } catch (err) {
      console.warn("[domain-status] Vercel API error:", err);
    }

    // Update deployment record if now verified
    if (dnsVerified) {
      await supabase
        .from("funnel_deployments")
        .update({
          dns_verified: true,
          deploy_status: "active",
          ssl_status: "active",
        })
        .eq("id", deployment.id);
    }

    return NextResponse.json({
      deployment_id: deployment.id,
      deploy_status: dnsVerified ? "active" : deployment.deploy_status,
      dns_verified: dnsVerified,
      ssl_status: dnsVerified ? "active" : deployment.ssl_status,
      ...(vercelVerification.length > 0 && { vercel_verification: vercelVerification }),
    });
  } catch (err) {
    console.error("[domain-status] Unexpected error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
