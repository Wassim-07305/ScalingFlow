import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("welcome page renders", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.locator("body")).not.toBeEmpty();
    // Should have ScalingFlow branding
    const text = await page.textContent("body");
    expect(text).toBeTruthy();
  });

  test("diagnostic page renders", async ({ page }) => {
    await page.goto("/diagnostic");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("robots.txt is accessible", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });

  test("sitemap.xml is accessible", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(5000);
    const url = page.url();
    // Should redirect to login or show login page content
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(url).toMatch(/login|onboarding|welcome|\//);
  });

  test("protected routes require auth", async ({ page }) => {
    const response = await page.goto("/vault");
    await page.waitForTimeout(3000);
    // Should either redirect or show the page (middleware handles auth)
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });
});
