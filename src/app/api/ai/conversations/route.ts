import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — List conversations for current user, optionally filtered by agent_type
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const agentType = req.nextUrl.searchParams.get("agentType");

    let query = supabase
      .from("agent_conversations")
      .select("id, agent_type, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (agentType) {
      query = query.eq("agent_type", agentType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ conversations: data });
  } catch (error) {
    console.error("Error listing conversations:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des conversations" },
      { status: 500 },
    );
  }
}

// POST — Create or update a conversation
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { conversationId, agentType, title, messages } = await req.json();

    if (conversationId) {
      // Update existing conversation
      const { data, error } = await supabase
        .from("agent_conversations")
        .update({ messages, title })
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }

    // Create new conversation
    const { data, error } = await supabase
      .from("agent_conversations")
      .insert({
        user_id: user.id,
        agent_type: agentType || "general",
        title: title || "Nouvelle conversation",
        messages: messages || [],
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Error saving conversation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde" },
      { status: 500 },
    );
  }
}

// DELETE — Delete a conversation
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const conversationId = req.nextUrl.searchParams.get("id");
    if (!conversationId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const { error } = await supabase
      .from("agent_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}
