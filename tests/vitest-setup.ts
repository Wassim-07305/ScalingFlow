import dotenv from "dotenv";
import { vi, beforeEach } from "vitest";

// Load .env.local like the app does
dotenv.config({ path: ".env.local" });

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
