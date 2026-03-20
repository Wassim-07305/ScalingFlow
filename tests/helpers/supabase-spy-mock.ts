import { vi } from "vitest";

/**
 * A Supabase mock that SPIES on all database operations.
 * Unlike supabase-mock.ts which only configures return values,
 * this mock also records what arguments were passed to .insert(), .update(), .delete(), .eq(), etc.
 *
 * This is critical for verifying that routes send the RIGHT data to Supabase,
 * not just that they return the right HTTP status.
 */

interface SpyCall {
  table: string;
  method: "select" | "insert" | "update" | "delete" | "upsert";
  args: unknown[];
  filters: { method: string; args: unknown[] }[];
  terminal: string | null; // "single" | "maybeSingle" | null
}

type MockResult = { data: unknown; error: unknown; count?: number };
const DEFAULT_RESULT: MockResult = { data: null, error: null };

export function createSupabaseSpyMock() {
  const calls: SpyCall[] = [];
  const tableResults = new Map<string, {
    select: MockResult;
    insert: MockResult;
    update: MockResult;
    delete: MockResult;
  }>();

  function getResult(table: string, method: string): MockResult {
    return tableResults.get(table)?.[method as keyof ReturnType<typeof getDefaults>] ?? { ...DEFAULT_RESULT };
  }

  function getDefaults() {
    return { select: { ...DEFAULT_RESULT }, insert: { ...DEFAULT_RESULT }, update: { ...DEFAULT_RESULT }, delete: { ...DEFAULT_RESULT } };
  }

  function createChain(table: string, method: string, methodArgs: unknown[]): Record<string, unknown> {
    const currentCall: SpyCall = {
      table,
      method: method as SpyCall["method"],
      args: methodArgs,
      filters: [],
      terminal: null,
    };
    calls.push(currentCall);

    const result = getResult(table, method);
    const chain: Record<string, unknown> = {};

    // Filter methods that record args and keep chaining
    for (const filterName of ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in", "contains", "filter", "not", "or", "match", "order", "limit", "range"]) {
      chain[filterName] = vi.fn().mockImplementation((...args: unknown[]) => {
        currentCall.filters.push({ method: filterName, args });
        return chain;
      });
    }

    // Terminal methods
    chain.single = vi.fn().mockImplementation(() => {
      currentCall.terminal = "single";
      return Promise.resolve(result);
    });
    chain.maybeSingle = vi.fn().mockImplementation(() => {
      currentCall.terminal = "maybeSingle";
      return Promise.resolve(result);
    });

    // Thenable
    chain.then = vi.fn().mockImplementation((resolve: (v: MockResult) => void) => {
      return Promise.resolve(result).then(resolve);
    });

    // Sub-operations (insert on a chain from select)
    chain.select = vi.fn().mockImplementation((...args: unknown[]) => {
      return chain; // keep the same chain
    });
    chain.insert = vi.fn().mockImplementation((...args: unknown[]) => {
      return createChain(table, "insert", args);
    });
    chain.update = vi.fn().mockImplementation((...args: unknown[]) => {
      return createChain(table, "update", args);
    });
    chain.delete = vi.fn().mockImplementation((...args: unknown[]) => {
      return createChain(table, "delete", args);
    });

    return chain;
  }

  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  };

  const mock = {
    auth,

    from: vi.fn().mockImplementation((table: string) => {
      const chain: Record<string, unknown> = {};

      // Initial method calls from .from()
      chain.select = vi.fn().mockImplementation((...args: unknown[]) => {
        return createChain(table, "select", args);
      });
      chain.insert = vi.fn().mockImplementation((...args: unknown[]) => {
        return createChain(table, "insert", args);
      });
      chain.update = vi.fn().mockImplementation((...args: unknown[]) => {
        return createChain(table, "update", args);
      });
      chain.delete = vi.fn().mockImplementation((...args: unknown[]) => {
        return createChain(table, "delete", args);
      });

      return chain;
    }),

    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        upload: vi.fn().mockResolvedValue({ data: { path: "test" }, error: null }),
      }),
    },

    // --- Configuration ---
    setResult(table: string, method: string, result: MockResult) {
      if (!tableResults.has(table)) {
        tableResults.set(table, getDefaults());
      }
      const t = tableResults.get(table)!;
      (t as Record<string, MockResult>)[method] = result;
    },

    // --- Assertions ---

    /** Get all recorded calls */
    getCalls(): SpyCall[] {
      return [...calls];
    },

    /** Get calls for a specific table */
    getCallsForTable(table: string): SpyCall[] {
      return calls.filter((c) => c.table === table);
    },

    /** Get insert calls for a specific table */
    getInserts(table: string): SpyCall[] {
      return calls.filter((c) => c.table === table && c.method === "insert");
    },

    /** Get update calls for a specific table */
    getUpdates(table: string): SpyCall[] {
      return calls.filter((c) => c.table === table && c.method === "update");
    },

    /** Assert that a specific table received an insert with expected data */
    assertInserted(table: string, expectedData: Record<string, unknown>) {
      const inserts = mock.getInserts(table);
      if (inserts.length === 0) {
        throw new Error(`Expected .from("${table}").insert() to be called, but it was never called`);
      }

      const lastInsert = inserts[inserts.length - 1];
      const insertedData = lastInsert.args[0] as Record<string, unknown>;

      for (const [key, value] of Object.entries(expectedData)) {
        if (!(key in insertedData)) {
          throw new Error(
            `Expected .from("${table}").insert() to include "${key}", but it was missing.\n` +
            `Received keys: ${Object.keys(insertedData).join(", ")}`,
          );
        }
        if (value !== undefined && insertedData[key] !== value) {
          throw new Error(
            `Expected .from("${table}").insert().${key} to be ${JSON.stringify(value)}, ` +
            `but got ${JSON.stringify(insertedData[key])}`,
          );
        }
      }
    },

    /** Assert that a specific table received an update with expected data */
    assertUpdated(table: string, expectedData: Record<string, unknown>) {
      const updates = mock.getUpdates(table);
      if (updates.length === 0) {
        throw new Error(`Expected .from("${table}").update() to be called, but it was never called`);
      }

      const lastUpdate = updates[updates.length - 1];
      const updatedData = lastUpdate.args[0] as Record<string, unknown>;

      for (const [key, value] of Object.entries(expectedData)) {
        if (!(key in updatedData)) {
          throw new Error(
            `Expected .from("${table}").update() to include "${key}", but it was missing.\n` +
            `Received keys: ${Object.keys(updatedData).join(", ")}`,
          );
        }
        if (value !== undefined && updatedData[key] !== value) {
          throw new Error(
            `Expected .from("${table}").update().${key} to be ${JSON.stringify(value)}, ` +
            `but got ${JSON.stringify(updatedData[key])}`,
          );
        }
      }
    },

    /** Assert that a filter (.eq, .neq, etc.) was applied */
    assertFiltered(table: string, method: string, filterMethod: string, ...expectedArgs: unknown[]) {
      const tableCalls = calls.filter((c) => c.table === table && c.method === method);
      if (tableCalls.length === 0) {
        throw new Error(`Expected .from("${table}").${method}() to be called`);
      }

      const hasFilter = tableCalls.some((c) =>
        c.filters.some(
          (f) =>
            f.method === filterMethod &&
            JSON.stringify(f.args) === JSON.stringify(expectedArgs),
        ),
      );

      if (!hasFilter) {
        throw new Error(
          `Expected .from("${table}").${method}().${filterMethod}(${expectedArgs.map((a) => JSON.stringify(a)).join(", ")}) ` +
          `but this filter was never applied`,
        );
      }
    },

    /** Reset all recorded calls */
    reset() {
      calls.length = 0;
      tableResults.clear();
    },
  };

  return mock;
}

export type SupabaseSpyMock = ReturnType<typeof createSupabaseSpyMock>;
