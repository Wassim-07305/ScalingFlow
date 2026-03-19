/**
 * check-react-patterns.mjs
 * Détecte les anti-patterns React courants dans src/
 *
 * Usage: node scripts/check-react-patterns.mjs
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const issues = [];

// ─── Walk all .tsx / .ts files ───────────────────────────────
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      checkFile(full);
    }
  }
}

function report(file, line, rule, detail) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  issues.push({ file: `src/${rel}`, line, rule, detail });
}

// ─── Rules ───────────────────────────────────────────────────

function checkFile(filePath) {
  const src = readFileSync(filePath, "utf8");

  // Skip non-client files (hooks and components only)
  if (!src.includes("use client") && !src.includes("useEffect") && !src.includes("useState")) return;

  const lines = src.split("\n");

  // ── Rule 1: createClient() not wrapped in useMemo ──────────
  // Flags: `const X = createClient()` where X is then used in
  // a useCallback / useEffect dependency array.
  const rawClientMatch = src.match(/const\s+(\w+)\s*=\s*createClient\(\)/);
  if (rawClientMatch) {
    const varName = rawClientMatch[1];
    // Check if the variable is inside useMemo already
    const memoPattern = new RegExp(`const\\s+${varName}\\s*=\\s*useMemo\\(`);
    if (!memoPattern.test(src)) {
      // Find the line number
      const lineNum = lines.findIndex((l) => l.includes(`const ${varName} = createClient()`)) + 1;
      // Check if varName appears in a dep array or useCallback
      const inDeps = new RegExp(`\\[.*\\b${varName}\\b.*\\]`).test(src);
      const inCallback = new RegExp(`useCallback\\([^)]*${varName}`).test(src);
      report(
        filePath,
        lineNum,
        "UNSTABLE_SUPABASE_CLIENT",
        `\`const ${varName} = createClient()\` sans useMemo${inDeps || inCallback ? " (utilisé dans deps array → boucle infinie possible)" : " (closure périmée possible)"}`,
      );
    }
  }

  // ── Rule 2: useState(true) for loading when user may be null
  // Pattern: component has useUser() AND useState(true) for a
  // variable whose name contains "loading" or "isLoading".
  if (src.includes("useUser()")) {
    lines.forEach((line, i) => {
      const m = line.match(/const\s+\[(\w*[Ll]oading\w*|isLoading\w*)\s*,.*\]\s*=\s*useState\(true\)/);
      if (m) {
        report(
          filePath,
          i + 1,
          "LOADING_TRUE_WITH_NULL_USER",
          `\`useState(true)\` pour \`${m[1]}\` — le fetch peut être skippé si user est null au premier render, laissant le spinner bloqué indéfiniment`,
        );
      }
    });
  }

  // ── Rule 3: useCallback with missing deps (supabase / user) ─
  // Pattern: useCallback that uses `supabase.from` or `user.id`
  // but the dep array doesn't include the variable.
  const callbackBlocks = [...src.matchAll(/useCallback\(async\s*\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[([\s\S]*?)\]\)/g)];
  for (const match of callbackBlocks) {
    const body = match[1];
    const deps = match[2];
    const lineNum = src.slice(0, match.index).split("\n").length;

    if (body.includes("supabase") && !deps.includes("supabase")) {
      report(filePath, lineNum, "MISSING_DEP_SUPABASE", "`supabase` utilisé dans useCallback mais absent du tableau de dépendances");
    }
    if (body.includes("user") && !deps.includes("user")) {
      report(filePath, lineNum, "MISSING_DEP_USER", "`user` utilisé dans useCallback mais absent du tableau de dépendances");
    }
  }

  // ── Rule 4: fetchXxx called in useEffect that returns early ─
  // Pattern: useEffect(() => { if (!user) return; ... fetchXxx() },
  // where loading state starts at true but early return means
  // setLoading(false) is never called.
  // Simplified: warn if useEffect body has both `if (!user) return`
  // and calls a fetch function, without an else setLoading(false).
  const effectBlocks = [...src.matchAll(/useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\},/g)];
  for (const match of effectBlocks) {
    const body = match[1];
    const lineNum = src.slice(0, match.index).split("\n").length;
    if (
      body.includes("if (!user) return") &&
      /fetch\w+\(\)|load\w+\(\)/.test(body) &&
      !body.includes("setLoading(false)")
    ) {
      report(
        filePath,
        lineNum,
        "EARLY_RETURN_WITHOUT_LOADING_RESET",
        "useEffect avec `if (!user) return` appelle une fonction de fetch mais ne reset pas loading si user est null",
      );
    }
  }
}

// ─── Run ─────────────────────────────────────────────────────
walk(ROOT);

if (issues.length === 0) {
  console.log("✅ Aucun anti-pattern détecté !");
  process.exit(0);
}

// ─── Group by rule ───────────────────────────────────────────
const byRule = {};
for (const issue of issues) {
  (byRule[issue.rule] ??= []).push(issue);
}

const RULE_LABELS = {
  UNSTABLE_SUPABASE_CLIENT: "🔴 createClient() non memoïsé (boucle infinie possible)",
  LOADING_TRUE_WITH_NULL_USER: "🟡 useState(true) + useUser → spinner potentiellement bloqué",
  MISSING_DEP_SUPABASE: "🟠 supabase manquant dans les deps de useCallback",
  MISSING_DEP_USER: "🟠 user manquant dans les deps de useCallback",
  EARLY_RETURN_WITHOUT_LOADING_RESET: "🟡 early return sans reset du loading state",
};

console.log(`\n⚠️  ${issues.length} problème(s) détecté(s)\n${"─".repeat(60)}`);

for (const [rule, ruleIssues] of Object.entries(byRule)) {
  console.log(`\n${RULE_LABELS[rule] || rule} (${ruleIssues.length})`);
  for (const { file, line, detail } of ruleIssues) {
    console.log(`  ${file}:${line}`);
    console.log(`    → ${detail}`);
  }
}

console.log(`\n${"─".repeat(60)}`);
process.exit(1);
