import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnipileClient } from "@/lib/unipile/client";

// ─── Unipile Messages: List chats & Send messages ───────────────
// GET  /api/integrations/unipile/messages?account_id=...&chat_id=...
// POST /api/integrations/unipile/messages

async function verifyAccountExists(accountId: string) {
  try {
    const unipile = getUnipileClient();
    const result = await unipile.account.getAll() as Record<string, unknown>;
    let items: Array<Record<string, unknown>> = [];
    if (Array.isArray(result)) {
      items = result;
    } else if (result && typeof result === "object") {
      const raw = (result as Record<string, unknown>).items;
      if (Array.isArray(raw)) items = raw as Array<Record<string, unknown>>;
    }
    return items.some((a) => String(a.id) === accountId);
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
    const rawChats = await unipile.messaging.getAllChats({
      account_id: accountId,
    }) as Record<string, unknown>;

    // Normalize Unipile response — may be { object: "ChatList", items: [...] } or an array
    let chatItems: Array<Record<string, unknown>> = [];
    if (Array.isArray(rawChats)) {
      chatItems = rawChats;
    } else if (rawChats && typeof rawChats === "object") {
      const items = (rawChats as Record<string, unknown>).items;
      if (Array.isArray(items)) {
        chatItems = items as Array<Record<string, unknown>>;
      }
    }

    // Resolve attendee names from Unipile API
    const apiUrl = process.env.UNIPILE_API_URL;
    const accessToken = process.env.UNIPILE_ACCESS_TOKEN;

    // Batch fetch attendee names (best effort, parallel)
    const attendeeIds = [
      ...new Set(
        chatItems
          .filter((c) => !c.archived && c.attendee_provider_id)
          .map((c) => String(c.attendee_provider_id)),
      ),
    ];

    const nameMap = new Map<string, string>();
    if (apiUrl && accessToken && attendeeIds.length > 0) {
      const nameResults = await Promise.allSettled(
        attendeeIds.slice(0, 30).map(async (attendeeId) => {
          try {
            const res = await fetch(
              `${apiUrl}/api/v1/users/${encodeURIComponent(attendeeId)}`,
              {
                headers: { "X-API-KEY": accessToken },
              },
            );
            if (!res.ok) return;
            const profile = (await res.json()) as Record<string, unknown>;
            const name =
              profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : (profile.display_name as string) ||
                  (profile.name as string) ||
                  null;
            if (name) nameMap.set(attendeeId, name);
          } catch {
            // skip individual failures
          }
        }),
      );
    }

    // Map to the shape the frontend expects
    const chats = chatItems
      .filter((c) => !c.archived)
      .map((c) => {
        const attendeeId = String(c.attendee_provider_id ?? "");
        const resolvedName = nameMap.get(attendeeId);
        return {
          id: String(c.id ?? ""),
          account_id: accountId,
          provider: String(c.account_type || "LINKEDIN"),
          participants: [
            {
              id: attendeeId,
              name: resolvedName || String(c.name || c.subject || "Conversation"),
            },
          ],
          last_message: null,
          last_message_at: c.timestamp ? String(c.timestamp) : null,
          unread_count: Number(c.unread_count ?? 0),
        };
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
