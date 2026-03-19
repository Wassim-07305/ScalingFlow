import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/settings/get-setting";

// ─── F60 — Real API Connectivity Tests ───────────────────────
// Tests actual API connectivity (not just config existence)

interface TestResult {
  name: string;
  status: "pass" | "fail";
  latency_ms: number;
  error?: string;
}

async function testWithTimeout(
  name: string,
  fn: () => Promise<boolean>,
  timeoutMs = 5000,
): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs),
      ),
    ]);
    return {
      name,
      status: result ? "pass" : "fail",
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      name,
      status: "fail",
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
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

    const tests: TestResult[] = [];

    // 1. Test Supabase connectivity (always available)
    tests.push(
      await testWithTimeout("Supabase", async () => {
        const { error } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("id", user.id);
        return !error;
      }),
    );

    // 2. Test Meta Graph API
    const { data: metaCreds } = await supabase
      .from("connected_accounts")
      .select("access_token, provider_account_id")
      .eq("user_id", user.id)
      .eq("provider", "meta")
      .single();

    const metaToken = metaCreds?.access_token || await getSetting("META_ACCESS_TOKEN");
    if (metaToken) {
      tests.push(
        await testWithTimeout("Meta Ads API", async () => {
          const res = await fetch(
            `https://graph.facebook.com/v21.0/me?access_token=${metaToken}`,
          );
          return res.ok;
        }),
      );
    }

    // 3. Test Stripe API
    const stripeKey = await getSetting("STRIPE_SECRET_KEY");
    if (stripeKey) {
      tests.push(
        await testWithTimeout("Stripe", async () => {
          const res = await fetch("https://api.stripe.com/v1/balance", {
            headers: { Authorization: `Bearer ${stripeKey}` },
          });
          return res.ok;
        }),
      );
    }

    // 4. Test Anthropic (Claude AI)
    const anthropicKey = await getSetting("ANTHROPIC_API_KEY");
    if (anthropicKey) {
      tests.push(
        await testWithTimeout("Claude AI", async () => {
          // Lightweight check — just validate the key works
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 1,
              messages: [{ role: "user", content: "ping" }],
            }),
          });
          return res.ok;
        }),
      );
    }

    // 5. Test Unipile
    const unipileUrl = await getSetting("UNIPILE_API_URL");
    const unipileToken = await getSetting("UNIPILE_ACCESS_TOKEN");
    if (unipileUrl && unipileToken) {
      tests.push(
        await testWithTimeout("Unipile", async () => {
          const res = await fetch(`${unipileUrl}/api/v1/users/me`, {
            headers: { "X-API-KEY": unipileToken },
          });
          return res.ok || res.status === 404; // 404 is OK — API is reachable
        }),
      );
    }

    // 6. Test Resend
    const resendKey = await getSetting("RESEND_API_KEY");
    if (resendKey) {
      tests.push(
        await testWithTimeout("Resend (Email)", async () => {
          const res = await fetch("https://api.resend.com/domains", {
            headers: { Authorization: `Bearer ${resendKey}` },
          });
          return res.ok;
        }),
      );
    }

    const passedCount = tests.filter((t) => t.status === "pass").length;

    return NextResponse.json({
      tests,
      passedCount,
      totalCount: tests.length,
      allPassed: passedCount === tests.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors des tests de connectivité" },
      { status: 500 },
    );
  }
}
