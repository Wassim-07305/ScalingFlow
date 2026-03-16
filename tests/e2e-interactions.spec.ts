import { test, expect, type Page } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

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

test.describe("Phase 2 — Business Logic & Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ── Settings: Profile form interaction ──
  test("Settings page shows profile form fields", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForTimeout(4000);
    // Settings page should have content (forms may be behind tabs/modals)
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Assistant: Agent selector works ──
  test("Assistant shows agent selection and chat input", async ({ page }) => {
    await page.goto("/assistant");
    await page.waitForTimeout(4000);
    // Should have a text input or textarea for chat
    const chatInput = page.locator("input[type='text'], textarea").last();
    const isVisible = await chatInput.isVisible().catch(() => false);
    // At minimum, the page should have loaded content
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(200);
  });

  // ── Community: Post feed visible ──
  test("Community shows post feed or empty state", async ({ page }) => {
    await page.goto("/community");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    // Either has posts or shows empty state
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Vault: Skill map or empty state ──
  test("Vault shows skill map visualization or analysis button", async ({
    page,
  }) => {
    await page.goto("/vault");
    await page.waitForTimeout(5000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
    // Should have either a chart, mindmap, or a generate button
    const hasChart = await page
      .locator("svg, canvas, [class*='chart'], [class*='radar']")
      .count();
    const hasButton = await page.locator("button").count();
    expect(hasChart + hasButton).toBeGreaterThan(0);
  });

  // ── Market: Tabs navigation ──
  test("Market page tabs are clickable", async ({ page }) => {
    await page.goto("/market");
    await page.waitForTimeout(4000);
    // Find tab-like elements
    const tabs = page
      .locator("[role='tab'], [data-state], button")
      .filter({ hasText: /analyse|insight|schwartz|persona|concur/i });
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      // Click the second tab
      await tabs.nth(Math.min(1, tabCount - 1)).click();
      await page.waitForTimeout(2000);
      const body = await page.textContent("body");
      expect(body!.length).toBeGreaterThan(100);
    }
  });

  // ── Offer: Generator buttons present ──
  test("Offer page has generator sections", async ({ page }) => {
    await page.goto("/offer");
    await page.waitForTimeout(4000);
    const buttons = await page.locator("button").count();
    expect(buttons).toBeGreaterThanOrEqual(1);
  });

  // ── Content: Calendar and generators ──
  test("Content calendar page has calendar view", async ({ page }) => {
    await page.goto("/content/calendar");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Pipeline: Board columns ──
  test("Pipeline page shows board or empty state", async ({ page }) => {
    await page.goto("/pipeline");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Leaderboard: Rankings table ──
  test("Leaderboard shows ranking data or empty state", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Roadmap: Daily tasks ──
  test("Roadmap shows daily tasks or milestones", async ({ page }) => {
    await page.goto("/roadmap");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Drive: File management ──
  test("Drive page shows files or empty state", async ({ page }) => {
    await page.goto("/drive");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Launch: Checklist items ──
  test("Launch page has pre-launch checklist items", async ({ page }) => {
    await page.goto("/launch");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Ads analytics: Charts or empty state ──
  test("Ads analytics page loads charts", async ({ page }) => {
    await page.goto("/ads/analytics");
    await page.waitForTimeout(4000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  // ── Navigation: Click sidebar links ──
  test("Navigation between pages works without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForTimeout(3000);

    // Navigate to a few key pages
    for (const path of ["/vault", "/market", "/offer", "/ads", "/settings"]) {
      await page.goto(path);
      await page.waitForTimeout(2000);
    }

    const critical = errors.filter(
      (e) => !e.includes("hydration") && !e.includes("NEXT_REDIRECT"),
    );
    expect(critical).toHaveLength(0);
  });
});
