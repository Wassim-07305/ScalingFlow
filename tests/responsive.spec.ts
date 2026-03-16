import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  test("login page works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("login page works on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("welcome page works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/welcome");
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test("diagnostic page works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/diagnostic");
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test("no horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await page.waitForTimeout(2000);
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    // Allow a small margin (5px)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
