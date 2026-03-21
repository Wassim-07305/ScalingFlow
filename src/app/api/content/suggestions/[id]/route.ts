import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/content/suggestions/[id]
// Body: { status: 'accepted' | 'rejected' | 'published' } | { script: {...} }
// ?addToCalendar=true → also inserts into content_pieces on accept
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { searchParams } = new URL(req.url);
  const addToCalendar = searchParams.get("addToCalendar") === "true";

  // Verify ownership
  const { data: suggestion, error: fetchError } = await supabase
    .from("content_suggestions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !suggestion) {
    return NextResponse.json({ error: "Suggestion introuvable" }, { status: 404 });
  }

  // Build update payload
  const update: Record<string, unknown> = {};

  if (body.status) {
    const allowed = ["accepted", "rejected", "published", "suggested"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    update.status = body.status;
    if (body.status === "accepted") {
      update.accepted_at = new Date().toISOString();
    }
  }

  if (body.script) {
    update.script = body.script;
  }

  const { error: updateError } = await supabase
    .from("content_suggestions")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Optionally add to content_pieces when accepting
  if (body.status === "accepted" && addToCalendar) {
    const script = (suggestion.script as Record<string, unknown>) ?? {};
    await supabase.from("content_pieces").insert({
      user_id: user.id,
      content_type: suggestion.content_type,
      title: script.title ?? "Contenu suggéré",
      content: script.script ?? "",
      hook: script.hook ?? null,
      hashtags: script.hashtags ?? [],
      published: false,
    });
  }

  return NextResponse.json({ success: true });
}
