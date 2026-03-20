/**
 * Tests that verify the ACTUAL DATA sent to Supabase by the onboarding route.
 * Unlike complete.test.ts which only checks HTTP status codes,
 * these tests use the spy mock to assert exact field values.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../../helpers/api-test-utils";
import { TEST_USER_ID, TEST_USER_EMAIL } from "../../../helpers/auth";
import { createSupabaseSpyMock } from "../../../helpers/supabase-spy-mock";

const spyMock = vi.hoisted(() => {
  // We need to create the mock in hoisted context
  const calls: any[] = [];
  const tableResults = new Map<string, any>();

  function getResult(table: string, method: string) {
    return tableResults.get(`${table}:${method}`) ?? { data: null, error: null };
  }

  function createChain(table: string, method: string, methodArgs: any[]): any {
    const currentCall = { table, method, args: methodArgs, filters: [] as any[] };
    calls.push(currentCall);
    const result = getResult(table, method);
    const chain: any = {};
    for (const f of ["eq", "neq", "order", "limit", "select", "filter", "not", "or", "match", "range"]) {
      chain[f] = vi.fn().mockImplementation((...args: any[]) => { currentCall.filters.push({ method: f, args }); return chain; });
    }
    chain.single = vi.fn().mockResolvedValue(result);
    chain.maybeSingle = vi.fn().mockResolvedValue(result);
    chain.then = vi.fn().mockImplementation((res: any) => Promise.resolve(result).then(res));
    chain.insert = vi.fn().mockImplementation((...args: any[]) => createChain(table, "insert", args));
    chain.update = vi.fn().mockImplementation((...args: any[]) => createChain(table, "update", args));
    chain.delete = vi.fn().mockImplementation((...args: any[]) => createChain(table, "delete", args));
    return chain;
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: "test-user-id-123", email: "test@example.com", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "" },
        },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      const chain: any = {};
      chain.select = vi.fn().mockImplementation((...args: any[]) => createChain(table, "select", args));
      chain.insert = vi.fn().mockImplementation((...args: any[]) => createChain(table, "insert", args));
      chain.update = vi.fn().mockImplementation((...args: any[]) => createChain(table, "update", args));
      chain.delete = vi.fn().mockImplementation((...args: any[]) => createChain(table, "delete", args));
      return chain;
    }),
    // Helpers for tests
    _calls: calls,
    _setResult(table: string, method: string, result: any) { tableResults.set(`${table}:${method}`, result); },
    _reset() { calls.length = 0; tableResults.clear(); },
    _getInserts(table: string) { return calls.filter((c: any) => c.table === table && c.method === "insert"); },
    _getUpdates(table: string) { return calls.filter((c: any) => c.table === table && c.method === "update"); },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(spyMock),
}));

vi.mock("@/lib/gamification/xp-engine", () => ({
  awardXP: vi.fn().mockResolvedValue({ xp_awarded: 150, new_level: 2, new_badges: [] }),
}));

import { POST } from "@/app/api/onboarding/complete/route";

describe("POST /api/onboarding/complete — DB Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spyMock._reset();
  });

  it("sends onboarding_completed: true to profiles table", async () => {
    const body = {
      first_name: "Lucas",
      situation: "freelance",
      target_revenue: 10000,
      industries: ["saas"],
      objectives: ["scale"],
      budget_monthly: 500,
      selected_market: "coaching",
      niche: "coaching business",
    };

    const req = createMockRequest("POST", body);
    await POST(req);

    const updates = spyMock._getUpdates("profiles");
    expect(updates.length).toBeGreaterThan(0);

    const updateData = updates[0].args[0] as Record<string, unknown>;

    // Verify critical fields are sent to DB
    expect(updateData.onboarding_completed).toBe(true);
    expect(updateData.first_name).toBe("Lucas");
    expect(updateData.situation).toBe("freelance");
    expect(updateData.target_revenue).toBe(10000);
    expect(updateData.industries).toEqual(["saas"]);
    expect(updateData.objectives).toEqual(["scale"]);
    expect(updateData.budget_monthly).toBe(500);
    expect(updateData.vault_completed).toBe(true);
    expect(updateData.selected_market).toBe("coaching");
    expect(updateData.niche).toBe("coaching business");
  });

  it("filters update by user ID", async () => {
    const req = createMockRequest("POST", { first_name: "Test" });
    await POST(req);

    const updates = spyMock._getUpdates("profiles");
    expect(updates.length).toBeGreaterThan(0);

    // Check that .eq("id", userId) was called
    const eqFilters = updates[0].filters.filter(
      (f: any) => f.method === "eq" && f.args[0] === "id",
    );
    expect(eqFilters.length).toBe(1);
    expect(eqFilters[0].args[1]).toBe("test-user-id-123");
  });

  it("handles missing optional fields with defaults", async () => {
    const req = createMockRequest("POST", {});
    await POST(req);

    const updates = spyMock._getUpdates("profiles");
    expect(updates.length).toBeGreaterThan(0);

    const updateData = updates[0].args[0] as Record<string, unknown>;

    // Optional fields should have defaults
    expect(updateData.onboarding_completed).toBe(true);
    expect(updateData.first_name).toBeNull();
    expect(updateData.situation).toBeNull();
    expect(updateData.target_revenue).toBe(0);
    expect(updateData.industries).toEqual([]);
    expect(updateData.objectives).toEqual([]);
    expect(updateData.budget_monthly).toBe(0);
  });
});
