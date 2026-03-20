import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../../helpers/api-test-utils";
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
} from "../../../helpers/auth";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/tracking/meta-capi", () => ({
  sendCAPIIfConfigured: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/gamification/xp-engine", () => ({
  awardXP: vi.fn().mockResolvedValue({ xp_awarded: 0, new_level: 1, new_badges: [] }),
}));

import { POST } from "@/app/api/pipeline/update-status/route";
import { createClient } from "@/lib/supabase/server";

const createClientMock = createClient as ReturnType<typeof vi.fn>;

describe("POST /api/pipeline/update-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { leadId: "l1", newStatus: "engage" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when leadId is missing", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { newStatus: "engage" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when newStatus is missing", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { leadId: "l1" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { leadId: "l1", newStatus: "invalid_status" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when lead not found", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("pipeline_leads").mockSelect({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });

    const req = createMockRequest("POST", { leadId: "nonexistent", newStatus: "engage" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("updates status successfully", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("pipeline_leads").mockSelect({
      data: { id: "l1", user_id: "test-user-id-123", name: "Lead Test" },
      error: null,
    });
    supabaseMock.mockTable("pipeline_leads").mockUpdate({ data: null, error: null });
    supabaseMock.mockTable("pipeline_activities").mockInsert({ data: null, error: null });

    const req = createMockRequest("POST", {
      leadId: "l1",
      newStatus: "engage",
      oldStatus: "nouveau",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
