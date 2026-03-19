import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeContentPerformance } from "@/lib/services/content-performance-analyzer";
import { buildContinuousContentPrompt } from "@/lib/ai/prompts/content-continuous";

// ─── Feature 1.4 + 1.5 — Contenu Continu & Adaptation Intelligente ───────────
// CRON hebdomadaire (lundi 7h) : génère 3-5 suggestions/user en batch de 10
// Idempotent : skip si suggestions déjà générées cette semaine

const anthropic = new Anthropic();

async function getAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Returns the Monday of the current week (ISO date string YYYY-MM-DD)
function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sunday, 1=Monday...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().split("T")[0];
}

// Process a single user: check idempotency, analyze perf, generate, store, notify
async function processUser(
  profile: {
    id: string;
    niche: string | null;
    offer_name: string | null;
    target_audience: string | null;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  weekOf: string,
): Promise<{ userId: string; count: number; skipped: boolean }> {
  const userId = profile.id;

  // ── Idempotency check ──────────────────────────────────────────────────────
  const { count: existingCount } = await supabase
    .from("content_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("week_of", weekOf);

  if (existingCount && existingCount > 0) {
    console.log(`[content-cron] skip user ${userId} — already generated week ${weekOf}`);
    return { userId, count: 0, skipped: true };
  }

  // ── Performance analysis (Feature 1.5) ────────────────────────────────────
  const performanceProfile = await analyzeContentPerformance(userId, supabase);

  // ── Ads data: top 3 active creatives by CTR ───────────────────────────────
  const { data: topAds } = await supabase
    .from("ad_creatives")
    .select("ad_copy, ctr")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("ctr", { ascending: false })
    .limit(3);

  const adInsights = (topAds ?? [])
    .filter((a: { ctr: number }) => a.ctr > 0)
    .map((a: { ad_copy: string; ctr: number }, i: number) => ({
      hook: (a.ad_copy as string)?.slice(0, 120) ?? `Hook ads #${i + 1}`,
      ctr: (a.ctr as number) ?? 0,
    }));

  // ── Recent sales objections (14 days) ─────────────────────────────────────
  const { data: recentCalls } = await supabase
    .from("sales_calls")
    .select("objections")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .limit(5);

  const salesObjections: string[] = (recentCalls ?? [])
    .flatMap((c: { objections: unknown }) =>
      Array.isArray(c.objections) ? c.objections : [],
    )
    .filter(Boolean)
    .slice(0, 8)
    .map(String);

  // ── User persona from market analysis ─────────────────────────────────────
  const { data: market } = await supabase
    .from("market_analyses")
    .select("target_avatar")
    .eq("user_id", userId)
    .eq("selected", true)
    .single();

  const persona =
    (market?.target_avatar as string) ?? profile.target_audience ?? "Entrepreneurs";

  // ── AI generation ─────────────────────────────────────────────────────────
  const systemPrompt = buildContinuousContentPrompt({
    niche: profile.niche ?? "Business",
    offer: profile.offer_name ?? "Offre non précisée",
    persona,
    performanceProfile,
    salesObjections,
    adInsights,
  });

  let parsed: { contents?: unknown[] } | null = null;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: systemPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
  } catch (err) {
    console.error(`[content-cron] AI error for user ${userId}:`, err);
    return { userId, count: 0, skipped: false };
  }

  if (!parsed?.contents || !Array.isArray(parsed.contents)) {
    console.warn(`[content-cron] No contents in AI response for user ${userId}`);
    return { userId, count: 0, skipped: false };
  }

  // ── Store suggestions (max 5) ──────────────────────────────────────────────
  const contents = (parsed.contents as Record<string, unknown>[]).slice(0, 5);
  let count = 0;

  for (const c of contents) {
    const { error } = await supabase.from("content_suggestions").insert({
      user_id: userId,
      content_type: c.type ?? "post",
      script: {
        title: c.title,
        hook: c.hook,
        script: c.script,
        hashtags: c.hashtags ?? [],
        best_posting_time: c.best_posting_time,
        duration: c.duration ?? null,
        chapters: c.chapters ?? null,
      },
      source_insight: c.source_insight ?? null,
      angle: c.angle ?? "educatif",
      pillar: c.pillar ?? "know",
      reasoning: c.reasoning ?? null,
      week_of: weekOf,
      status: "suggested",
    });

    if (error) {
      console.error(`[content-cron] insert error for user ${userId}:`, error);
    } else {
      count++;
    }
  }

  // ── In-app notification ────────────────────────────────────────────────────
  if (count > 0) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "system",
      title: "Tes suggestions contenu de la semaine sont prêtes",
      message: `${count} script${count > 1 ? "s" : ""} généré${count > 1 ? "s" : ""} par l'IA, adapté${count > 1 ? "s" : ""} à tes performances. Consulte et accepte ceux qui te correspondent.`,
      link: "/content?tab=suggestions",
    });
    console.log(`[content-cron] user ${userId}: ${count} suggestions created`);
  }

  return { userId, count, skipped: false };
}

// Process users in batches of 10 to avoid overwhelming the AI API
async function processBatch(
  profiles: {
    id: string;
    niche: string | null;
    offer_name: string | null;
    target_audience: string | null;
  }[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  weekOf: string,
) {
  const results: { userId: string; count: number; skipped: boolean }[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((p) => processUser(p, supabase, weekOf)),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error("[content-cron] batch error:", result.reason);
      }
    }

    console.log(
      `[content-cron] batch ${Math.floor(i / BATCH_SIZE) + 1} done (${batch.length} users)`,
    );
  }

  return results;
}

async function runContentGeneration() {
  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const weekOf = getMondayOfCurrentWeek();
  console.log(`[content-cron] Starting weekly generation for week ${weekOf}`);

  // Fetch active users: onboarding completed + has validated/active offer + selected market
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      niche,
      offer_name,
      target_audience,
      offers!inner(status),
      market_analyses!inner(selected)
    `)
    .eq("onboarding_completed", true)
    .in("offers.status", ["validated", "active"])
    .eq("market_analyses.selected", true);

  if (error) {
    console.error("[content-cron] Failed to fetch profiles:", error);
    return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
  }

  // Deduplicate (JOIN may produce duplicates)
  const seen = new Set<string>();
  const uniqueProfiles = (profiles ?? []).filter((p: { id: string }) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  console.log(`[content-cron] ${uniqueProfiles.length} active users found`);

  const results = await processBatch(uniqueProfiles, supabase, weekOf);

  const totalGenerated = results.reduce((s, r) => s + r.count, 0);
  const skipped = results.filter((r) => r.skipped).length;
  const processed = results.filter((r) => !r.skipped).length;

  console.log(
    `[content-cron] Done: ${totalGenerated} suggestions for ${processed} users (${skipped} skipped)`,
  );

  return NextResponse.json({
    success: true,
    week: weekOf,
    totalGenerated,
    processed,
    skipped,
    results: results.map((r) => ({ userId: r.userId, count: r.count, skipped: r.skipped })),
  });
}

// GET — Vercel CRON (authenticated with CRON_SECRET)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    return await runContentGeneration();
  } catch (err) {
    console.error("[content-cron] Unhandled error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
