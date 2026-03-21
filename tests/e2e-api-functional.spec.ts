import { test, expect, type Page } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "https://scalingflow.vercel.app";

// ─── Auth helper: get tokens via Supabase API ───
async function getAuthTokens(): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { apikey: serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@scalingflow.com",
        password: "Test1234x",
      }),
    },
  );

  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

async function loginAsAdmin(page: Page) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const data = await getAuthTokens();

  await page.goto("/login");
  await page.evaluate(
    ({ url, at, rt }) => {
      const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
      localStorage.setItem(
        key,
        JSON.stringify({
          access_token: at,
          refresh_token: rt,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      );
    },
    {
      url: supabaseUrl,
      at: data.access_token,
      rt: data.refresh_token,
    },
  );
}

test.describe("API Functional — Authenticated Route Responses", () => {
  test.describe.configure({ mode: "serial" });

  let authTokens: { access_token: string; refresh_token: string };

  test.beforeAll(async () => {
    authTokens = await getAuthTokens();
  });

  // ── GET /api/stripe/usage — returns usage data structure ──
  test("GET /api/stripe/usage returns usage data with valid auth", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/api/stripe/usage`, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    // The API should respond (may be 401 if cookie-only auth, but not 500)
    expect(res.status()).not.toBe(500);

    if (res.status() === 200) {
      const body = await res.json();
      // Usage endpoint should return an object with usage-related fields
      expect(body).toBeDefined();
      expect(typeof body).toBe("object");
      // Typical usage stats have these kinds of properties
      const hasUsageFields =
        "used" in body ||
        "limit" in body ||
        "allowed" in body ||
        "remaining" in body ||
        "count" in body ||
        "plan" in body;
      expect(hasUsageFields).toBe(true);
    }
  });

  // ── GET /api/admin/ai-costs — returns admin cost data ──
  test("GET /api/admin/ai-costs returns cost data for admin", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/api/admin/ai-costs`, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    // Should not be a server error
    expect(res.status()).not.toBe(500);

    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toBeDefined();
      expect(typeof body).toBe("object");
      // Admin AI costs endpoint returns structured data
      const hasAdminFields =
        "overview" in body ||
        "by_model" in body ||
        "daily_trend" in body ||
        "top_users" in body ||
        "profitability" in body;
      expect(hasAdminFields).toBe(true);
    }
  });

  // ── POST /api/ai/generate-offer — returns non-500 with valid auth ──
  test("POST /api/ai/generate-offer responds without server error", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/ai/generate-offer`, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: {
        // Intentionally minimal payload — we expect a 400/422, not a 500
        businessName: "Test Business",
        niche: "coaching",
      },
    });

    // Any response is fine as long as it's not an unhandled server crash
    expect(res.status()).not.toBe(500);
    // Valid responses: 200 (success), 400/422 (validation), 401 (auth issue),
    // 429 (rate limited), 403 (quota)
    expect([200, 400, 401, 403, 422, 429]).toContain(res.status());
  });

  // ── POST /api/meta/sync — proper response format ──
  test("POST /api/meta/sync responds with proper error when no Meta connected", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/meta/sync`, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: {},
    });

    expect(res.status()).not.toBe(500);

    if (res.status() === 400) {
      const body = await res.json();
      // Should return a French error about Meta config
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    }
    // Also accept 401 (cookie-only auth) or 200 (if Meta is configured)
    expect([200, 400, 401, 502]).toContain(res.status());
  });

  // ── POST /api/ai/chat — chat endpoint responds correctly ──
  test("POST /api/ai/chat responds without server error", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/ai/chat`, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: {
        message: "Bonjour",
        agent: "general",
      },
    });

    expect(res.status()).not.toBe(500);
    expect([200, 400, 401, 403, 429]).toContain(res.status());
  });

  // ── POST /api/gamification/award — gamification endpoint ──
  test("POST /api/gamification/award handles request properly", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/gamification/award`, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { action: "test" },
    });

    expect(res.status()).not.toBe(500);
    // Valid: 200, 400 (invalid action), 401, 403
    expect([200, 400, 401, 403, 404, 405]).toContain(res.status());
  });

  // ── POST /api/vault/resources — vault resource endpoint ──
  test("POST /api/vault/resources responds properly", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/vault/resources`, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: {},
    });

    expect(res.status()).not.toBe(500);
  });

  // ── POST /api/affiliates/register — affiliate registration ──
  test("POST /api/affiliates/register handles request", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/affiliates/register`, {
      headers: {
        Authorization: `Bearer ${authTokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: {},
    });

    expect(res.status()).not.toBe(500);
    // May return 200 (already registered or success), 400, 401
    expect([200, 400, 401, 403, 409]).toContain(res.status());
  });
});

test.describe("API Functional — Auth via Page Context", () => {
  test.describe.configure({ mode: "serial" });

  // ── Verify usage endpoint works with cookie-based auth via page ──
  test("Usage API works via authenticated page fetch", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Make API call from the authenticated page context
    const usageResponse = await page.evaluate(async () => {
      const res = await fetch("/api/stripe/usage");
      return { status: res.status, body: await res.json().catch(() => null) };
    });

    expect(usageResponse.status).not.toBe(500);

    if (usageResponse.status === 200 && usageResponse.body) {
      expect(typeof usageResponse.body).toBe("object");
    }
  });

  // ── Verify admin endpoint works with cookie-based auth ──
  test("Admin AI costs API works via authenticated admin page", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page.waitForTimeout(4000);

    const costResponse = await page.evaluate(async () => {
      const res = await fetch("/api/admin/ai-costs");
      return { status: res.status, body: await res.json().catch(() => null) };
    });

    expect(costResponse.status).not.toBe(500);

    if (costResponse.status === 200 && costResponse.body) {
      expect(costResponse.body).toHaveProperty("overview");
      expect(costResponse.body).toHaveProperty("by_model");
      expect(costResponse.body).toHaveProperty("daily_trend");
      expect(costResponse.body).toHaveProperty("top_users");
      expect(costResponse.body).toHaveProperty("profitability");
      expect(costResponse.body).toHaveProperty("cron_vs_user");
      expect(costResponse.body).toHaveProperty("cost_alerts");

      // Validate overview structure
      const overview = costResponse.body.overview;
      expect(typeof overview.cost_this_month).toBe("number");
      expect(typeof overview.total_generations).toBe("number");
      expect(typeof overview.generations_this_month).toBe("number");
    }
  });

  // ── Verify meta sync returns structured error ──
  test("Meta sync API returns structured error via page context", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(3000);

    const syncResponse = await page.evaluate(async () => {
      const res = await fetch("/api/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    });

    expect(syncResponse.status).not.toBe(500);

    // If 400, should have an error message about Meta configuration
    if (syncResponse.status === 400 && syncResponse.body) {
      expect(syncResponse.body).toHaveProperty("error");
      expect(syncResponse.body.error).toMatch(/meta|compte|configure/i);
    }
  });

  // ── Verify content suggestions endpoint ──
  test("Content suggestions API responds via page context", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/content");
    await page.waitForTimeout(3000);

    const response = await page.evaluate(async () => {
      const res = await fetch("/api/content/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return { status: res.status };
    });

    expect(response.status).not.toBe(500);
  });
});
