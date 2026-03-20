import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../../helpers/api-test-utils";
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  TEST_USER_ID,
} from "../../../helpers/auth";
import { buildMarketAnalysis, buildProfile, buildOffer } from "../../../helpers/factories";

// Mock all external dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/ai/generate", () => ({
  generateJSON: vi.fn(),
}));

vi.mock("@/lib/ai/model-router", () => ({
  getModelForGeneration: vi.fn().mockReturnValue("sonnet"),
}));

vi.mock("@/lib/stripe/check-usage", () => ({
  checkAIUsage: vi.fn().mockResolvedValue({ allowed: true }),
  incrementAIUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/ai/prompts/offer-creation", () => ({
  offerCreationPrompt: vi.fn().mockReturnValue("Test prompt"),
}));

vi.mock("@/lib/ai/vault-context", () => ({
  buildFullVaultContext: vi.fn().mockResolvedValue(""),
}));

vi.mock("@/lib/gamification/xp-engine", () => ({
  awardXP: vi.fn().mockResolvedValue({ xp_awarded: 100, new_level: 1, new_badges: [] }),
}));

vi.mock("@/lib/notifications/create", () => ({
  notifyGeneration: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/utils/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 }),
}));

import { POST } from "@/app/api/ai/generate-offer/route";
import { createClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/generate";
import { awardXP } from "@/lib/gamification/xp-engine";

const createClientMock = createClient as ReturnType<typeof vi.fn>;
const generateJSONMock = generateJSON as ReturnType<typeof vi.fn>;

describe("POST /api/ai/generate-offer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { marketAnalysisId: "test" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when marketAnalysisId is missing", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);

    const req = createMockRequest("POST", {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("marketAnalysisId");
  });

  it("returns 404 when market analysis not found", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("market_analyses").mockSelect({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });

    const req = createMockRequest("POST", { marketAnalysisId: "nonexistent" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("generates and saves offer on happy path", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);

    // Mock market analysis fetch
    supabaseMock.mockTable("market_analyses").mockSelect({
      data: buildMarketAnalysis(),
      error: null,
    });

    // Mock profile fetch
    supabaseMock.mockTable("profiles").mockSelect({
      data: buildProfile(),
      error: null,
    });

    // Mock offer insert
    const savedOffer = buildOffer();
    supabaseMock.mockTable("offers").mockInsert({
      data: savedOffer,
      error: null,
    });

    // Mock AI response
    generateJSONMock.mockResolvedValue({
      packaging: {
        offer_name: "Programme Scale",
        positioning: "Le #1",
        unique_mechanism: { name: "Scale Engine" },
        pricing: { price: 997 },
        guarantees: [{ type: "money-back" }],
        no_brainer: "Bonus",
        risk_reversal: "Remboursé",
        oto: { name: "VIP" },
      },
      delivery: { modules: 6 },
      full_document_markdown: "# Offre",
    });

    const req = createMockRequest("POST", { marketAnalysisId: "ma-test-123" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("awards XP after successful generation", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("market_analyses").mockSelect({
      data: buildMarketAnalysis(),
      error: null,
    });
    supabaseMock.mockTable("profiles").mockSelect({
      data: buildProfile(),
      error: null,
    });
    supabaseMock.mockTable("offers").mockInsert({
      data: buildOffer(),
      error: null,
    });
    generateJSONMock.mockResolvedValue({ packaging: { offer_name: "Test" } });

    const req = createMockRequest("POST", { marketAnalysisId: "ma-test-123" });
    await POST(req);

    expect(awardXP).toHaveBeenCalledWith(TEST_USER_ID, "generation.offer");
  });

  it("returns 429 when rate limited", async () => {
    mockAuthenticatedUser(createClientMock);

    const { rateLimit } = await import("@/lib/utils/rate-limit");
    (rateLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const req = createMockRequest("POST", { marketAnalysisId: "test" });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("returns 403 when AI usage limit reached", async () => {
    mockAuthenticatedUser(createClientMock);

    const { checkAIUsage } = await import("@/lib/stripe/check-usage");
    (checkAIUsage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      allowed: false,
      currentUsage: 5,
      limit: 5,
    });

    const req = createMockRequest("POST", { marketAnalysisId: "test" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
