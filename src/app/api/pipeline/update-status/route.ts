import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendCAPIIfConfigured } from "@/lib/tracking/meta-capi";

const VALID_STATUSES = [
  "nouveau",
  "engage",
  "call_booke",
  "no_show",
  "follow_up",
  "depot_pose",
  "close",
  "perdu",
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { leadId, newStatus, oldStatus } = body;

    if (!leadId || !newStatus) {
      return NextResponse.json(
        { error: "leadId et newStatus sont requis" },
        { status: 400 },
      );
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Verify lead belongs to user
    const { data: lead, error: leadError } = await supabase
      .from("pipeline_leads")
      .select("id, user_id, name")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    // Update status
    const { error: updateError } = await supabase
      .from("pipeline_leads")
      .update({ status: newStatus })
      .eq("id", leadId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("pipeline_activities").insert({
      lead_id: leadId,
      user_id: user.id,
      action: "Changement de statut",
      old_status: oldStatus || null,
      new_status: newStatus,
    });

    // Envoyer événement CAPI selon le changement de statut (non-bloquant)
    if (newStatus === "call_booke" && oldStatus !== "call_booke") {
      // Appel schedulé → événement Schedule
      sendCAPIIfConfigured(supabase, user.id, "Schedule", {}).catch(() => {});
    }
    if (newStatus === "nouveau" && !oldStatus) {
      // Nouveau lead → événement Lead
      sendCAPIIfConfigured(supabase, user.id, "Lead", {}).catch(() => {});
    }

    // Award XP when deal is closed
    if (newStatus === "close" && oldStatus !== "close") {
      try {
        const baseUrl = req.nextUrl.origin;
        await fetch(`${baseUrl}/api/gamification/award`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie") || "",
          },
          body: JSON.stringify({
            activityType: "challenge.completed",
            data: { type: "deal_closed", leadName: lead.name },
            xpOverride: 150,
          }),
        });
      } catch {
        // XP award is best-effort — don't fail the status update
        console.warn("Failed to award XP for closed deal");
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
