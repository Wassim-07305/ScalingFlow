import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/content/suggestions
// ?history=true → last 4 weeks (excluding current)
// default → current week only
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const history = searchParams.get("history") === "true";

  let query = supabase
    .from("content_suggestions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (history) {
    // Last 4 weeks excluding current
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const currentMonday = getMondayOfCurrentWeek();
    query = query
      .gte("week_of", fourWeeksAgo)
      .lt("week_of", currentMonday);
  } else {
    // Current week
    query = query.eq("week_of", getMondayOfCurrentWeek());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ suggestions: data ?? [] });
}

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().split("T")[0];
}
