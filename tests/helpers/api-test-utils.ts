import { NextRequest } from "next/server";
import { vi, expect } from "vitest";

/**
 * Creates a mock NextRequest for testing API routes.
 */
export function createMockRequest(
  method: string,
  body?: Record<string, unknown>,
  options: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    url?: string;
  } = {},
): NextRequest {
  const url = options.url || "http://localhost:3000/api/test";

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  const req = new NextRequest(url, init);

  // Set cookies if provided
  if (options.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      req.cookies.set(name, value);
    }
  }

  return req;
}

/**
 * Creates a mock NextRequest for Stripe webhook testing (raw text body).
 */
export function createWebhookRequest(
  rawBody: string,
  signature: string,
): NextRequest {
  return new NextRequest("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body: rawBody,
  });
}

/**
 * Generic test: route returns 401 when user is not authenticated.
 */
export async function testAuthRequired(
  handler: (req: NextRequest) => Promise<Response>,
  method = "POST",
  body?: Record<string, unknown>,
) {
  const req = createMockRequest(method, body);
  const res = await handler(req);
  expect(res.status).toBe(401);
  const json = await res.json();
  expect(json.error).toBeDefined();
}
