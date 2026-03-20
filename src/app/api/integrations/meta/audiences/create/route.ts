import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Meta Audience Builder API (#58) ─────────────────────────
// POST: Create cold (LLA + interests), warm, hot audiences or exclusions

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("meta_access_token, meta_ad_account_id")
      .eq("id", userId)
      .single();

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
        {
          error:
            "Connecte ton compte Meta Ads dans Paramètres → Intégrations pour utiliser cette fonctionnalité.",
          code: "META_NOT_CONNECTED",
        },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { type, name, config } = body as {
      type: "cold" | "warm" | "hot" | "exclusion";
      name: string;
      config: Record<string, unknown>;
    };

    if (!type || !name) {
      return NextResponse.json(
        { error: "Le type et le nom de l'audience sont requis." },
        { status: 400 },
      );
    }

    let metaAudienceId: string | null = null;
    let audienceSubtype = "CUSTOM";

    // ─── Cold Audience: Lookalike or Interest-based ───────────
    if (type === "cold") {
      if (config.mode === "lookalike") {
        // Lookalike Audience
        const res = await fetch(
          `${META_GRAPH_URL}/act_${adAccountId}/customaudiences`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: token,
              name,
              subtype: "LOOKALIKE",
              origin_audience_id: config.source_audience_id,
              lookalike_spec: JSON.stringify({
                type: "similarity",
                country: config.country || "FR",
                ratio: ((config.percentage as number) || 1) / 100,
              }),
            }),
          },
        );

        const data = await res.json();
        if (data.error) {
          return NextResponse.json(
            { error: `Meta API : ${data.error.message}` },
            { status: 502 },
          );
        }
        metaAudienceId = data.id;
        audienceSubtype = "LOOKALIKE";
      } else {
        // Interest-based — saved as targeting spec (no custom audience created on Meta)
        // The targeting spec will be applied at the ad set level
        audienceSubtype = "INTEREST";
      }
    }

    // ─── Warm Audience: Website visitors, engagers, video viewers ─
    if (type === "warm") {
      const ruleMap: Record<
        string,
        { pixel_id?: string; object_id?: string; event_name?: string }
      > = {
        website_visitors: { event_name: "PageView" },
        page_engagers: {},
        video_viewers: {},
        ig_engagers: {},
      };

      const source = config.source as string;
      const days = (config.days as number) || 30;

      // Website Custom Audience
      if (source === "website_visitors") {
        const res = await fetch(
          `${META_GRAPH_URL}/act_${adAccountId}/customaudiences`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: token,
              name,
              subtype: "WEBSITE",
              retention_days: days,
              rule: JSON.stringify({
                inclusions: {
                  operator: "or",
                  rules: [
                    {
                      event_sources: [
                        { id: config.pixel_id || adAccountId, type: "pixel" },
                      ],
                      retention_seconds: days * 86400,
                      filter: {
                        operator: "and",
                        filters: [
                          { field: "url", operator: "i_contains", value: "/" },
                        ],
                      },
                    },
                  ],
                },
              }),
              customer_file_source: "USER_PROVIDED_ONLY",
            }),
          },
        );

        const data = await res.json();
        if (data.error) {
          return NextResponse.json(
            { error: `Meta API : ${data.error.message}` },
            { status: 502 },
          );
        }
        metaAudienceId = data.id;
        audienceSubtype = "WEBSITE";
      } else if (source === "ig_engagers") {
        // Instagram engagement audience
        const res = await fetch(
          `${META_GRAPH_URL}/act_${adAccountId}/customaudiences`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: token,
              name,
              subtype: "ENGAGEMENT",
              rule: JSON.stringify({
                inclusions: {
                  operator: "or",
                  rules: [
                    {
                      event_sources: [
                        {
                          id: config.ig_account_id || adAccountId,
                          type: "ig_business",
                        },
                      ],
                      retention_seconds: days * 86400,
                    },
                  ],
                },
              }),
              customer_file_source: "USER_PROVIDED_ONLY",
            }),
          },
        );

        const data = await res.json();
        if (data.error) {
          return NextResponse.json(
            { error: `Meta API : ${data.error.message}` },
            { status: 502 },
          );
        }
        metaAudienceId = data.id;
        audienceSubtype = "ENGAGEMENT";
      } else if (source === "video_viewers") {
        const res = await fetch(
          `${META_GRAPH_URL}/act_${adAccountId}/customaudiences`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: token,
              name,
              subtype: "ENGAGEMENT",
              rule: JSON.stringify({
                inclusions: {
                  operator: "or",
                  rules: [
                    {
                      event_sources: [
                        { id: config.page_id || adAccountId, type: "page" },
                      ],
                      retention_seconds: days * 86400,
                      filter: {
                        operator: "and",
                        filters: [
                          {
                            field: "event",
                            operator: "eq",
                            value: "video_watched",
                          },
                        ],
                      },
                    },
                  ],
                },
              }),
              customer_file_source: "USER_PROVIDED_ONLY",
            }),
          },
        );

        const data = await res.json();
        if (data.error) {
          return NextResponse.json(
            { error: `Meta API : ${data.error.message}` },
            { status: 502 },
          );
        }
        metaAudienceId = data.id;
        audienceSubtype = "ENGAGEMENT";
      } else if (source === "page_engagers") {
        const res = await fetch(
          `${META_GRAPH_URL}/act_${adAccountId}/customaudiences`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: token,
              name,
              subtype: "ENGAGEMENT",
              rule: JSON.stringify({
                inclusions: {
                  operator: "or",
                  rules: [
                    {
                      event_sources: [
                        { id: config.page_id || adAccountId, type: "page" },
                      ],
                      retention_seconds: days * 86400,
                    },
                  ],
                },
              }),
              customer_file_source: "USER_PROVIDED_ONLY",
            }),
          },
        );

        const data = await res.json();
        if (data.error) {
          return NextResponse.json(
            { error: `Meta API : ${data.error.message}` },
            { status: 502 },
          );
        }
        metaAudienceId = data.id;
        audienceSubtype = "ENGAGEMENT";
      }
      void ruleMap; // suppress unused
    }

    // ─── Hot Audience: Opt-ins, customers, qualified leads ────
    if (type === "hot") {
      const res = await fetch(
        `${META_GRAPH_URL}/act_${adAccountId}/customaudiences`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: token,
            name,
            subtype: "CUSTOM",
            description: `Audience chaude — ${config.source || "opt-ins"}`,
            customer_file_source: "USER_PROVIDED_ONLY",
          }),
        },
      );

      const data = await res.json();
      if (data.error) {
        return NextResponse.json(
          { error: `Meta API : ${data.error.message}` },
          { status: 502 },
        );
      }
      metaAudienceId = data.id;
      audienceSubtype = "CUSTOM";
    }

    // ─── Exclusion Audience ───────────────────────────────────
    if (type === "exclusion") {
      // Exclusion audiences reference existing audiences — just save locally
      audienceSubtype = "EXCLUSION";
    }

    // ─── Save to local DB ────────────────────────────────────
    const { data: audience, error } = await supabase
      .from("meta_audiences")
      .insert({
        user_id: user.id,
        meta_audience_id: metaAudienceId,
        name,
        description: (config.description as string) || null,
        audience_type: type,
        subtype: audienceSubtype,
        source_data: config,
        status: metaAudienceId
          ? "ready"
          : type === "cold" && config.mode !== "lookalike"
            ? "targeting"
            : "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      audience,
      meta_audience_id: metaAudienceId,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création de l'audience" },
      { status: 500 },
    );
  }
}
