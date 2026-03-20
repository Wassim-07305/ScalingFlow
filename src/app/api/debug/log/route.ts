import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Only active when SUPABASE_DEBUG=true — receives log lines from the browser
// and appends them to the same log file as server-side calls.
export async function POST(request: Request) {
  if (process.env.SUPABASE_DEBUG !== "true") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const { line } = await request.json();
    if (typeof line !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const logFile = path.resolve(process.cwd(), "supabase-queries.log");
    fs.appendFileSync(logFile, line + "\n", "utf8");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
