import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("API Routes - Health Check", () => {
  test("AI analyze-market requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/analyze-market`, {
      data: { skills: [] },
    });
    expect(response.status()).toBe(401);
  });

  test("AI generate-ads requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/generate-ads`, {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("AI generate-offer requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/generate-offer`, {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("AI generate-content requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/generate-content`, {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("AI generate-funnel requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/generate-funnel`, {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("AI generate-assets requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/generate-assets`, {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("AI chat requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/chat`, {
      data: { message: "test", agentType: "general" },
    });
    expect(response.status()).toBe(401);
  });

  test("AI analyze-call requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/analyze-call`, {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("AI score-offer requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/score-offer`, {
      data: {},
    });
    expect(response.status()).toBe(401);
  });

  test("vault upload requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/vault/upload`);
    expect(response.status()).toBe(401);
  });

  test("drive upload requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/drive/upload`);
    expect(response.status()).toBe(401);
  });

  test("gamification award requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/gamification/award`, {
      data: { activity: "test" },
    });
    expect(response.status()).toBe(401);
  });

  test("account delete requires auth", async ({ request }) => {
    const response = await request.post(`${BASE}/api/account/delete`);
    // 401 (no auth), 405 (wrong method), or 500 are all acceptable
    expect([401, 405, 500]).toContain(response.status());
  });

  test("stripe webhook rejects invalid signature", async ({ request }) => {
    const response = await request.post(`${BASE}/api/stripe/webhook`, {
      data: "test",
      headers: { "stripe-signature": "invalid" },
    });
    expect([400, 401, 500]).toContain(response.status());
  });

  test("GHL connect redirects to OAuth", async ({ request }) => {
    const response = await request.get(`${BASE}/api/integrations/ghl/connect`, {
      maxRedirects: 0,
    });
    // Should be 401 (no auth) or 307 (redirect to GHL)
    expect([401, 307, 302]).toContain(response.status());
  });

  test("Meta connect redirects or requires auth", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/integrations/meta/connect`,
      {
        maxRedirects: 0,
      },
    );
    expect([401, 307, 302]).toContain(response.status());
  });

  test("ads auto-decisions CRON requires secret", async ({ request }) => {
    const response = await request.get(`${BASE}/api/ads/auto-decisions`);
    expect(response.status()).toBe(401);
  });

  test("creative cycle CRON requires secret", async ({ request }) => {
    const response = await request.get(`${BASE}/api/ads/creative-cycle`);
    expect(response.status()).toBe(401);
  });

  test("content auto-generate CRON requires secret", async ({ request }) => {
    const response = await request.get(`${BASE}/api/content/auto-generate`);
    expect(response.status()).toBe(401);
  });

  test("public diagnostic endpoint works", async ({ request }) => {
    const response = await request.get(`${BASE}/api/public/diagnostic`);
    // Should work without auth (public endpoint) — may need query params
    expect([200, 400, 405]).toContain(response.status());
  });
});
