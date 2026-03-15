import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Fetch the funnel
    const { data: funnel, error: fetchError } = await supabase
      .from("funnels")
      .select("*")
      .eq("id", funnel_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !funnel) {
      return NextResponse.json({ error: "Funnel introuvable" }, { status: 404 });
    }

    // Generate slug if not provided
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
        { status: 409 }
      );
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
      console.error("[funnel/publish] Error:", updateError);
      return NextResponse.json(
        { error: `Erreur : ${updateError.message}` },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.scalingflow.com";
    const publicUrl = `${appUrl}/f/${finalSlug}`;

    return NextResponse.json({
      ok: true,
      slug: finalSlug,
      url: publicUrl,
      custom_domain: custom_domain || null,
    });
  } catch (err) {
    console.error("[funnel/publish] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
