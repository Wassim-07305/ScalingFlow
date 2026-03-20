import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../../helpers/api-test-utils";
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  TEST_USER_ID,
} from "../../../helpers/auth";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/gamification/xp-engine", () => ({
  awardXP: vi.fn().mockResolvedValue({
    xp_awarded: 25,
    new_level: 1,
    new_badges: [],
  }),
}));

vi.mock("@/lib/utils/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 }),
}));

import { POST } from "@/app/api/gamification/award/route";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/gamification/xp-engine";

const createClientMock = createClient as ReturnType<typeof vi.fn>;

describe("POST /api/gamification/award", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { activityType: "community.post" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid activity type", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { activityType: "hacker.injection" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when activityType is missing", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("awards XP for valid community.post activity", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { activityType: "community.post" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.xp_awarded).toBe(25);
    expect(awardXP).toHaveBeenCalledWith(TEST_USER_ID, "community.post", undefined);
  });

  it("awards XP for community.comment", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { activityType: "community.comment" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("awards XP for task.completed", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { activityType: "task.completed" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 429 when rate limited", async () => {
    mockAuthenticatedUser(createClientMock);
    const { rateLimit } = await import("@/lib/utils/rate-limit");
    (rateLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const req = createMockRequest("POST", { activityType: "community.post" });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
