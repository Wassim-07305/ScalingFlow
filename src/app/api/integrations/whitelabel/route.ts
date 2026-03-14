import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Whitelabel / Multi-Tenant API (#79) ─────────────────────
// POST: Create organization
// GET: Get user's organization
// PATCH: Update organization settings

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, logo_url, primary_color, accent_color, brand_name, custom_domain } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name et slug sont requis" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets" },
        { status: 400 }
      );
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name,
        slug,
        logo_url: logo_url || null,
        primary_color: primary_color || "#34D399",
        accent_color: accent_color || "#10B981",
        brand_name: brand_name || name,
        custom_domain: custom_domain || null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (orgError) {
      if (orgError.code === "23505") {
        return NextResponse.json(
          { error: "Ce slug est deja utilise" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    // Add owner as member
    await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
      joined_at: new Date().toISOString(),
    });

    // Link profile to organization
    await supabase
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", user.id);

    return NextResponse.json({ success: true, organization: org });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'organisation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ organization: null });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single();

    // Get members
    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id, role, joined_at, invited_at")
      .eq("organization_id", membership.organization_id);

    // Get member profiles
    const memberIds = members?.map((m) => m.user_id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", memberIds);

    const enrichedMembers = members?.map((m) => ({
      ...m,
      profile: profiles?.find((p) => p.id === m.user_id),
    }));

    return NextResponse.json({
      organization: org,
      role: membership.role,
      members: enrichedMembers || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Check user is org owner or admin
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = [
      "name", "logo_url", "primary_color", "accent_color",
      "brand_name", "custom_domain", "features", "limits",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    const { data: org, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", membership.organization_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, organization: org });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour" },
      { status: 500 }
    );
  }
}
