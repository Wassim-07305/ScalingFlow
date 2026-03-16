import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/ScalingFlow/);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /connexion|se connecter|login/i }),
    ).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("forgot password page renders correctly", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("login with empty fields shows validation", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.getByRole("button", {
      name: /connexion|se connecter|login/i,
    });
    await submitBtn.click();
    // Should not navigate away — still on login
    await expect(page).toHaveURL(/login/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "fake@test.com");
    await page.fill("input[type='password']", "wrongpassword");
    const submitBtn = page.getByRole("button", {
      name: /connexion|se connecter|login/i,
    });
    await submitBtn.click();
    await page.waitForTimeout(3000);
    // Should show error or stay on login
    const url = page.url();
    expect(url).toContain("login");
  });

  test("login page has link to register", async ({ page }) => {
    await page.goto("/login");
    const registerLink = page.getByRole("link", {
      name: /créer|inscription|register|s'inscrire/i,
    });
    await expect(registerLink).toBeVisible();
  });

  test("login page has link to forgot password", async ({ page }) => {
    await page.goto("/login");
    const forgotLink = page.getByRole("link", {
      name: /oublié|forgot|mot de passe/i,
    });
    await expect(forgotLink).toBeVisible();
  });
});
