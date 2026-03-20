import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockRequest } from "./api-test-utils";
import { mockAuthenticatedUser, mockUnauthenticatedUser } from "./auth";

// Re-export for convenience
export { describe, it, expect, vi, beforeEach };

interface AIRouteTestConfig {
  /** Name of the route for descriptions */
  routeName: string;
  /** The POST handler from the route module */
  handler: (req: NextRequest) => Promise<Response>;
  /** The mocked createClient function */
  createClientMock: ReturnType<typeof vi.fn>;
  /** Valid request body for happy path */
  validBody: Record<string, unknown>;
  /** Required fields to test 400 responses */
  requiredFields: string[];
  /** Additional setup before each test */
  setup?: () => void;
}

/**
 * Generates standard tests for AI routes.
 * All AI routes share the same pattern: auth → rate limit → validate → generate → save → return.
 */
export function describeAIRoute(config: AIRouteTestConfig) {
  const {
    routeName,
    handler,
    createClientMock,
    validBody,
    requiredFields,
    setup,
  } = config;

  describe(`POST /api/ai/${routeName}`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
      setup?.();
    });

    it("returns 401 when user is not authenticated", async () => {
      mockUnauthenticatedUser(createClientMock);
      const req = createMockRequest("POST", validBody);
      const res = await handler(req);
      expect(res.status).toBe(401);
    });

    for (const field of requiredFields) {
      it(`returns 400 when ${field} is missing`, async () => {
        const supabaseMock = mockAuthenticatedUser(createClientMock);
        // Mock rate limit to pass
        supabaseMock.mockTable("rate_limits").mockSelect({
          data: null,
          error: { code: "PGRST116", message: "not found" },
        });

        const bodyWithout = { ...validBody };
        delete bodyWithout[field];

        const req = createMockRequest("POST", bodyWithout);
        const res = await handler(req);
        expect(res.status).toBe(400);
      });
    }
  });
}
