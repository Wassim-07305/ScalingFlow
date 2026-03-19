/**
 * fix-nested-usememo.mjs
 * Reverts useMemo(() => createClient(), []) back to createClient()
 * when placed inside nested functions (not component body).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
let totalFixed = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) fixFile(full);
  }
}

function fixFile(filePath) {
  const original = readFileSync(filePath, "utf8");
  if (!original.includes("useMemo(() => createClient(), [])")) return;

  const lines = original.split("\n");
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("useMemo(() => createClient(), [])")) continue;

    // Look at 5 lines of context before this line
    const ctx = lines.slice(Math.max(0, i - 5), i).join("\n");

    // Patterns that indicate we're inside a nested function:
    const isNested =
      // Inside an async arrow function or callback
      /async\s*\(/.test(ctx) ||
      /async\s*\(\)\s*=>/.test(ctx) ||
      // Inside a named async function
      /async\s+function\s+\w+/.test(ctx) ||
      // Inside useEffect, useMemo, useCallback body
      /useEffect\s*\(/.test(ctx) ||
      /useCallback\s*\(/.test(ctx) ||
      // Inside setTimeout/setInterval
      /setTimeout\s*\(/.test(ctx) ||
      // Inside a try { block opened recently
      /try\s*\{/.test(ctx.split("\n").slice(-3).join("\n")) ||
      // Inside any arrow function opened recently
      /=>\s*\{\s*$/.test(ctx.split("\n").slice(-2).join("\n"));

    if (isNested) {
      lines[i] = line.replace(
        "useMemo(() => createClient(), [])",
        "createClient()"
      );
      changed = true;
      totalFixed++;
      const rel = filePath.replace(ROOT, "src").replace(/\\/g, "/");
      console.log(`  ${rel}:${i + 1}`);
    }
  }

  if (changed) writeFileSync(filePath, lines.join("\n"), "utf8");
}

console.log("Reverting misplaced useMemo...\n");
walk(ROOT);
console.log(`\n✅ ${totalFixed} corrections appliquées`);
