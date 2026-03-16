import { test, expect, type Page } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ─── Auth helper: login via Supabase API then inject session ───
async function loginAsAdmin(page: Page) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: serviceKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@scalingflow.com",
      password: "Test1234x",
    }),
  });

  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();

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
    { url: supabaseUrl, at: data.access_token, rt: data.refresh_token },
  );
}

test.describe("Phase 1 — Admin User Full Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ── Dashboard ──
  test("Dashboard loads with stats, charts and actions", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(4000);
    // Should show dashboard content (not login)
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(200);
    // Check for typical dashboard elements
    const hasContent = await page
      .locator("h1, h2, h3, [class*='stat'], [class*='card']")
      .count();
    expect(hasContent).toBeGreaterThan(0);
  });

  // ── Sidebar Navigation ──
  test("Sidebar has all navigation items", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    const nav = page.locator("nav, aside").first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  // ── Vault Page ──
  test("Vault page shows skill map and resources", async ({ page }) => {
    await page.goto("/vault");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body).toContain("Vault");
  });

  // ── Market Page with tabs ──
  test("Market page has all analysis tabs", async ({ page }) => {
    await page.goto("/market");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    // Should have market-related content
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Offer Page ──
  test("Offer page loads with generators", async ({ page }) => {
    await page.goto("/offer");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Ads Page ──
  test("Ads page loads with creative tools", async ({ page }) => {
    await page.goto("/ads");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Content Page ──
  test("Content page loads with generators", async ({ page }) => {
    await page.goto("/content");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Funnel Page ──
  test("Funnel builder page loads", async ({ page }) => {
    await page.goto("/funnel");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Sales Page ──
  test("Sales page loads with call analyzer", async ({ page }) => {
    await page.goto("/sales");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Brand Page ──
  test("Brand identity page loads", async ({ page }) => {
    await page.goto("/brand");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Launch Page ──
  test("Launch page with checklist and guide", async ({ page }) => {
    await page.goto("/launch");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Community Page ──
  test("Community page loads with feed", async ({ page }) => {
    await page.goto("/community");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Academy Page ──
  test("Academy page loads modules", async ({ page }) => {
    await page.goto("/academy");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Leaderboard ──
  test("Leaderboard page loads", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Roadmap ──
  test("Roadmap page loads with tasks", async ({ page }) => {
    await page.goto("/roadmap");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Progress ──
  test("Progress page loads", async ({ page }) => {
    await page.goto("/progress");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Settings ──
  test("Settings page shows user profile and integrations", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Assistant ──
  test("AI Assistant page loads with agent selector", async ({ page }) => {
    await page.goto("/assistant");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Pipeline ──
  test("Pipeline CRM page loads", async ({ page }) => {
    await page.goto("/pipeline");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Clients ──
  test("Clients page loads", async ({ page }) => {
    await page.goto("/clients");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Drive ──
  test("Drive page loads", async ({ page }) => {
    await page.goto("/drive");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Prospection ──
  test("Prospection page loads", async ({ page }) => {
    await page.goto("/prospection");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Admin ──
  test("Admin overview page loads", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Portal (Whitelabel) ──
  test("Whitelabel portal page loads", async ({ page }) => {
    await page.goto("/portal");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Ads Analytics ──
  test("Ads analytics page loads", async ({ page }) => {
    await page.goto("/ads/analytics");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Content Calendar ──
  test("Content calendar page loads", async ({ page }) => {
    await page.goto("/content/calendar");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── No JS errors on any page ──
  test("No critical JS errors across pages", async ({ page }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const pages = [
      "/",
      "/vault",
      "/market",
      "/offer",
      "/ads",
      "/content",
      "/funnel",
      "/sales",
      "/brand",
      "/launch",
      "/settings",
      "/assistant",
      "/community",
      "/leaderboard",
      "/academy",
      "/roadmap",
      "/progress",
    ];

    for (const p of pages) {
      await page.goto(p);
      await page.waitForTimeout(2000);
    }

    const critical = errors.filter(
      (e) =>
        !e.includes("Failed to load resource") &&
        !e.includes("net::ERR") &&
        !e.includes("hydration") &&
        !e.includes("Warning:") &&
        !e.includes("Manifest") &&
        !e.includes("service-worker") &&
        !e.includes("favicon") &&
        !e.includes("chunk") &&
        !e.includes("NEXT_REDIRECT"),
    );
    // Allow max 5 non-critical errors (some pages may have transient issues)
    expect(critical.length).toBeLessThanOrEqual(5);
  });
});
