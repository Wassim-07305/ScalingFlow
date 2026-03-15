import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ─── Unipile Webhook: Account connection events ─────────────────
// POST /api/integrations/unipile/webhook
// Called by Unipile when a user connects an account via hosted auth

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify webhook authenticity via shared secret
    const webhookSecret = process.env.UNIPILE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = request.headers.get("x-webhook-secret") ||
        request.headers.get("authorization")?.replace("Bearer ", "");
      if (providedSecret !== webhookSecret) {
        return NextResponse.json(
          { error: "Webhook non autorisé" },
          { status: 401 }
        );
      }
    }

    const body = await request.json();

    const { event, data } = body as {
      event?: string;
      data?: {
        account_id?: string;
        name?: string; // user.id passed during auth link creation
        provider?: string;
      };
    };

    if (!event || !data) {
      return NextResponse.json(
        { error: "Payload invalide" },
        { status: 400 }
      );
    }

    // Only handle account.created events
    if (event !== "account.created") {
      return NextResponse.json({ ok: true });
    }

    const { account_id, name: userId, provider } = data;

    if (!account_id || !userId || !provider) {
      return NextResponse.json(
        { error: "Données manquantes dans le payload" },
        { status: 400 }
      );
    }

    // Use service role client for webhook (no user session)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const providerKey = `unipile_${provider.toLowerCase()}`;

    // Upsert connected account
    const { error } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: userId,
          provider: providerKey,
          provider_account_id: account_id,
          access_token: "managed_by_unipile",
          provider_username: provider.toLowerCase(),
          metadata: {
            unipile_account_id: account_id,
            unipile_provider: provider,
            connected_via: "hosted_auth",
          },
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (error) {
      console.error("[Unipile Webhook] Erreur Supabase :", error);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du compte" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Unipile Webhook]", error);
    return NextResponse.json(
      { error: "Erreur interne du webhook" },
      { status: 500 }
    );
  }
}
