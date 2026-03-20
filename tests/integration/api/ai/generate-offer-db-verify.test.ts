/**
 * Tests that verify the ACTUAL DATA sent to Supabase by generate-offer.
 * Verifies: user_id is set, market_analysis_id is passed, offer fields are saved.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../../helpers/api-test-utils";
import { buildMarketAnalysis, buildProfile } from "../../../helpers/factories";

// Spy mock that records all DB calls
const spyMock = vi.hoisted(() => {
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
    for (const f of ["eq", "neq", "order", "limit", "select", "filter", "not", "or"]) {
      chain[f] = vi.fn().mockImplementation((...args: any[]) => { currentCall.filters.push({ method: f, args }); return chain; });
    }
    chain.single = vi.fn().mockResolvedValue(result);
    chain.maybeSingle = vi.fn().mockResolvedValue(result);
    chain.then = vi.fn().mockImplementation((res: any) => Promise.resolve(result).then(res));
    chain.insert = vi.fn().mockImplementation((...args: any[]) => createChain(table, "insert", args));
    chain.update = vi.fn().mockImplementation((...args: any[]) => createChain(table, "update", args));
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
      return chain;
    }),
    _calls: calls,
    _setResult(table: string, method: string, result: any) { tableResults.set(`${table}:${method}`, result); },
    _reset() { calls.length = 0; tableResults.clear(); },
    _getInserts(table: string) { return calls.filter((c: any) => c.table === table && c.method === "insert"); },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(spyMock),
}));

vi.mock("@/lib/ai/generate", () => ({
  generateJSON: vi.fn().mockResolvedValue({
    data: {
      packaging: {
        offer_name: "Programme Scale Engine",
        positioning: "Le #1 pour scaler",
        unique_mechanism: { name: "Scale Engine Method" },
        pricing: { price: 997, currency: "EUR" },
        guarantees: [{ type: "money-back", duration: "30 jours" }],
        no_brainer: "Bonus coaching",
        risk_reversal: "Remboursement intégral",
        oto: { name: "VIP", price: 497 },
      },
      delivery: { modules: 6, format: "online" },
      full_document_markdown: "# Mon Offre",
    },
    usage: { inputTokens: 500, outputTokens: 1000, cachedTokens: 0 },
  }),
}));

vi.mock("@/lib/stripe/check-usage", () => ({
  checkAIUsage: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock("@/lib/ai/prompts/offer-creation", () => ({
  offerCreationPrompt: vi.fn().mockReturnValue("test prompt"),
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

describe("POST /api/ai/generate-offer — DB Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spyMock._reset();

    // Configure mock returns
    spyMock._setResult("market_analyses", "select", {
      data: buildMarketAnalysis(),
      error: null,
    });
    spyMock._setResult("profiles", "select", {
      data: buildProfile(),
      error: null,
    });
    spyMock._setResult("offers", "insert", {
      data: { id: "offer-new", offer_name: "Programme Scale Engine" },
      error: null,
    });
  });

  it("inserts offer with user_id into offers table", async () => {
    const req = createMockRequest("POST", { marketAnalysisId: "ma-test-123" });
    await POST(req);

    const inserts = spyMock._getInserts("offers");
    expect(inserts.length).toBe(1);

    const insertData = inserts[0].args[0] as Record<string, unknown>;
    expect(insertData.user_id).toBe("test-user-id-123");
  });

  it("inserts offer with correct market_analysis_id", async () => {
    const req = createMockRequest("POST", { marketAnalysisId: "ma-test-123" });
    await POST(req);

    const inserts = spyMock._getInserts("offers");
    const insertData = inserts[0].args[0] as Record<string, unknown>;
    expect(insertData.market_analysis_id).toBe("ma-test-123");
  });

  it("saves AI-generated offer_name to DB", async () => {
    const req = createMockRequest("POST", { marketAnalysisId: "ma-test-123" });
    await POST(req);

    const inserts = spyMock._getInserts("offers");
    const insertData = inserts[0].args[0] as Record<string, unknown>;
    expect(insertData.offer_name).toBe("Programme Scale Engine");
  });

  it("saves all offer fields from AI response", async () => {
    const req = createMockRequest("POST", { marketAnalysisId: "ma-test-123" });
    await POST(req);

    const inserts = spyMock._getInserts("offers");
    const insertData = inserts[0].args[0] as Record<string, unknown>;

    // Verify ALL fields are persisted
    expect(insertData.positioning).toBe("Le #1 pour scaler");
    expect(insertData.unique_mechanism).toBe("Scale Engine Method");
    expect(insertData.pricing_strategy).toEqual({ price: 997, currency: "EUR" });
    expect(insertData.guarantees).toEqual([{ type: "money-back", duration: "30 jours" }]);
    expect(insertData.no_brainer_element).toBe("Bonus coaching");
    expect(insertData.risk_reversal).toBe("Remboursement intégral");
    expect(insertData.delivery_structure).toEqual({ modules: 6, format: "online" });
    expect(insertData.oto_offer).toEqual({ name: "VIP", price: 497 });
    expect(insertData.full_document).toBe("# Mon Offre");
    expect(insertData.status).toBe("draft");
  });

  it("stores raw AI response for debugging", async () => {
    const req = createMockRequest("POST", { marketAnalysisId: "ma-test-123" });
    await POST(req);

    const inserts = spyMock._getInserts("offers");
    const insertData = inserts[0].args[0] as Record<string, unknown>;
    expect(insertData.ai_raw_response).toBeDefined();
    expect((insertData.ai_raw_response as any).packaging.offer_name).toBe("Programme Scale Engine");
  });

  it("filters market_analyses query by user_id", async () => {
    const req = createMockRequest("POST", { marketAnalysisId: "ma-test-123" });
    await POST(req);

    const selects = spyMock._calls.filter(
      (c: any) => c.table === "market_analyses" && c.method === "select",
    );
    expect(selects.length).toBeGreaterThan(0);

    // Should filter by both id AND user_id for security
    const eqFilters = selects[0].filters.filter((f: any) => f.method === "eq");
    const filterKeys = eqFilters.map((f: any) => f.args[0]);
    expect(filterKeys).toContain("id");
    expect(filterKeys).toContain("user_id");
  });
});
