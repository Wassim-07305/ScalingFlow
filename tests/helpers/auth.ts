import { vi } from "vitest";
import type { SupabaseMock } from "./supabase-mock";
import { createSupabaseMock } from "./supabase-mock";

export const TEST_USER_ID = "test-user-id-123";
export const TEST_ADMIN_ID = "test-admin-id-456";
export const TEST_USER_EMAIL = "test@example.com";

/**
 * Configures the Supabase mock so getUser() returns an authenticated user.
 * Returns the mock for further configuration.
 */
export function mockAuthenticatedUser(
  createClientMock: ReturnType<typeof vi.fn>,
  userId = TEST_USER_ID,
  email = TEST_USER_EMAIL,
): SupabaseMock {
  const supabaseMock = createSupabaseMock();

  supabaseMock.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email,
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: "2024-01-01T00:00:00Z",
      },
    },
    error: null,
  });

  createClientMock.mockResolvedValue(supabaseMock);
  return supabaseMock;
}

/**
 * Configures the Supabase mock so getUser() returns null (unauthenticated).
 */
export function mockUnauthenticatedUser(
  createClientMock: ReturnType<typeof vi.fn>,
): SupabaseMock {
  const supabaseMock = createSupabaseMock();

  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });

  createClientMock.mockResolvedValue(supabaseMock);
  return supabaseMock;
}
