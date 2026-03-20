/**
 * Static analysis test: ensures all client-side .insert() calls include user_id.
 *
 * This test catches the exact class of bug that caused the drive_folders 403 error:
 * a Supabase RLS policy requires auth.uid() = user_id, but the code forgot to
 * include user_id in the insert payload.
 *
 * It reads all "use client" files and checks every .insert({...}) call.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Tables that have RLS policies requiring user_id on INSERT
const TABLES_REQUIRING_USER_ID = [
  "drive_folders",
  "drive_files",
  "clients",
  "client_activities",
  "client_deals",
  "community_posts",
  "community_comments",
  "community_likes",
  "community_reactions",
  "pipeline_leads",
  "pipeline_activities",
  "vault_resources",
  "vault_documents",
  "content_pieces",
  "content_batches",
  "ad_creatives",
  "ad_campaigns",
  "funnels",
  "funnel_pages",
  "offers",
  "market_analyses",
  "sales_assets",
  "brand_identities",
  "notifications",
  "tasks",
  "push_subscriptions",
  "academy_quiz_results",
  "challenge_completions",
  "agent_conversations",
  "activity_log",
  "connected_accounts",
];

// Some tables use a different column name for the user reference
const USER_ID_ALIASES: Record<string, string[]> = {
  direct_messages: ["sender_id"],
};

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(d: string) {
    try {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(d, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          walk(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  walk(dir);
  return files;
}

function isClientFile(content: string): boolean {
  return content.includes('"use client"') || content.includes("'use client'");
}

interface InsertCall {
  file: string;
  line: number;
  table: string;
  hasUserId: boolean;
  snippet: string;
}

function findInsertCalls(filePath: string, content: string): InsertCall[] {
  const results: InsertCall[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Look for .from("TABLE").insert({ pattern
    const fromMatch = lines[i].match(/\.from\(["']([^"']+)["']\)/);
    if (!fromMatch) continue;

    const table = fromMatch[1];
    if (!TABLES_REQUIRING_USER_ID.includes(table)) continue;

    // Look for .insert( in the nearby lines (up to 15 lines ahead)
    const searchWindow = lines.slice(i, Math.min(i + 15, lines.length)).join("\n");
    if (!searchWindow.includes(".insert(")) continue;

    // Widen search: include 20 lines before .from() (the insert object might be built earlier)
    const wideWindow = lines.slice(Math.max(0, i - 20), Math.min(i + 20, lines.length)).join("\n");

    // Find the insert call and its content
    const insertIdx = wideWindow.indexOf(".insert(");
    if (insertIdx === -1) continue;
    const afterInsert = wideWindow.slice(insertIdx);

    // Check for user_id or aliases in the wide context around the insert
    const aliases = USER_ID_ALIASES[table] || ["user_id"];
    const hasUserId = aliases.some((alias) => afterInsert.includes(alias))
      // Also check if user_id is in a variable defined before the .from() call
      || aliases.some((alias) => wideWindow.includes(`${alias}:`))
      || aliases.some((alias) => wideWindow.includes(`${alias},`));

    results.push({
      file: filePath,
      line: i + 1,
      table,
      hasUserId,
      snippet: lines[i].trim(),
    });
  }

  return results;
}

describe("RLS Safety — Client-Side Inserts Include user_id", () => {
  const srcDir = path.resolve(__dirname, "../../../src");
  const allFiles = getAllTsFiles(srcDir);
  const clientFiles = allFiles.filter((f) => {
    try {
      return isClientFile(fs.readFileSync(f, "utf-8"));
    } catch {
      return false;
    }
  });

  it("finds client-side files to scan", () => {
    expect(clientFiles.length).toBeGreaterThan(0);
  });

  it("all client-side .insert() calls on RLS tables include user_id", () => {
    const violations: InsertCall[] = [];

    for (const file of clientFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const inserts = findInsertCalls(file, content);
      violations.push(...inserts.filter((ins) => !ins.hasUserId));
    }

    if (violations.length > 0) {
      const messages = violations.map(
        (v) =>
          `  ${path.relative(srcDir, v.file)}:${v.line} — .from("${v.table}").insert() missing user_id`,
      );
      throw new Error(
        `Found ${violations.length} insert(s) without user_id:\n${messages.join("\n")}`,
      );
    }

    expect(violations).toHaveLength(0);
  });
});
