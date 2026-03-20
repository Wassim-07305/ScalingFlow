import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../../helpers/api-test-utils";
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
} from "../../../helpers/auth";
import { buildProfile } from "../../../helpers/factories";

// Use vi.hoisted so the mock is available when vi.mock factory runs
const mockStripe = vi.hoisted(() => ({
  customers: {
    create: vi.fn().mockResolvedValue({ id: "cus_new123" }),
    retrieve: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        id: "cs_test123",
        url: "https://checkout.stripe.com/test",
      }),
    },
  },
  subscriptions: { retrieve: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
  billingPortal: { sessions: { create: vi.fn() } },
}));

// Mock modules
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/stripe/client", () => ({
  stripe: mockStripe,
}));

import { POST } from "@/app/api/stripe/create-checkout/route";
import { createClient } from "@/lib/supabase/server";

const createClientMock = createClient as ReturnType<typeof vi.fn>;

describe("POST /api/stripe/create-checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStripe.customers.create.mockResolvedValue({ id: "cus_new123" });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test123",
      url: "https://checkout.stripe.com/test",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockUnauthenticatedUser(createClientMock);
    const req = createMockRequest("POST", { priceId: "price_xxx_pro_monthly" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when priceId is missing", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock
      .mockTable("profiles")
      .mockSelect({ data: buildProfile(), error: null });

    const req = createMockRequest("POST", {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates checkout session and returns URL", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock
      .mockTable("profiles")
      .mockSelect({ data: buildProfile(), error: null });

    const req = createMockRequest("POST", {
      priceId: "price_xxx_pro_monthly",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.url).toBe("https://checkout.stripe.com/test");
  });

  it("creates new Stripe customer when none exists", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock
      .mockTable("profiles")
      .mockSelect({
        data: buildProfile({ stripe_customer_id: null }),
        error: null,
      });

    const req = createMockRequest("POST", {
      priceId: "price_xxx_pro_monthly",
    });
    await POST(req);

    expect(mockStripe.customers.create).toHaveBeenCalled();
  });

  it("reuses existing Stripe customer when available", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock
      .mockTable("profiles")
      .mockSelect({
        data: buildProfile({ stripe_customer_id: "cus_existing" }),
        error: null,
      });

    const req = createMockRequest("POST", {
      priceId: "price_xxx_pro_monthly",
    });
    await POST(req);

    expect(mockStripe.customers.create).not.toHaveBeenCalled();
  });

  it("extracts UTM metadata from cookies", async () => {
    const supabaseMock = mockAuthenticatedUser(createClientMock);
    supabaseMock
      .mockTable("profiles")
      .mockSelect({ data: buildProfile(), error: null });

    const utmData = encodeURIComponent(
      JSON.stringify({
        utm_source: "facebook",
        utm_medium: "paid",
        utm_campaign: "launch",
      }),
    );

    const req = createMockRequest("POST", {
      priceId: "price_xxx_pro_monthly",
    }, { cookies: { _sf_utm: utmData } });

    await POST(req);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          utm_source: "facebook",
          utm_medium: "paid",
          utm_campaign: "launch",
        }),
      }),
    );
  });
});
