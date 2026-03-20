import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockRequest } from "../../../helpers/api-test-utils";
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  TEST_USER_ID,
} from "../../../helpers/auth";
import { buildProfile, buildAffiliate } from "../../../helpers/factories";
import { createSupabaseMock } from "../../../helpers/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Admin client mock (used for affiliate operations)
const adminMock = vi.hoisted(() => {
  const tables = new Map<string, { selectResult: any; insertResult: any }>();
  function getTable(name: string) {
    if (!tables.has(name)) {
      tables.set(name, { selectResult: { data: null, error: null }, insertResult: { data: null, error: null } });
    }
    return tables.get(name)!;
  }
  let lastTable = "";
  function chain(result: any): any {
    const c: any = {};
    for (const m of ["select", "eq", "neq", "limit", "order", "filter", "not", "or"]) {
      c[m] = vi.fn().mockReturnValue(c);
    }
    c.single = vi.fn().mockResolvedValue(result);
    c.maybeSingle = vi.fn().mockResolvedValue(result);
    c.then = vi.fn().mockImplementation((res: any) => Promise.resolve(result).then(res));
    c.insert = vi.fn().mockImplementation(() => chain(getTable(lastTable).insertResult));
    return c;
  }
  return {
    from: vi.fn().mockImplementation((table: string) => {
      lastTable = table;
      return chain(getTable(table).selectResult);
    }),
    mockTable(name: string) {
      const t = getTable(name);
      return {
        mockSelect(r: any) { t.selectResult = r; return this; },
        mockInsert(r: any) { t.insertResult = r; return this; },
      };
    },
    resetTables() { tables.clear(); },
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue(adminMock),
}));

import { POST, GET } from "@/app/api/affiliates/register/route";
import { createClient } from "@/lib/supabase/server";

const createClientMock = createClient as ReturnType<typeof vi.fn>;

describe("POST /api/affiliates/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminMock.resetTables();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const req = createMockRequest("POST", {});
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 for free plan users", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("profiles").mockSelect({
      data: buildProfile({ subscription_plan: "free", subscription_status: "active", role: "user" }),
      error: null,
    });

    const req = createMockRequest("POST", {});
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns existing affiliate if already registered", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("profiles").mockSelect({
      data: buildProfile({ subscription_plan: "pro" }),
      error: null,
    });

    adminMock.mockTable("affiliate_programs").mockSelect({
      data: { id: "program-1" },
      error: null,
    });
    adminMock.mockTable("affiliates").mockSelect({
      data: buildAffiliate(),
      error: null,
    });

    const req = createMockRequest("POST", {});
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("Déjà inscrit");
  });
});

describe("GET /api/affiliates/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns affiliate data for authenticated user", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock.mockTable("affiliates").mockSelect({
      data: buildAffiliate(),
      error: null,
    });

    const res = await GET();
    expect(res.status).toBe(200);
  });
});
