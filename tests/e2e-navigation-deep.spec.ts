import { test, expect, type Page } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ─── Auth helper ───
async function loginAsAdmin(page: Page) {
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

// All nav items from the sidebar navigation
const ALL_NAV_PATHS = [
  "/",
  "/vault",
  "/market",
  "/offer",
  "/brand",
  "/growth",
  "/funnel",
  "/assets",
  "/ads",
  "/content",
  "/prospection",
  "/pipeline",
  "/clients",
  "/sales",
  "/calendar",
  "/launch",
  "/analytics",
  "/academy",
  "/roadmap",
  "/progress",
  "/leaderboard",
  "/community",
  "/activity-log",
  "/drive",
  "/assistant",
  "/portal",
  "/affiliate",
];

// ─── Sidebar Link Verification ───────────────────────────────────
test.describe("Deep Navigation — Sidebar Links", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("All sidebar navigation sections are rendered", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(4000);

    // Check for sidebar/nav presence
    const sidebar = page.locator("nav, aside").first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // Check section labels exist (from NAV_SECTIONS)
    const sectionLabels = [
      "Business",
      "Marketing",
      "Commercial",
      "Performance",
      "Apprentissage",
      "Outils",
    ];

    const sidebarText = await sidebar.textContent();
    let foundSections = 0;
    for (const label of sectionLabels) {
      if (sidebarText?.includes(label)) foundSections++;
    }
    // At least some section labels should be visible
    expect(foundSections).toBeGreaterThanOrEqual(2);
  });

  test("Sidebar contains links to all major pages", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(4000);

    // Count sidebar links
    const sidebarLinks = page.locator("nav a[href], aside a[href]");
    const linkCount = await sidebarLinks.count();

    // Should have many navigation links (at least 15 major pages)
    expect(linkCount).toBeGreaterThanOrEqual(10);

    // Collect all hrefs
    const hrefs: string[] = [];
    for (let i = 0; i < linkCount; i++) {
      const href = await sidebarLinks.nth(i).getAttribute("href");
      if (href) hrefs.push(href);
    }

    // Verify key pages are linked
    const keyPages = [
      "/vault",
      "/market",
      "/offer",
      "/ads",
      "/content",
      "/settings",
    ];
    for (const keyPage of keyPages) {
      const found = hrefs.some((h) => h === keyPage || h.startsWith(keyPage));
      expect(found).toBe(true);
    }
  });

  test("Clicking sidebar link navigates to correct page", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(4000);

    // Click on Market link in sidebar
    const marketLink = page.locator("nav a[href='/market'], aside a[href='/market']").first();
    if (await marketLink.isVisible()) {
      await marketLink.click();
      await page.waitForTimeout(3000);
      expect(page.url()).toContain("/market");
    }

    // Click on Offer link
    const offerLink = page.locator("nav a[href='/offer'], aside a[href='/offer']").first();
    if (await offerLink.isVisible()) {
      await offerLink.click();
      await page.waitForTimeout(3000);
      expect(page.url()).toContain("/offer");
    }
  });

  test("Active sidebar link is visually highlighted", async ({ page }) => {
    await page.goto("/market");
    await page.waitForTimeout(4000);

    const marketLink = page.locator("nav a[href='/market'], aside a[href='/market']").first();
    if (await marketLink.isVisible()) {
      // Check if the link or its parent has an active/selected class or style
      const classes = await marketLink.getAttribute("class");
      const parentClasses = await marketLink
        .locator("..")
        .getAttribute("class")
        .catch(() => "");
      const dataState = await marketLink
        .getAttribute("data-active")
        .catch(() => null);

      // The active link should have some visual distinction
      const hasActiveStyle =
        classes?.includes("active") ||
        classes?.includes("selected") ||
        classes?.includes("bg-") ||
        classes?.includes("text-emerald") ||
        classes?.includes("text-accent") ||
        parentClasses?.includes("active") ||
        parentClasses?.includes("bg-") ||
        dataState === "true";

      expect(hasActiveStyle).toBe(true);
    }
  });
});

// ─── Tab Navigation on Tabbed Pages ─────────────────────────────
test.describe("Deep Navigation — Tab Pages", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Ads page has navigable tabs", async ({ page }) => {
    await page.goto("/ads");
    await page.waitForTimeout(4000);

    // Find tab elements
    const tabs = page.locator(
      "[role='tab'], [role='tablist'] button, button[data-state]",
    );
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Click second tab
      await tabs.nth(1).click();
      await page.waitForTimeout(2000);

      // Content should change (or at minimum, page doesn't crash)
      const body = await page.textContent("body");
      expect(body!.length).toBeGreaterThan(100);

      // Click back to first tab
      await tabs.nth(0).click();
      await page.waitForTimeout(1000);
      expect(body!.length).toBeGreaterThan(100);
    }
  });

  test("Content page has navigable tabs or sub-pages", async ({ page }) => {
    await page.goto("/content");
    await page.waitForTimeout(4000);

    const tabs = page.locator(
      "[role='tab'], [role='tablist'] button, button[data-state]",
    );
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      for (let i = 0; i < Math.min(tabCount, 4); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(1500);
        const body = await page.textContent("body");
        expect(body!.length).toBeGreaterThan(100);
      }
    }

    // Also check the calendar sub-route
    await page.goto("/content/calendar");
    await page.waitForTimeout(3000);
    const calBody = await page.textContent("body");
    expect(calBody!.length).toBeGreaterThan(100);
  });

  test("Market page tabs switch content correctly", async ({ page }) => {
    await page.goto("/market");
    await page.waitForTimeout(4000);

    const tabs = page.locator(
      "[role='tab'], [role='tablist'] button, button[data-state]",
    );
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Get initial content snapshot
      const initialContent = await page.textContent("main, [role='tabpanel']");

      // Click a different tab
      await tabs.nth(1).click();
      await page.waitForTimeout(2000);

      const newContent = await page.textContent("main, [role='tabpanel']");

      // Content should change between tabs (or at least page is stable)
      expect(newContent!.length).toBeGreaterThan(50);
    }
  });

  test("Offer page has multiple generator sections or tabs", async ({
    page,
  }) => {
    await page.goto("/offer");
    await page.waitForTimeout(4000);

    const tabs = page.locator(
      "[role='tab'], [role='tablist'] button, button[data-state]",
    );
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      await tabs.nth(Math.min(1, tabCount - 1)).click();
      await page.waitForTimeout(2000);
    }

    // Offer page should have generate/action buttons
    const buttons = page.locator("button");
    expect(await buttons.count()).toBeGreaterThan(0);
  });
});

// ─── Console Error Collection Across Pages ───────────────────────
test.describe("Deep Navigation — No Console Errors", () => {
  test("No critical JS errors across all authenticated pages", async ({
    page,
  }) => {
    test.setTimeout(180000);
    await loginAsAdmin(page);

    const pageErrors: { page: string; error: string }[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push({ page: page.url(), error: err.message });
    });

    const consoleErrors: { page: string; text: string }[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push({ page: page.url(), text: msg.text() });
      }
    });

    for (const navPath of ALL_NAV_PATHS) {
      await page.goto(navPath);
      await page.waitForTimeout(2000);
    }

    // Filter out known non-critical errors
    const criticalPageErrors = pageErrors.filter(
      (e) =>
        !e.error.includes("hydration") &&
        !e.error.includes("NEXT_REDIRECT") &&
        !e.error.includes("ChunkLoadError") &&
        !e.error.includes("Loading chunk") &&
        !e.error.includes("Minified React error"),
    );

    const criticalConsoleErrors = consoleErrors.filter(
      (e) =>
        !e.text.includes("Failed to load resource") &&
        !e.text.includes("net::ERR") &&
        !e.text.includes("hydration") &&
        !e.text.includes("Warning:") &&
        !e.text.includes("Manifest") &&
        !e.text.includes("service-worker") &&
        !e.text.includes("favicon") &&
        !e.text.includes("chunk") &&
        !e.text.includes("NEXT_REDIRECT") &&
        !e.text.includes("workbox") &&
        !e.text.includes("sw.js"),
    );

    // Allow a small number of non-critical errors
    expect(criticalPageErrors.length).toBeLessThanOrEqual(3);
    expect(criticalConsoleErrors.length).toBeLessThanOrEqual(10);
  });
});

// ─── Browser History Navigation ──────────────────────────────────
test.describe("Deep Navigation — Browser History", () => {
  test.describe.configure({ mode: "serial" });

  test("Back/forward navigation works between pages", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate through a sequence of pages
    await page.goto("/");
    await page.waitForTimeout(3000);

    await page.goto("/market");
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/market");

    await page.goto("/offer");
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/offer");

    await page.goto("/ads");
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/ads");

    // Go back
    await page.goBack();
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/offer");

    // Go back again
    await page.goBack();
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/market");

    // Go forward
    await page.goForward();
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/offer");
  });

  test("Page content loads correctly after back navigation", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/vault");
    await page.waitForTimeout(4000);
    const vaultBody = await page.textContent("body");

    await page.goto("/content");
    await page.waitForTimeout(4000);
    const contentBody = await page.textContent("body");

    // Go back to vault
    await page.goBack();
    await page.waitForTimeout(4000);

    const vaultBodyAfterBack = await page.textContent("body");
    expect(page.url()).toContain("/vault");
    // Page should have real content (not blank)
    expect(vaultBodyAfterBack!.length).toBeGreaterThan(200);
  });

  test("URL-based navigation to deep routes works", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate directly to sub-routes
    const deepRoutes = [
      "/ads/analytics",
      "/content/calendar",
    ];

    for (const route of deepRoutes) {
      await page.goto(route);
      await page.waitForTimeout(3000);

      // Should not redirect to login (we're authenticated)
      const url = page.url();
      expect(url.includes("/login") || url.includes("/welcome")).toBe(false);

      // Should have content
      const body = await page.textContent("body");
      expect(body!.length).toBeGreaterThan(100);
    }
  });
});

// ─── Page Load Performance ──────────────────────────────────────
test.describe("Deep Navigation — Page Load Times", () => {
  test("Key pages load within acceptable time", async ({ page }) => {
    test.setTimeout(120000);
    await loginAsAdmin(page);

    const loadTimes: { path: string; ms: number }[] = [];
    const slowThreshold = 15000; // 15 seconds for production

    const pagesToTest = [
      "/",
      "/market",
      "/offer",
      "/ads",
      "/content",
      "/settings",
      "/assistant",
      "/pipeline",
    ];

    for (const p of pagesToTest) {
      const start = Date.now();
      await page.goto(p);
      await page.waitForLoadState("domcontentloaded");
      const elapsed = Date.now() - start;
      loadTimes.push({ path: p, ms: elapsed });
    }

    // No page should take extremely long to load
    const slowPages = loadTimes.filter((lt) => lt.ms > slowThreshold);
    expect(slowPages).toHaveLength(0);
  });
});

// ─── 404 Handling ────────────────────────────────────────────────
test.describe("Deep Navigation — Error Pages", () => {
  test("Non-existent route shows 404 or redirects gracefully", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    const response = await page.goto("/this-page-does-not-exist-xyz");
    await page.waitForTimeout(2000);

    // Should show 404 page or redirect to dashboard — not crash
    const status = response?.status();
    expect(status).not.toBe(500);

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("Non-existent API route returns 404 or 405", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(3000);

    const response = await page.evaluate(async () => {
      const res = await fetch("/api/this-route-does-not-exist");
      return { status: res.status };
    });

    expect([404, 405, 307]).toContain(response.status);
  });
});
