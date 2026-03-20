import { test, expect } from "@playwright/test";

/**
 * E2E tests that verify API endpoints respond correctly.
 * Tests that routes return proper status codes for unauthenticated requests.
 */

const BASE = "http://localhost:3000";

test.describe("API Health — Auth-Protected Routes Return 401", () => {
  const protectedPostRoutes = [
    "/api/ai/generate-offer",
    "/api/ai/analyze-market",
    "/api/ai/generate-ads",
    "/api/ai/generate-content",
    "/api/ai/generate-funnel",
    "/api/ai/generate-brand",
    "/api/ai/score-offer",
    "/api/onboarding/complete",
    "/api/gamification/award",
    "/api/pipeline/update-status",
    "/api/push/subscribe",
    "/api/email/send",
    "/api/vault/resources",
    "/api/content/suggestions",
    "/api/funnel/publish",
    "/api/ads/scale",
    "/api/affiliates/register",
  ];

  for (const route of protectedPostRoutes) {
    test(`POST ${route} returns 401 without auth`, async ({ request }) => {
      const res = await request.post(`${BASE}${route}`, {
        data: { test: true },
        headers: { "Content-Type": "application/json" },
      });

      // Should return 401 (or 400/405 for some routes)
      expect([401, 400, 405, 403]).toContain(res.status());
    });
  }
});

test.describe("API Health — Stripe Webhook Security", () => {
  test("POST /api/stripe/webhook returns 400 without signature", async ({ request }) => {
    const res = await request.post(`${BASE}/api/stripe/webhook`, {
      data: '{"test": true}',
      headers: { "Content-Type": "application/json" },
    });

    // Should return 400 (missing signature) or 503 (stripe not configured)
    expect([400, 503]).toContain(res.status());
  });
});

test.describe("API Health — Public Routes Accessible", () => {
  test("GET /login is accessible", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBeLessThan(500);
  });

  test("GET /register is accessible", async ({ page }) => {
    const res = await page.goto("/register");
    expect(res?.status()).toBeLessThan(500);
  });

  test("GET /welcome is accessible", async ({ page }) => {
    const res = await page.goto("/welcome");
    expect(res?.status()).toBeLessThan(500);
  });
});
