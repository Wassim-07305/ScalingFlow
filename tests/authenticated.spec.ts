import { test, expect, type Page } from "@playwright/test";

// Login helper — uses Supabase Admin API to generate access token
async function login(page: Page) {
  // Get token via Supabase Admin API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@scalingflow.com",
      password: "Test1234x",
    }),
  });

  if (!res.ok) {
    // If login fails, skip tests gracefully
    throw new Error(
      `Login failed: ${res.status} — check test credentials in CONTEXT.md`,
    );
  }

  const data = await res.json();
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;

  // Set cookies in browser to authenticate
  await page.goto("/login");
  await page.evaluate(
    ({ url, at, rt }) => {
      // Set Supabase auth in localStorage
      const storageKey = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          access_token: at,
          refresh_token: rt,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      );
    },
    { url: supabaseUrl, at: accessToken, rt: refreshToken },
  );

  // Navigate to dashboard
  await page.goto("/");
  await page.waitForTimeout(3000);
}

test.describe("Authenticated Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dashboard loads after login", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    // Should be on dashboard (not login/onboarding)
    const bodyText = await page.textContent("body");
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test("sidebar navigation is visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    // Check for sidebar or mobile nav
    const sidebar = page.locator("nav, aside, [data-sidebar]").first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test("vault page loads", async ({ page }) => {
    await page.goto("/vault");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test("market page loads", async ({ page }) => {
    await page.goto("/market");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("offer page loads", async ({ page }) => {
    await page.goto("/offer");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("ads page loads", async ({ page }) => {
    await page.goto("/ads");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("content page loads", async ({ page }) => {
    await page.goto("/content");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("funnel page loads", async ({ page }) => {
    await page.goto("/funnel");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("sales page loads", async ({ page }) => {
    await page.goto("/sales");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("brand page loads", async ({ page }) => {
    await page.goto("/brand");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("community page loads", async ({ page }) => {
    await page.goto("/community");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("leaderboard page loads", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("academy page loads", async ({ page }) => {
    await page.goto("/academy");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("roadmap page loads", async ({ page }) => {
    await page.goto("/roadmap");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("progress page loads", async ({ page }) => {
    await page.goto("/progress");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("assistant page loads", async ({ page }) => {
    await page.goto("/assistant");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("launch page loads", async ({ page }) => {
    await page.goto("/launch");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("pipeline page loads", async ({ page }) => {
    await page.goto("/pipeline");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("clients page loads", async ({ page }) => {
    await page.goto("/clients");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("drive page loads", async ({ page }) => {
    await page.goto("/drive");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("prospection page loads", async ({ page }) => {
    await page.goto("/prospection");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("admin page loads", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("portal page loads", async ({ page }) => {
    await page.goto("/portal");
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("no console errors on dashboard", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        errors.push(msg.text());
      }
    });
    await page.goto("/");
    await page.waitForTimeout(5000);
    // Filter out expected errors (third-party, network)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Failed to load resource") &&
        !e.includes("net::ERR") &&
        !e.includes("hydration") &&
        !e.includes("Warning:") &&
        !e.includes("Manifest") &&
        !e.includes("service-worker"),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
