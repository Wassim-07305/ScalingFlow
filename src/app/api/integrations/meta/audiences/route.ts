import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Meta Custom Audiences API (#58) ─────────────────────────
// POST: Create a custom audience
// GET: List audiences

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

async function getMetaCredentials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("connected_accounts")
    .select("access_token, provider_account_id")
    .eq("user_id", userId)
    .eq("provider", "meta")
    .maybeSingle();

  if (!data?.access_token || !data?.provider_account_id) {
    // Fallback to legacy profile fields
    const { data: profile } = await supabase
      .from("profiles")
      .select("meta_access_token, meta_ad_account_id")
      .eq("id", userId)
      .maybeSingle();

    return {
      token: profile?.meta_access_token,
      adAccountId: profile?.meta_ad_account_id,
    };
  }

  return { token: data.access_token, adAccountId: data.provider_account_id };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { token, adAccountId } = await getMetaCredentials(supabase, user.id);
    if (!token || !adAccountId) {
      return NextResponse.json(
        { error: "Connecte ton compte Meta Ads d'abord." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, description, audience_type, subtype, source_data } = body;

    if (!name || !audience_type) {
      return NextResponse.json(
        { error: "name et audience_type sont requis" },
        { status: 400 },
      );
    }

    let metaAudienceId: string | null = null;

    if (audience_type === "custom") {
      // Create Custom Audience on Meta
      const res = await fetch(
        `${META_GRAPH_URL}/act_${adAccountId}/customaudiences`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: token,
            name,
            description: description || "",
            subtype: subtype || "CUSTOM",
            customer_file_source: "USER_PROVIDED_ONLY",
          }),
        },
      );

      const data = await res.json();
      if (data.error) {
        return NextResponse.json(
          { error: `Meta API: ${data.error.message}` },
          { status: 502 },
        );
      }
      metaAudienceId = data.id;
    } else if (audience_type === "lookalike") {
      // Create Lookalike Audience
      const res = await fetch(
        `${META_GRAPH_URL}/act_${adAccountId}/customaudiences`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: token,
            name,
            subtype: "LOOKALIKE",
            origin_audience_id: source_data?.source_audience_id,
            lookalike_spec: JSON.stringify({
              type: "similarity",
              country: source_data?.country || "FR",
              ratio: source_data?.ratio || 0.01,
            }),
          }),
        },
      );

      const data = await res.json();
      if (data.error) {
        return NextResponse.json(
          { error: `Meta API: ${data.error.message}` },
          { status: 502 },
        );
      }
      metaAudienceId = data.id;
    }

    // Save to local DB
    const { data: audience, error } = await supabase
      .from("meta_audiences")
      .insert({
        user_id: user.id,
        meta_audience_id: metaAudienceId,
        name,
        description,
        audience_type,
        subtype: subtype || null,
        source_data: source_data || null,
        status: metaAudienceId ? "ready" : "draft",
      })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, audience });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'audience" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: audiences } = await supabase
      .from("meta_audiences")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ audiences: audiences || [] });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des audiences" },
      { status: 500 },
    );
  }
}
