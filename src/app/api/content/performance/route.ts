import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeContentPerformance } from "@/lib/services/content-performance-analyzer";

// GET /api/content/performance
// Returns ContentPerformanceProfile for the authenticated user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const profile = await analyzeContentPerformance(user.id, supabase);

  return NextResponse.json({ profile });
}
