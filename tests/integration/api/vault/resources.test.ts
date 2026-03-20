import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockRequest } from "../../../helpers/api-test-utils";
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
} from "../../../helpers/auth";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { GET, POST, DELETE } from "@/app/api/vault/resources/route";
import { createClient } from "@/lib/supabase/server";

const createClientMock = createClient as ReturnType<typeof vi.fn>;

describe("GET /api/vault/resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns resources list for authenticated user", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("vault_resources").mockSelect({
      data: [
        { id: "r1", resource_type: "youtube", url: "https://youtube.com/test", title: "Test", extracted_text: "some text" },
        { id: "r2", resource_type: "pdf", url: null, title: "Document", extracted_text: null },
      ],
      error: null,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.resources).toHaveLength(2);
  });
});

describe("POST /api/vault/resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { url: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when both title and url are missing", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("POST", {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates resource with URL", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("vault_resources").mockInsert({
      data: { id: "new-r", resource_type: "link", url: "https://example.com", title: "Example" },
      error: null,
    });

    const req = createMockRequest("POST", { url: "https://example.com", title: "Example" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/vault/resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const req = createMockRequest("DELETE", { id: "r1" });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    mockAuthenticatedUser(createClientMock);
    const req = createMockRequest("DELETE", {});
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});
