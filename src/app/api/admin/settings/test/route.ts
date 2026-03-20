import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/settings/get-setting";

interface TestResult {
  status: "pass" | "fail";
  latency_ms: number;
  error?: string;
}

async function testWithTimeout(
  fn: () => Promise<boolean>,
  timeoutMs = 8000,
): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs),
      ),
    ]);
    return { status: result ? "pass" : "fail", latency_ms: Date.now() - start };
  } catch (err) {
    return {
      status: "fail",
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { service } = await req.json();

  let result: TestResult;

  switch (service) {
    case "anthropic": {
      const key = await getSetting("ANTHROPIC_API_KEY");
      if (!key) {
        result = { status: "fail", latency_ms: 0, error: "Clé non configurée" };
        break;
      }
      result = await testWithTimeout(async () => {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key,
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
      });
      break;
    }

    case "apify": {
      const token = await getSetting("APIFY_TOKEN");
      if (!token) {
        result = { status: "fail", latency_ms: 0, error: "Token non configuré" };
        break;
      }
      result = await testWithTimeout(async () => {
        const res = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
        return res.ok;
      });
      break;
    }

    case "replicate": {
      const token = await getSetting("REPLICATE_API_TOKEN");
      if (!token) {
        result = { status: "fail", latency_ms: 0, error: "Token non configuré" };
        break;
      }
      result = await testWithTimeout(async () => {
        const res = await fetch("https://api.replicate.com/v1/account", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
      });
      break;
    }

    case "resend": {
      const key = await getSetting("RESEND_API_KEY");
      if (!key) {
        result = { status: "fail", latency_ms: 0, error: "Clé non configurée" };
        break;
      }
      result = await testWithTimeout(async () => {
        const res = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${key}` },
        });
        return res.ok;
      });
      break;
    }

    case "stripe": {
      const key = await getSetting("STRIPE_SECRET_KEY");
      if (!key) {
        result = { status: "fail", latency_ms: 0, error: "Clé non configurée" };
        break;
      }
      result = await testWithTimeout(async () => {
        const res = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${key}` },
        });
        return res.ok;
      });
      break;
    }

    case "unipile": {
      const url = await getSetting("UNIPILE_API_URL");
      const token = await getSetting("UNIPILE_ACCESS_TOKEN");
      if (!url || !token) {
        result = {
          status: "fail",
          latency_ms: 0,
          error: `Configuration incomplète (URL: ${url ? "✓" : "✗"}, Token: ${token ? "✓" : "✗"})`,
        };
        break;
      }
      result = await testWithTimeout(async () => {
        const endpoint = `${url}/api/v1/users/me`;
        const res = await fetch(endpoint, {
          headers: { "X-API-KEY": token },
        });
        if (res.ok || res.status === 404) return true;
        const body = await res.text().catch(() => "");
        let detail = "";
        try {
          const json = JSON.parse(body);
          detail = json.message || json.error || body;
        } catch {
          detail = body;
        }
        throw new Error(
          `HTTP ${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ""}`,
        );
      });
      break;
    }

    default:
      return NextResponse.json({ error: "Service inconnu" }, { status: 400 });
  }

  return NextResponse.json(result);
}
