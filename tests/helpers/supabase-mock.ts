import { vi } from "vitest";

/**
 * Creates a chainable mock that mimics Supabase query builder.
 * Usage:
 *   const mock = createSupabaseMock();
 *   mock.mockTable("profiles").mockSelect({ data: [profile], error: null });
 *   // Then mock.from("profiles").select("*").eq("id", "123").single()
 *   // will resolve to the configured return value.
 */

type MockResult = { data: unknown; error: unknown; count?: number };

interface TableMock {
  selectResult: MockResult;
  insertResult: MockResult;
  updateResult: MockResult;
  deleteResult: MockResult;
  upsertResult: MockResult;
}

const DEFAULT_RESULT: MockResult = { data: null, error: null };

export function createSupabaseMock() {
  const tables = new Map<string, TableMock>();

  function getTable(name: string): TableMock {
    if (!tables.has(name)) {
      tables.set(name, {
        selectResult: { ...DEFAULT_RESULT },
        insertResult: { ...DEFAULT_RESULT },
        updateResult: { ...DEFAULT_RESULT },
        deleteResult: { ...DEFAULT_RESULT },
        upsertResult: { ...DEFAULT_RESULT },
      });
    }
    return tables.get(name)!;
  }

  // Creates a chainable query builder that resolves to the configured result
  function createQueryBuilder(result: MockResult): Record<string, unknown> {
    const builder: Record<string, unknown> = {};

    const chainMethods = [
      "select",
      "insert",
      "update",
      "delete",
      "upsert",
      "eq",
      "neq",
      "gt",
      "gte",
      "lt",
      "lte",
      "like",
      "ilike",
      "is",
      "in",
      "contains",
      "containedBy",
      "filter",
      "not",
      "or",
      "match",
      "order",
      "limit",
      "range",
      "textSearch",
    ];

    for (const method of chainMethods) {
      builder[method] = vi.fn().mockReturnValue(builder);
    }

    // Terminal methods that resolve the query
    builder.single = vi.fn().mockResolvedValue(result);
    builder.maybeSingle = vi.fn().mockResolvedValue(result);

    // Make the builder itself thenable (for cases where .single() is not called)
    builder.then = vi.fn().mockImplementation((resolve: (value: MockResult) => void) => {
      return Promise.resolve(result).then(resolve);
    });

    return builder;
  }

  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };

  const mock = {
    auth,

    from: vi.fn().mockImplementation((table: string) => {
      const t = getTable(table);
      const builder = createQueryBuilder(t.selectResult);

      // Override insert/update/delete to return their specific results
      builder.insert = vi.fn().mockImplementation(() => {
        return createQueryBuilder(t.insertResult);
      });
      builder.update = vi.fn().mockImplementation(() => {
        return createQueryBuilder(t.updateResult);
      });
      builder.delete = vi.fn().mockImplementation(() => {
        return createQueryBuilder(t.deleteResult);
      });
      builder.upsert = vi.fn().mockImplementation(() => {
        return createQueryBuilder(t.upsertResult);
      });

      // select returns a builder with the select result
      const originalSelect = builder.select;
      builder.select = vi.fn().mockImplementation((...args: unknown[]) => {
        // Check if head: true is used (for count queries)
        const opts = args[1] as { count?: string; head?: boolean } | undefined;
        if (opts?.head) {
          return createQueryBuilder({ ...t.selectResult, count: t.selectResult.count ?? 0 });
        }
        return (originalSelect as (...args: unknown[]) => unknown)(...args);
      });

      return builder;
    }),

    // Helper to configure table mock results
    mockTable(tableName: string) {
      const t = getTable(tableName);
      return {
        mockSelect(result: MockResult) {
          t.selectResult = result;
          return this;
        },
        mockInsert(result: MockResult) {
          t.insertResult = result;
          return this;
        },
        mockUpdate(result: MockResult) {
          t.updateResult = result;
          return this;
        },
        mockDelete(result: MockResult) {
          t.deleteResult = result;
          return this;
        },
        mockUpsert(result: MockResult) {
          t.upsertResult = result;
          return this;
        },
      };
    },

    // Reset all table mocks
    resetTables() {
      tables.clear();
    },
  };

  return mock;
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>;
