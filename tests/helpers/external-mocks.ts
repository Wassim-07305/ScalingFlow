import { vi } from "vitest";

/**
 * Creates a mock Anthropic client.
 */
export function mockAnthropicClient() {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: '{"test": true}' }],
      }),
      stream: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text: "Test response" },
          };
        },
      }),
    },
  };
}

/**
 * Creates a mock Stripe instance.
 */
export function mockStripeInstance() {
  return {
    customers: {
      create: vi.fn().mockResolvedValue({ id: "cus_mock123" }),
      retrieve: vi.fn().mockResolvedValue({ id: "cus_mock123" }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "cs_mock123",
          url: "https://checkout.stripe.com/mock",
        }),
      },
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: "sub_mock123",
        items: {
          data: [{ price: { id: "price_xxx_pro_monthly" } }],
        },
      }),
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://billing.stripe.com/mock",
        }),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
}

/**
 * Creates a mock Resend client.
 */
export function mockResendClient() {
  return {
    emails: {
      send: vi.fn().mockResolvedValue({ id: "email_mock123" }),
    },
  };
}
