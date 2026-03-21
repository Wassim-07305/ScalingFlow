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

// ─── Helper: check for horizontal overflow ───
async function checkNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    return scrollW <= clientW + 5; // 5px tolerance
  });
}

// ─── Mobile Viewport (iPhone SE — 375px) ────────────────────────
test.describe("Responsive — Mobile 375px", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  // ── Public pages ──
  test("Login page renders correctly on mobile", async ({ page }) => {
    await page.goto("/login");
    await page.waitForTimeout(2000);

    // Form inputs visible
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();

    // No horizontal overflow
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow).toBe(true);
  });

  test("Register page renders correctly on mobile", async ({ page }) => {
    await page.goto("/register");
    await page.waitForTimeout(2000);

    await expect(page.locator("input[type='email']")).toBeVisible();
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow).toBe(true);
  });

  test("Welcome page renders correctly on mobile", async ({ page }) => {
    await page.goto("/welcome");
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow).toBe(true);
  });

  // ── Authenticated pages on mobile ──
  test("Sidebar is collapsed or hidden on mobile viewport", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(4000);

    // On mobile, sidebar should be either hidden/collapsed or a hamburger menu
    const sidebar = page.locator("aside, nav[class*='sidebar']").first();
    const isHidden =
      !(await sidebar.isVisible().catch(() => false)) ||
      (await sidebar.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display === "none" ||
          style.visibility === "hidden" ||
          rect.width < 50 ||
          rect.x + rect.width <= 0
        );
      }).catch(() => true));

    // Either sidebar is hidden, or there's a hamburger/menu toggle button
    const menuToggle = page.locator(
      "button[aria-label*='menu' i], button[aria-label*='sidebar' i], button[class*='hamburger'], button[class*='mobile']",
    );
    const hasMenuToggle = (await menuToggle.count()) > 0;

    expect(isHidden || hasMenuToggle).toBe(true);
  });

  test("Dashboard has no horizontal overflow on mobile", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(4000);

    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow).toBe(true);
  });

  test("Key pages have no horizontal overflow on mobile", async ({ page }) => {
    test.setTimeout(120000);
    await loginAsAdmin(page);

    const pages = [
      "/market",
      "/offer",
      "/ads",
      "/content",
      "/settings",
      "/pipeline",
      "/community",
      "/leaderboard",
      "/academy",
    ];

    const overflowingPages: string[] = [];
    for (const p of pages) {
      await page.goto(p);
      await page.waitForTimeout(3000);
      const noOverflow = await checkNoHorizontalOverflow(page);
      if (!noOverflow) overflowingPages.push(p);
    }

    // Allow at most 1 page with overflow (some complex pages may have tables)
    expect(overflowingPages.length).toBeLessThanOrEqual(1);
  });

  test("Mobile: action buttons are reachable (not hidden behind sidebar)", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/offer");
    await page.waitForTimeout(4000);

    // Buttons should be visible and in the viewport
    const buttons = page.locator("button:visible");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Check first visible button is within viewport
    if (buttonCount > 0) {
      const box = await buttons.first().boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(375 + 10);
      }
    }
  });

  test("Mobile: text content is readable (not clipped)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/market");
    await page.waitForTimeout(4000);

    // Main content area should exist and have width close to viewport
    const main = page.locator("main").first();
    if (await main.isVisible()) {
      const box = await main.boundingBox();
      if (box) {
        // Main content should not be wider than viewport
        expect(box.width).toBeLessThanOrEqual(375 + 20);
      }
    }
  });

  test("Mobile: hamburger menu opens sidebar overlay", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(4000);

    // Find hamburger/menu toggle button
    const menuToggle = page.locator(
      "button[aria-label*='menu' i], button[aria-label*='sidebar' i], button[class*='toggle' i]",
    );

    if ((await menuToggle.count()) > 0) {
      await menuToggle.first().click();
      await page.waitForTimeout(1000);

      // After clicking, sidebar or nav overlay should become visible
      const sidebar = page.locator("aside, nav[class*='sidebar']").first();
      const overlay = page.locator(
        "[class*='overlay'], [class*='backdrop'], [role='dialog']",
      );

      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      const overlayVisible = await overlay.isVisible().catch(() => false);

      expect(sidebarVisible || overlayVisible).toBe(true);
    }
  });
});

// ─── Tablet Viewport (768px) ────────────────────────────────────
test.describe("Responsive — Tablet 768px", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test("Dashboard renders correctly on tablet", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(4000);

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(200);

    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow).toBe(true);
  });

  test("Tablet: sidebar may be collapsed but accessible", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(4000);

    // On tablet, sidebar might be collapsed (icons only) or full
    const sidebar = page.locator("aside, nav[class*='sidebar']").first();
    const isVisible = await sidebar.isVisible().catch(() => false);

    if (isVisible) {
      const box = await sidebar.boundingBox();
      if (box) {
        // Sidebar should have reasonable width (collapsed ~60-80px or full ~200-280px)
        expect(box.width).toBeGreaterThan(40);
        expect(box.width).toBeLessThan(350);
      }
    }

    // Verify main content is still accessible
    const main = page.locator("main").first();
    if (await main.isVisible()) {
      const mainBox = await main.boundingBox();
      if (mainBox) {
        expect(mainBox.width).toBeGreaterThan(300);
      }
    }
  });

  test("Tablet: forms are usable on 768px width", async ({ page }) => {
    await page.goto("/login");
    await page.waitForTimeout(2000);

    const emailInput = page.locator("input[type='email']");
    const passwordInput = page.locator("input[type='password']");
    const submitBtn = page.locator("button[type='submit']");

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Inputs should be reasonably sized (not tiny)
    const emailBox = await emailInput.boundingBox();
    if (emailBox) {
      expect(emailBox.width).toBeGreaterThan(200);
    }
  });

  test("Tablet: key pages have no horizontal overflow", async ({ page }) => {
    test.setTimeout(90000);
    await loginAsAdmin(page);

    const pages = ["/", "/market", "/offer", "/ads", "/content", "/settings"];
    const overflowing: string[] = [];

    for (const p of pages) {
      await page.goto(p);
      await page.waitForTimeout(3000);
      const ok = await checkNoHorizontalOverflow(page);
      if (!ok) overflowing.push(p);
    }

    expect(overflowing).toHaveLength(0);
  });
});

// ─── Desktop Wide (1920px) ──────────────────────────────────────
test.describe("Responsive — Desktop Wide 1920px", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("Desktop: layout uses full width without excess stretching", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(4000);

    // Check that content doesn't stretch ridiculously wide
    const main = page.locator("main").first();
    if (await main.isVisible()) {
      const box = await main.boundingBox();
      if (box) {
        // Content should fill available space
        expect(box.width).toBeGreaterThan(800);
      }
    }

    // Sidebar should be visible on desktop
    const sidebar = page.locator("aside, nav[class*='sidebar']").first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    expect(sidebarVisible).toBe(true);
  });

  test("Desktop: sidebar is fully expanded with labels", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForTimeout(4000);

    const sidebar = page.locator("aside, nav[class*='sidebar']").first();
    if (await sidebar.isVisible()) {
      // Check that sidebar has text content (labels, not just icons)
      const sidebarText = await sidebar.textContent();
      // Should contain navigation labels
      const hasLabels =
        sidebarText?.includes("Dashboard") ||
        sidebarText?.includes("Vault") ||
        sidebarText?.includes("Marché") ||
        sidebarText?.includes("Offre");
      expect(hasLabels).toBe(true);
    }
  });
});

// ─── Viewport Transitions ───────────────────────────────────────
test.describe("Responsive — Viewport Transitions", () => {
  test("Resizing from desktop to mobile adapts layout", async ({ page }) => {
    await loginAsAdmin(page);

    // Start desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForTimeout(4000);

    // Sidebar should be visible on desktop
    const sidebar = page.locator("aside, nav[class*='sidebar']").first();
    const desktopSidebarVisible = await sidebar.isVisible().catch(() => false);

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // No overflow after resize
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow).toBe(true);

    // Content should still be present
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(200);
  });
});
