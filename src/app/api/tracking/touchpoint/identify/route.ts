import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/tracking/touchpoint/identify
 * Links a visitor_id to a user_id and/or lead_id.
 * Called after user authenticates or becomes a lead.
 */
export async function POST(req: NextRequest) {
  try {
    const { visitor_id, user_id, lead_id } = await req.json();

    if (!visitor_id || typeof visitor_id !== "string") {
      return NextResponse.json({ error: "visitor_id requis" }, { status: 400 });
    }
    if (!user_id && !lead_id) {
      return NextResponse.json(
        { error: "user_id ou lead_id requis" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const updates: Record<string, string> = {};
    if (user_id) updates.user_id = user_id;
    if (lead_id) updates.lead_id = lead_id;

    // Update all touchpoints for this visitor that don't yet have the id set
    const query = supabase
      .from("touchpoints")
      .update(updates)
      .eq("visitor_id", visitor_id);

    if (user_id) query.is("user_id", null);

    const { error } = await query;

    if (error) {
      console.error("[tracking/identify] update error:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tracking/identify] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
