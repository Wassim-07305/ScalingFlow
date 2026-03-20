import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { buildProfile } from "../../../helpers/factories";

// Use vi.hoisted for variables referenced in vi.mock factories
const mockStripe = vi.hoisted(() => ({
  customers: { create: vi.fn(), retrieve: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  subscriptions: {
    retrieve: vi.fn().mockResolvedValue({
      id: "sub_mock123",
      items: { data: [{ price: { id: "price_xxx_pro_monthly" } }] },
    }),
  },
  billingPortal: { sessions: { create: vi.fn() } },
  webhooks: { constructEvent: vi.fn() },
}));

// Simple supabase mock for the webhook (uses admin client directly)
const supabaseMock = vi.hoisted(() => {
  const tables = new Map<string, { selectResult: any; insertResult: any; updateResult: any }>();
  function getTable(name: string) {
    if (!tables.has(name)) {
      tables.set(name, {
        selectResult: { data: null, error: null },
        insertResult: { data: null, error: null },
        updateResult: { data: null, error: null },
      });
    }
    return tables.get(name)!;
  }
  let lastTable = "";
  function makeChain(result: any): any {
    const chain: any = {};
    for (const m of ["select", "eq", "neq", "limit", "order", "filter", "not", "or", "match", "range", "contains"]) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain.single = vi.fn().mockResolvedValue(result);
    chain.maybeSingle = vi.fn().mockResolvedValue(result);
    chain.then = vi.fn().mockImplementation((res: any) => Promise.resolve(result).then(res));
    chain.insert = vi.fn().mockImplementation(() => makeChain(getTable(lastTable).insertResult));
    chain.update = vi.fn().mockImplementation(() => makeChain(getTable(lastTable).updateResult));
    return chain;
  }
  return {
    from: vi.fn().mockImplementation((table: string) => {
      lastTable = table;
      return makeChain(getTable(table).selectResult);
    }),
    mockTable(name: string) {
      const t = getTable(name);
      return {
        mockSelect(r: any) { t.selectResult = r; return this; },
        mockInsert(r: any) { t.insertResult = r; return this; },
        mockUpdate(r: any) { t.updateResult = r; return this; },
      };
    },
    resetTables() { tables.clear(); },
  };
});

const mockResend = vi.hoisted(() => ({
  emails: { send: vi.fn().mockResolvedValue({ id: "email_mock" }) },
}));

vi.mock("@/lib/stripe/client", () => ({ stripe: mockStripe }));
vi.mock("@/lib/resend/client", () => ({ resend: mockResend }));

vi.mock("@/lib/resend/templates", () => ({
  subscriptionActivatedEmail: vi.fn().mockReturnValue({ subject: "Bienvenue", html: "<p>Bienvenue</p>" }),
  subscriptionCanceledEmail: vi.fn().mockReturnValue({ subject: "Annulation", html: "<p>Annulation</p>" }),
  paymentFailedEmail: vi.fn().mockReturnValue({ subject: "Paiement échoué", html: "<p>Échoué</p>" }),
  affiliateCommissionEmail: vi.fn().mockReturnValue({ subject: "Commission", html: "<p>Commission</p>" }),
}));

vi.mock("@/lib/tracking/meta-capi", () => ({
  sendCAPIIfConfigured: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/attribution-engine", () => ({
  getJourney: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/affiliates/award-affiliate-xp", () => ({
  awardXPForUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue(supabaseMock),
}));

import { POST } from "@/app/api/stripe/webhook/route";

function makeWebhookRequest(body: string, signature?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (signature) headers["stripe-signature"] = signature;
  return new NextRequest("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.resetTables();

    // Set required env vars for webhook
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    supabaseMock.mockTable("profiles").mockSelect({
      data: [buildProfile()],
      error: null,
    });
    supabaseMock.mockTable("profiles").mockUpdate({ data: null, error: null });
    supabaseMock.mockTable("payment_attributions").mockInsert({ data: null, error: null });
  });

  it("returns 400 when stripe-signature is missing", async () => {
    const req = makeWebhookRequest("{}");
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Signature");
  });

  it("returns 400 when signature is invalid", async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = makeWebhookRequest('{"type":"test"}', "sig_invalid");
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("invalide");
  });

  it("handles checkout.session.completed", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test",
          customer: "cus_test",
          subscription: "sub_test",
          payment_intent: "pi_test",
          amount_total: 4900,
          currency: "eur",
          customer_email: "test@example.com",
          metadata: {
            supabase_user_id: "user-123",
            utm_source: "",
            utm_medium: "",
            utm_campaign: "",
            utm_content: "",
            utm_term: "",
            fbclid: "",
          },
        },
      },
    });

    const req = makeWebhookRequest("{}", "sig_valid");
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("handles customer.subscription.updated", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: { customer: "cus_test", status: "active" } },
    });

    const req = makeWebhookRequest("{}", "sig_valid");
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("handles customer.subscription.deleted", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_test" } },
    });

    const req = makeWebhookRequest("{}", "sig_valid");
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("handles invoice.payment_failed", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_test" } },
    });

    const req = makeWebhookRequest("{}", "sig_valid");
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("skips invoice.paid for subscription_create (first invoice)", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          customer: "cus_test",
          billing_reason: "subscription_create",
          amount_paid: 4900,
          currency: "eur",
          id: "inv_test",
        },
      },
    });

    const req = makeWebhookRequest("{}", "sig_valid");
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 200 for unknown event types", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "some.unknown.event",
      data: { object: {} },
    });

    const req = makeWebhookRequest("{}", "sig_valid");
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
