import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnipileClient } from "@/lib/unipile/client";

// ─── Unipile Messages: List chats & Send messages ───────────────
// GET  /api/integrations/unipile/messages?account_id=...&chat_id=...
// POST /api/integrations/unipile/messages

async function verifyAccountExists(accountId: string) {
  // Verify the account exists in Unipile (all accounts in this workspace are valid)
  try {
    const unipile = getUnipileClient();
    const result = await unipile.account.getAll();
    const items = Array.isArray(result)
      ? result
      : (result as { items?: Array<Record<string, unknown>> }).items || [];
    return items.some(
      (a: Record<string, unknown>) => String(a.id) === accountId,
    );
  } catch {
    return false;
  }
}

// GET: List chats or messages from a specific chat
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");
    const chatId = searchParams.get("chat_id");

    if (!accountId) {
      return NextResponse.json(
        { error: "Le paramètre account_id est requis" },
        { status: 400 },
      );
    }

    // Verify ownership
    const isOwner = await verifyAccountExists(accountId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Compte non trouvé ou accès non autorisé" },
        { status: 403 },
      );
    }

    const unipile = getUnipileClient();

    if (chatId) {
      // Return messages from a specific chat
      const messages = await unipile.messaging.getAllMessagesFromChat({
        chat_id: chatId,
      });
      return NextResponse.json({ messages });
    }

    // Return all chats for the account
    const chats = await unipile.messaging.getAllChats({
      account_id: accountId,
    });
    return NextResponse.json({ chats });
  } catch (error) {
    console.error("[Unipile Messages GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 },
    );
  }
}

// POST: Send a message or start a new chat
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { account_id, chat_id, attendee_id, text } = body as {
      account_id?: string;
      chat_id?: string;
      attendee_id?: string;
      text?: string;
    };

    if (!account_id) {
      return NextResponse.json(
        { error: "Le champ account_id est requis" },
        { status: 400 },
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Le champ text est requis" },
        { status: 400 },
      );
    }

    if (!chat_id && !attendee_id) {
      return NextResponse.json(
        { error: "Le champ chat_id ou attendee_id est requis" },
        { status: 400 },
      );
    }

    // Verify ownership
    const isOwner = await verifyAccountExists(account_id);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Compte non trouvé ou accès non autorisé" },
        { status: 403 },
      );
    }

    const unipile = getUnipileClient();

    if (chat_id) {
      // Send message to existing chat
      const result = await unipile.messaging.sendMessage({
        chat_id,
        text,
      });
      return NextResponse.json({ message: result });
    }

    // Start a new chat
    const result = await unipile.messaging.startNewChat({
      account_id,
      attendees_ids: [attendee_id!],
      text,
    });
    return NextResponse.json({ chat: result });
  } catch (error) {
    console.error("[Unipile Messages POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 },
    );
  }
}
