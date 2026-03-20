/**
 * Supabase Query Logger
 * Wraps any Supabase client and logs every .from() call with:
 *   - table name
 *   - final HTTP method (select/insert/update/delete/upsert)
 *   - duration
 *   - row count or error
 *
 * Usage (client): const supabase = withLogging(createClient(), "browser")
 * Usage (server): const supabase = withLogging(await createClient(), "server")
 *
 * Enable via env or localStorage:
 *   - Server:  SUPABASE_DEBUG=true in .env.local
 *   - Browser: localStorage.setItem("supabase_debug", "true")
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

function appendToLogFile(line: string) {
  if (typeof window !== "undefined") {
    // Browser: forward to API so the line lands in the server log file
    try {
      fetch("/api/debug/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line }),
        keepalive: true, // non-blocking, won't prevent page navigation
      }).catch(() => {});
    } catch {
      // best-effort
    }
    return;
  }
  // Server (Node.js): write directly
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const logFile = path.resolve(process.cwd(), "supabase-queries.log");
    fs.appendFileSync(logFile, line + "\n", "utf8");
  } catch {
    // Silently ignore — file logging is best-effort
  }
}

function isDebugEnabled(context: "browser" | "server"): boolean {
  if (context === "server") {
    return process.env.SUPABASE_DEBUG === "true";
  }
  if (typeof window !== "undefined") {
    return localStorage.getItem("supabase_debug") === "true";
  }
  return false;
}

const COLORS = {
  table: "\x1b[36m",   // cyan
  ok: "\x1b[32m",      // green
  error: "\x1b[31m",   // red
  warn: "\x1b[33m",    // yellow
  reset: "\x1b[0m",
  dim: "\x1b[2m",
};

function fmt(color: string, text: string) {
  // In browser, ANSI codes don't work — use plain text
  if (typeof window !== "undefined") return text;
  return `${color}${text}${COLORS.reset}`;
}

// Intercepts the query builder returned by .from() and wraps its
// terminal methods (select, insert, update, delete, upsert, single, maybeSingle)
function wrapQueryBuilder(builder: any, table: string, context: string): any {
  if (!builder || typeof builder !== "object") return builder;

  return new Proxy(builder, {
    get(target, prop: string) {
      const original = target[prop];

      // Intercept thenable (.then) to log results
      if (prop === "then") {
        return function (resolve: any, reject: any) {
          const start = performance.now();
          return Promise.resolve(target).then((result: any) => {
            const ms = (performance.now() - start).toFixed(1);
            logResult(table, context, result, ms);
            return result;
          }).then(resolve, reject);
        };
      }

      if (typeof original === "function") {
        return function (...args: any[]) {
          const result = original.apply(target, args);
          // If this returns a new query builder / thenable, wrap it too
          if (result && typeof result === "object" && "then" in result) {
            return wrapQueryBuilder(result, table, context);
          }
          return result;
        };
      }

      return original;
    },
  });
}

function logResult(table: string, context: string, result: any, ms: string) {
  const { data, error, count } = result ?? {};
  const tag = `[supabase:${context}]`;

  if (error) {
    // PGRST116 = 0 rows from .single() — log as warn, not error (use .maybeSingle() to avoid)
    const level = error.code === "PGRST116" ? "warn" : "error";
    const icon = level === "warn" ? "⚠️" : "❌";
    const msg = `${tag} ${icon} ${table} — ${error.message} (code: ${error.code}) +${ms}ms`;
    if (typeof window !== "undefined") {
      console[level](`%c${msg}`, `color: ${level === "warn" ? "#f59e0b" : "#ef4444"}; font-weight: bold`);
    } else {
      console[level](fmt(level === "warn" ? COLORS.warn : COLORS.error, msg), error.details ?? "");
      appendToLogFile(`${new Date().toISOString()} ${level.toUpperCase()} ${msg} | ${error.details ?? ""}`);
    }
    return;
  }

  const rows = Array.isArray(data)
    ? `${data.length} row${data.length !== 1 ? "s" : ""}`
    : data !== null
      ? "1 row"
      : "null";

  const countStr = count !== null && count !== undefined ? ` (total: ${count})` : "";
  const msg = `${tag} ✓ ${table} → ${rows}${countStr} +${ms}ms`;

  if (typeof window !== "undefined") {
    console.log(`%c${msg}`, "color: #34d399; font-weight: 500");
    if (Array.isArray(data) && data.length > 0) {
      console.log(`%c  ↳ first row:`, "color: #8b8f96", data[0]);
    }
  } else {
    console.log(fmt(COLORS.ok, msg));
    appendToLogFile(`${new Date().toISOString()} OK    ${msg}`);
  }
}

// Also log .from() calls to file
function logFromCall(table: string, context: string) {
  if (typeof window === "undefined") {
    appendToLogFile(`${new Date().toISOString()} QUERY [supabase:${context}] → .from("${table}")`);
  }
}

export function withLogging<T extends { from: (...args: any[]) => any }>(
  client: T,
  context: "browser" | "server" = "browser",
): T {
  if (!isDebugEnabled(context)) return client;

  return new Proxy(client, {
    get(target, prop: string) {
      if (prop !== "from") return (target as any)[prop];

      return function (table: string) {
        const builder = (target as any).from(table);
        const tag = `[supabase:${context}]`;

        if (typeof window !== "undefined") {
          console.log(
            `%c${tag} → .from("${table}")`,
            "color: #38bdf8; font-style: italic",
          );
        } else {
          console.log(fmt(COLORS.table, `${tag} → .from("${table}")`));
          logFromCall(table, context);
        }

        return wrapQueryBuilder(builder, table, context);
      };
    },
  }) as T;
}
