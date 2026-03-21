import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/vault/resources — List user's vault resources
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("vault_resources")
      .select(
        "id, resource_type, url, file_path, title, file_size, content_type, created_at, extracted_text",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("vault/resources GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Don't send full extracted_text in list — just a flag
    const resources = (data || []).map((r) => ({
      ...r,
      has_extracted_text: !!r.extracted_text,
      extracted_text: undefined,
    }));

    return NextResponse.json({ resources });
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * POST /api/vault/resources — Add a URL-based resource (YouTube link, etc.)
 */
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
    const { title, url, resource_type, extracted_text } = body;

    if (!url && !title) {
      return NextResponse.json(
        { error: "Titre ou URL requis" },
        { status: 400 },
      );
    }

    const { data: resource, error } = await supabase
      .from("vault_resources")
      .insert({
        user_id: user.id,
        resource_type: resource_type || "other",
        url: url || null,
        title: title || url,
        extracted_text: extracted_text?.slice(0, 50000) || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }

    return NextResponse.json({ resource });
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * DELETE /api/vault/resources — Delete a resource
 * Body: { id: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Get file_path before deleting to clean up storage
    const { data: resource } = await supabase
      .from("vault_resources")
      .select("file_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    // Delete from storage if file exists
    if (resource?.file_path) {
      await supabase.storage
        .from("vault-resources")
        .remove([resource.file_path]);
    }

    // Delete from DB
    const { error } = await supabase
      .from("vault_resources")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
