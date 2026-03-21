import { NextRequest, NextResponse } from "next/server";
import { checkAIUsage, incrementAIUsage } from "@/lib/stripe/check-usage";
import { getModelForGeneration, estimateCostUSD } from "@/lib/ai/model-router";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import {
  businessAuditPrompt,
  type BusinessAuditContext,
  type BusinessAuditResult,
} from "@/lib/ai/prompts/business-audit";
import { awardXP } from "@/lib/gamification/xp-engine";
import { notifyGeneration } from "@/lib/notifications/create";
import { buildFullVaultContext } from "@/lib/ai/vault-context";
import { rateLimit } from "@/lib/utils/rate-limit";

export const maxDuration = 60;

interface ImportedData {
  meta?: {
    total_spend: number;
    total_clicks: number;
    total_impressions: number;
    total_conversions: number;
    avg_roas: number;
    avg_cpl: number;
    campaign_count: number;
  };
  stripe?: {
    revenue_30d: number;
  };
  ghl?: {
    connected: boolean;
    webhook_url?: string;
  };
  sources: string[];
}

async function fetchImportedData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ImportedData> {
  const sources: string[] = [];
  const result: ImportedData = { sources };

  // Check connected accounts
  const { data: connections } = await supabase
    .from("connected_accounts")
    .select("provider, provider_account_id, metadata")
    .eq("user_id", userId)
    .in("provider", ["meta", "stripe_connect", "ghl"]);

  const metaConn = connections?.find((c) => c.provider === "meta");
  const stripeConn = connections?.find((c) => c.provider === "stripe_connect");
  const ghlConn = connections?.find((c) => c.provider === "ghl");

  // Meta Ads: aggregate KPIs from ad_campaigns (last 30 days synced data)
  if (metaConn) {
    const { data: campaigns } = await supabase
      .from("ad_campaigns")
      .select(
        "total_spend, total_clicks, total_impressions, total_conversions, roas",
      )
      .eq("user_id", userId)
      .eq("campaign_type", "meta_ads");

    if (campaigns && campaigns.length > 0) {
      const totalSpend = campaigns.reduce(
        (s, c) => s + (c.total_spend || 0),
        0,
      );
      const totalClicks = campaigns.reduce(
        (s, c) => s + (c.total_clicks || 0),
        0,
      );
      const totalImpressions = campaigns.reduce(
        (s, c) => s + (c.total_impressions || 0),
        0,
      );
      const totalConversions = campaigns.reduce(
        (s, c) => s + (c.total_conversions || 0),
        0,
      );
      const avgRoas =
        campaigns.length > 0
          ? campaigns.reduce((s, c) => s + (c.roas || 0), 0) / campaigns.length
          : 0;
      const avgCpl = totalConversions > 0 ? totalSpend / totalConversions : 0;

      result.meta = {
        total_spend: Math.round(totalSpend * 100) / 100,
        total_clicks: totalClicks,
        total_impressions: totalImpressions,
        total_conversions: totalConversions,
        avg_roas: Math.round(avgRoas * 100) / 100,
        avg_cpl: Math.round(avgCpl * 100) / 100,
        campaign_count: campaigns.length,
      };
      sources.push("meta");
    }
  }

  // Stripe Connect: get revenue from metadata or profile
  if (stripeConn) {
    const meta = stripeConn.metadata as Record<string, unknown> | null;
    const chargesEnabled = meta?.charges_enabled;
    if (chargesEnabled) {
      // Use profile current_revenue as proxy if available, or metadata
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_revenue")
        .eq("id", userId)
        .maybeSingle();

      result.stripe = {
        revenue_30d: profile?.current_revenue || 0,
      };
      sources.push("stripe");
    }
  }

  // GHL
  if (ghlConn) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("ghl_webhook_url")
      .eq("id", userId)
      .maybeSingle();

    result.ghl = {
      connected: true,
      webhook_url: profile?.ghl_webhook_url || undefined,
    };
    sources.push("ghl");
  }

  return result;
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

    // Rate limiting
    const rl = await rateLimit(user.id, "audit-business", {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques secondes." },
        { status: 429 },
      );
    }

    // Check AI usage limits
    const usage = await checkAIUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Limite de générations IA atteinte", usage },
        { status: 403 },
      );
    }

    const body: BusinessAuditContext = await req.json();

    // Fetch imported data from connected integrations
    const importedData = await fetchImportedData(supabase, user.id);

    // Build integration data supplement for the prompt
    let integrationContext = "";
    if (importedData.sources.length > 0) {
      integrationContext +=
        "\n\n## DONNÉES IMPORTÉES DEPUIS LES INTÉGRATIONS\n";

      if (importedData.meta) {
        integrationContext += `\n### Meta Ads (30 derniers jours)
- Dépense totale : ${importedData.meta.total_spend} EUR
- Impressions : ${importedData.meta.total_impressions.toLocaleString("fr-FR")}
- Clics : ${importedData.meta.total_clicks.toLocaleString("fr-FR")}
- Conversions : ${importedData.meta.total_conversions}
- ROAS moyen : ${importedData.meta.avg_roas}x
- CPL moyen : ${importedData.meta.avg_cpl} EUR
- Nombre de campagnes : ${importedData.meta.campaign_count}`;
      }

      if (importedData.stripe) {
        integrationContext += `\n\n### Stripe (revenu)
- Revenu mensuel vérifié : ${importedData.stripe.revenue_30d} EUR/mois`;
      }

      if (importedData.ghl) {
        integrationContext += `\n\n### GoHighLevel
- CRM connecté : Oui${importedData.ghl.webhook_url ? "\n- Webhook configuré" : ""}`;
      }

      integrationContext +=
        "\n\nUtilise ces données réelles en priorité par rapport aux données saisies manuellement pour ton analyse. Mentionne explicitement dans tes recommandations les KPIs importés.";
    }

    const vaultContext = await buildFullVaultContext(user.id);
    const basePrompt = businessAuditPrompt(body);

    const fullPrompt = [basePrompt, integrationContext, vaultContext]
      .filter(Boolean)
      .join("\n");

    const aiModel = getModelForGeneration("audit_business");

    const { data: result, usage: aiUsage } = await generateJSON<BusinessAuditResult>({
      model: aiModel,
      prompt: fullPrompt,
      maxTokens: 6000,
      temperature: 0.7,
    });

    // Award XP (non-blocking)
    try {
      await awardXP(user.id, "generation.business_audit");
    } catch {}
    try {
      await notifyGeneration(user.id, "generation.business_audit");
    } catch {}

    incrementAIUsage(user.id, { generationType: "audit_business", model: aiModel, inputTokens: aiUsage.inputTokens, outputTokens: aiUsage.outputTokens, cachedTokens: aiUsage.cachedTokens, costUsd: estimateCostUSD(aiModel, aiUsage.inputTokens, aiUsage.outputTokens, aiUsage.cachedTokens) }).catch(() => {});

    return NextResponse.json({
      ...result,
      _imported_sources: importedData.sources,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur audit : ${message}` },
      { status: 500 },
    );
  }
}
