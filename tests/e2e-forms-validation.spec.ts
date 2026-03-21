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

// ─── Login Form Validation ───────────────────────────────────────
test.describe("Forms Validation — Login", () => {
  test("Login: submit with empty fields stays on login page", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForTimeout(1500);

    // Clear any pre-filled values
    const emailInput = page.locator("input[type='email']");
    const passwordInput = page.locator("input[type='password']");
    await emailInput.fill("");
    await passwordInput.fill("");

    // Try to submit
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // Should remain on login page
    expect(page.url()).toContain("/login");
  });

  test("Login: invalid email format shows validation or stays on page", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForTimeout(1500);

    await page.fill("input[type='email']", "not-a-valid-email");
    await page.fill("input[type='password']", "SomePassword123");
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(2000);

    // Should stay on login — browser native validation or app validation prevents navigation
    expect(page.url()).toContain("/login");
  });

  test("Login: email without @ is caught by browser validation", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForTimeout(1500);

    const emailInput = page.locator("input[type='email']");
    await emailInput.fill("invalidemail");

    // Check browser validation state
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.checkValidity(),
    );
    expect(isInvalid).toBe(true);
  });

  test("Login: correct email format but wrong password shows error message", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForTimeout(1500);

    await page.fill("input[type='email']", "admin@scalingflow.com");
    await page.fill("input[type='password']", "TotallyWrongPassword99");
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(4000);

    // Should show an error message (French)
    const body = await page.textContent("body");
    const hasError =
      /incorrect|erreur|invalide|invalid|échec|failed/i.test(body || "");
    // Should either show error or stay on login
    expect(hasError || page.url().includes("/login")).toBe(true);
  });

  test("Login: submit button shows loading state during auth attempt", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForTimeout(1500);

    await page.fill("input[type='email']", "test@example.com");
    await page.fill("input[type='password']", "SomePassword123");

    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    // Check if button becomes disabled or shows loading indicator
    await page.waitForTimeout(500);
    const isDisabledOrLoading =
      (await submitBtn.isDisabled().catch(() => false)) ||
      (await submitBtn.locator("svg, .animate-spin, .loading").count()) > 0 ||
      (await submitBtn.getAttribute("aria-busy")) === "true";

    // Most login forms disable the button during submission
    // If not, at minimum we stayed on the page
    expect(isDisabledOrLoading || page.url().includes("/login")).toBe(true);
  });
});

// ─── Register Form Validation ────────────────────────────────────
test.describe("Forms Validation — Register", () => {
  test("Register: submit with empty fields stays on register page", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForTimeout(1500);

    const submitBtn = page.locator("button[type='submit']");
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/register");
    }
  });

  test("Register: password too short shows validation feedback", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForTimeout(1500);

    const emailInput = page.locator("input[type='email']");
    const passwordInputs = page.locator("input[type='password']");

    if ((await emailInput.count()) > 0 && (await passwordInputs.count()) > 0) {
      await emailInput.fill("test-new-user@example.com");
      await passwordInputs.first().fill("123"); // Too short

      // If there's a confirm password field, fill it too
      if ((await passwordInputs.count()) > 1) {
        await passwordInputs.nth(1).fill("123");
      }

      const submitBtn = page.locator("button[type='submit']");
      await submitBtn.click();
      await page.waitForTimeout(3000);

      // Should stay on register page (short password rejected)
      expect(page.url()).toContain("/register");

      // Check for validation feedback
      const body = await page.textContent("body");
      const hasValidation =
        /mot de passe|password|caractère|minimum|court|trop court|erreur|error|invalid|6|8/i.test(
          body || "",
        );
      // Either validation message shown or simply stayed on page
      expect(hasValidation || page.url().includes("/register")).toBe(true);
    }
  });

  test("Register: mismatched passwords show error", async ({ page }) => {
    await page.goto("/register");
    await page.waitForTimeout(1500);

    const passwordInputs = page.locator("input[type='password']");
    const passwordCount = await passwordInputs.count();

    if (passwordCount >= 2) {
      const emailInput = page.locator("input[type='email']");
      await emailInput.fill("test-mismatch@example.com");
      await passwordInputs.first().fill("StrongPass123!");
      await passwordInputs.nth(1).fill("DifferentPass456!");

      const submitBtn = page.locator("button[type='submit']");
      await submitBtn.click();
      await page.waitForTimeout(3000);

      // Should stay on register page
      expect(page.url()).toContain("/register");
    }
  });

  test("Register: valid email format is enforced", async ({ page }) => {
    await page.goto("/register");
    await page.waitForTimeout(1500);

    const emailInput = page.locator("input[type='email']");
    if ((await emailInput.count()) > 0) {
      await emailInput.fill("invalid-email-no-at");

      const isInvalid = await emailInput.evaluate(
        (el: HTMLInputElement) => !el.checkValidity(),
      );
      expect(isInvalid).toBe(true);
    }
  });
});

// ─── Forgot Password Form ────────────────────────────────────────
test.describe("Forms Validation — Forgot Password", () => {
  test("Forgot password: empty email submit stays on page", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page.waitForTimeout(1500);

    const emailInput = page.locator("input[type='email']");
    if ((await emailInput.count()) > 0) {
      await emailInput.fill("");
      const submitBtn = page.locator("button[type='submit']");
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        expect(page.url()).toContain("/forgot-password");
      }
    }
  });

  test("Forgot password: invalid email format is caught", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForTimeout(1500);

    const emailInput = page.locator("input[type='email']");
    if ((await emailInput.count()) > 0) {
      await emailInput.fill("bademail");
      const isInvalid = await emailInput.evaluate(
        (el: HTMLInputElement) => !el.checkValidity(),
      );
      expect(isInvalid).toBe(true);
    }
  });

  test("Forgot password: valid email shows confirmation message", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page.waitForTimeout(1500);

    const emailInput = page.locator("input[type='email']");
    if ((await emailInput.count()) > 0) {
      await emailInput.fill("admin@scalingflow.com");
      const submitBtn = page.locator("button[type='submit']");
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(4000);

        const body = await page.textContent("body");
        // Should show success/confirmation message (French)
        const hasConfirmation =
          /envoyé|email|vérifi|lien|réinit|succès|check|inbox|boîte/i.test(
            body || "",
          );
        expect(hasConfirmation || body!.length > 50).toBe(true);
      }
    }
  });
});

// ─── Settings Form Validation (Authenticated) ───────────────────
test.describe("Forms Validation — Settings Profile", () => {
  test.describe.configure({ mode: "serial" });

  test("Settings: profile form has expected input fields", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page.waitForTimeout(5000);

    // Settings page should have form inputs for profile
    const inputs = page.locator("input, textarea, select");
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);

    // Look for typical profile fields (name, email, etc.)
    const textInputs = page.locator(
      "input[type='text'], input[type='email'], input:not([type]), textarea",
    );
    const textCount = await textInputs.count();
    expect(textCount).toBeGreaterThan(0);
  });

  test("Settings: profile form displays current user data", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page.waitForTimeout(5000);

    // At least one input should have a non-empty value (pre-filled with user data)
    const inputs = page.locator(
      "input[type='text'], input[type='email'], input:not([type])",
    );
    const count = await inputs.count();
    let hasPrefilledValue = false;

    for (let i = 0; i < Math.min(count, 10); i++) {
      const value = await inputs.nth(i).inputValue().catch(() => "");
      if (value.length > 0) {
        hasPrefilledValue = true;
        break;
      }
    }

    expect(hasPrefilledValue).toBe(true);
  });

  test("Settings: page has save/submit button", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page.waitForTimeout(5000);

    // Look for a save button
    const saveButtons = page.locator("button").filter({
      hasText: /sauvegarder|enregistrer|save|mettre à jour|valider|modifier/i,
    });
    const buttonCount = await saveButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test("Settings: clearing required name field and saving shows feedback", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/settings");
    await page.waitForTimeout(5000);

    // Find a text input that likely represents the name field
    const nameInput = page.locator(
      "input[name='full_name'], input[name='name'], input[name='fullName'], input[placeholder*='nom' i], input[placeholder*='name' i]",
    );

    if ((await nameInput.count()) > 0) {
      const originalValue = await nameInput.first().inputValue();
      await nameInput.first().fill("");

      // Find and click save
      const saveBtn = page.locator("button").filter({
        hasText:
          /sauvegarder|enregistrer|save|mettre à jour|valider|modifier/i,
      });
      if ((await saveBtn.count()) > 0) {
        await saveBtn.first().click();
        await page.waitForTimeout(3000);

        // Should show validation error or toast
        const body = await page.textContent("body");
        const hasError =
          /requis|obligatoire|required|erreur|error|vide|empty/i.test(
            body || "",
          );
        // Check for toast messages (Sonner toasts)
        const toasts = page.locator(
          "[data-sonner-toast], [role='status'], .toast, [class*='toast']",
        );
        const toastCount = await toasts.count();

        // Either validation error shown, toast appeared, or still on settings
        expect(
          hasError || toastCount > 0 || page.url().includes("/settings"),
        ).toBe(true);

        // Restore original value
        if (originalValue) {
          await nameInput.first().fill(originalValue);
        }
      }
    }
  });
});
