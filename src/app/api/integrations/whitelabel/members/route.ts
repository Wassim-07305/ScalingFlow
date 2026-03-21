import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Whitelabel: Manage Organization Members (#79) ───────────
// POST: Invite a member
// DELETE: Remove a member

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Check admin/owner role
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Server-side plan gate
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("id", user.id)
      .maybeSingle();
    if (!["scale", "agency", "premium"].includes(callerProfile?.subscription_plan || "")) {
      return NextResponse.json(
        { error: "Un abonnement Scale ou Agency est requis" },
        { status: 403 },
      );
    }

    const { email, role = "member" } = await req.json();

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 },
      );
    }

    // Find user by email
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!targetProfile) {
      return NextResponse.json(
        {
          error:
            "Utilisateur non trouve. Il doit d'abord créer un compte ScalingFlow.",
        },
        { status: 404 },
      );
    }

    // Add member
    const { error } = await supabase.from("organization_members").insert({
      organization_id: membership.organization_id,
      user_id: targetProfile.id,
      role: role === "admin" ? "admin" : "member",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Cet utilisateur est deja membre" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update member's profile with org ID
    await supabase
      .from("profiles")
      .update({ organization_id: membership.organization_id })
      .eq("id", targetProfile.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du membre" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 });
    }

    if (user_id === user.id) {
      return NextResponse.json(
        { error: "Tu ne peux pas te retirer toi-meme" },
        { status: 400 },
      );
    }

    // Prevent removing the last admin/owner
    const { data: targetMember } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", membership.organization_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (targetMember && ["owner", "admin"].includes(targetMember.role)) {
      const { count } = await supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", membership.organization_id)
        .in("role", ["owner", "admin"]);

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Impossible de retirer le dernier administrateur" },
          { status: 400 },
        );
      }
    }

    await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", membership.organization_id)
      .eq("user_id", user_id);

    // Remove org link from profile
    await supabase
      .from("profiles")
      .update({ organization_id: null })
      .eq("id", user_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}
