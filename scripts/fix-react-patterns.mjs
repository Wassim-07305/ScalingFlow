/**
 * fix-react-patterns.mjs
 * Corrige automatiquement les anti-patterns détectés par check-react-patterns.mjs
 *
 * Usage: node scripts/fix-react-patterns.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
let fixed = 0;
let filesChanged = 0;

// ─── Files to skip (false positives or intentional) ──────────
const SKIP = new Set([
  // use-user: loading=true is intentional (initialized and resolved immediately)
  "hooks/use-user.ts",
]);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) fixFile(full);
  }
}

function fixFile(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, "/");
  if (SKIP.has(rel)) return;

  const original = readFileSync(filePath, "utf8");
  let src = original;

  // ── Fix 1: createClient() → useMemo(() => createClient(), []) ──
  // Match: const <name> = createClient()  (NOT already inside useMemo)
  const rawPattern = /^([ \t]*)const\s+(\w+)\s*=\s*createClient\(\)\s*;/m;
  if (rawPattern.test(src)) {
    const memoCheck = /const\s+\w+\s*=\s*useMemo\(\s*\(\)\s*=>\s*createClient\(\)/;
    if (!memoCheck.test(src)) {
      src = src.replace(
        /^([ \t]*)const\s+(\w+)\s*=\s*createClient\(\)\s*;/m,
        (_, indent, name) => `${indent}const ${name} = useMemo(() => createClient(), []);`,
      );

      // Add useMemo to react import if not already present
      src = ensureReactImport(src, "useMemo");
    }
  }

  // ── Fix 2: useState(true) → useState(false) for loading vars ──
  // Only in files that also use useUser() — avoids touching unrelated code
  if (src.includes("useUser()")) {
    src = src.replace(
      /\bconst\s+\[(\w*[Ll]oading\w*|is[Ll]oading\w*|counts[Ll]oading\w*|loading[A-Z]\w*)\s*,([^)]+)\]\s*=\s*useState\(true\)/g,
      (match, varName, setter) => {
        return `const [${varName},${setter}] = useState(false)`;
      },
    );
  }

  if (src !== original) {
    writeFileSync(filePath, src, "utf8");
    const changes = countChanges(original, src);
    console.log(`✓ src/${rel} (${changes} fix${changes > 1 ? "es" : ""})`);
    fixed += changes;
    filesChanged++;
  }
}

function countChanges(a, b) {
  let n = 0;
  const aRaw = (a.match(/= createClient\(\)/g) || []).length;
  const bRaw = (b.match(/= createClient\(\)/g) || []).length;
  if (aRaw > bRaw) n++;
  const aTrue = (a.match(/useState\(true\)/g) || []).length;
  const bTrue = (b.match(/useState\(true\)/g) || []).length;
  if (aTrue > bTrue) n++;
  return Math.max(n, 1);
}

/**
 * Ensures `name` is in the React named import.
 * Handles both styles:
 *   import { useState, useEffect } from "react"
 *   import React, { useState } from "react"
 *   import React from "react"  (adds named import block)
 */
function ensureReactImport(src, name) {
  // Already present?
  if (new RegExp(`\\b${name}\\b`).test(src.split("\n").find(l => l.includes("from \"react\"") || l.includes("from 'react'")) || "")) {
    return src;
  }

  // Style 1: import { ... } from "react" or import React, { ... } from "react"
  const namedImport = /^(import\s+(?:React,\s*)?\{)([^}]+)(\}\s*from\s*["']react["'])/m;
  if (namedImport.test(src)) {
    return src.replace(namedImport, (_, open, names, close) => {
      const existing = names.split(",").map((n) => n.trim()).filter(Boolean);
      if (existing.includes(name)) return _;
      return `${open}${names.trimEnd()}, ${name}${close}`;
    });
  }

  // Style 2: import React from "react" — add named import
  const defaultImport = /^(import\s+React\s+from\s*["']react["'])/m;
  if (defaultImport.test(src)) {
    return src.replace(defaultImport, `import React, { ${name} } from "react"`);
  }

  return src;
}

walk(ROOT);

console.log(`\n✅ ${filesChanged} fichier(s) modifié(s), ${fixed} correction(s) appliquée(s)`);
