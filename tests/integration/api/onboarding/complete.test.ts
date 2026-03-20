import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../../helpers/api-test-utils";
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  TEST_USER_ID,
} from "../../../helpers/auth";

// Mock modules before importing the route
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/gamification/xp-engine", () => ({
  awardXP: vi.fn().mockResolvedValue({ xp_awarded: 150, new_level: 2, new_badges: [] }),
}));

import { POST } from "@/app/api/onboarding/complete/route";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/gamification/xp-engine";

const createClientMock = createClient as ReturnType<typeof vi.fn>;

describe("POST /api/onboarding/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { first_name: "Test" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("updates profile and returns 200 on success", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("profiles").mockUpdate({
      data: null,
      error: null,
    });

    const body = {
      first_name: "Lucas",
      situation: "freelance",
      situation_details: { revenue: "5k-10k" },
      expertise_answers: { marketing: 4 },
      parcours: "solo",
      target_revenue: 10000,
      industries: ["saas", "coaching"],
      objectives: ["scale", "automate"],
      budget_monthly: 500,
      selected_market: "coaching",
      market_viability_score: 85,
      niche: "coaching business",
    };

    const req = createMockRequest("POST", body);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("awards XP for onboarding completion", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("profiles").mockUpdate({
      data: null,
      error: null,
    });

    const req = createMockRequest("POST", { first_name: "Test" });
    await POST(req);

    expect(awardXP).toHaveBeenCalledWith(TEST_USER_ID, "onboarding.completed");
  });

  it("sets sf_onboarding cookie on response", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("profiles").mockUpdate({
      data: null,
      error: null,
    });

    const req = createMockRequest("POST", { first_name: "Test" });
    const res = await POST(req);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("sf_onboarding=1");
  });

  it("returns 500 when DB update fails", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("profiles").mockUpdate({
      data: null,
      error: { message: "DB error", code: "42000" },
    });

    const req = createMockRequest("POST", { first_name: "Test" });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
