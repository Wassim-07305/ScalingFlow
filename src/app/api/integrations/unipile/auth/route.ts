import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnipileClient } from "@/lib/unipile/client";

// ─── Unipile Hosted Auth: Generate connection link ──────────────
// POST /api/integrations/unipile/auth
// Body: { providers: ["LINKEDIN", "INSTAGRAM", ...] }

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
    const { providers } = body as { providers?: string[] };

    if (!providers || !Array.isArray(providers) || providers.length === 0) {
      return NextResponse.json(
        {
          error:
            'Le champ providers est requis (ex: ["LINKEDIN", "INSTAGRAM"])',
        },
        { status: 400 },
      );
    }

    const validProviders = [
      "LINKEDIN",
      "WHATSAPP",
      "INSTAGRAM",
      "MESSENGER",
      "TELEGRAM",
      "TWITTER",
      "MAIL",
      "GOOGLE",
      "OUTLOOK",
      "IMAP",
    ];

    const invalidProviders = providers.filter(
      (p) => !validProviders.includes(p),
    );
    if (invalidProviders.length > 0) {
      return NextResponse.json(
        { error: `Fournisseurs invalides : ${invalidProviders.join(", ")}` },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const apiUrl = process.env.UNIPILE_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "UNIPILE_API_URL non configuré" },
        { status: 500 },
      );
    }

    // Expiration: 1 hour from now
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const unipile = getUnipileClient();
    const link = await unipile.account.createHostedAuthLink({
      type: "create",
      providers: providers as Array<
        | "LINKEDIN"
        | "WHATSAPP"
        | "INSTAGRAM"
        | "MESSENGER"
        | "TELEGRAM"
        | "TWITTER"
        | "MAIL"
        | "GOOGLE"
        | "OUTLOOK"
      >,
      expiresOn,
      api_url: apiUrl,
      success_redirect_url: `${appUrl}/settings/unipile-callback?unipile=success`,
      failure_redirect_url: `${appUrl}/settings/unipile-callback?unipile=error`,
      notify_url: `${appUrl}/api/integrations/unipile/webhook`,
      name: user.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return NextResponse.json({ url: link.url });
  } catch (error) {
    console.error("[Unipile Auth]", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du lien de connexion" },
      { status: 500 },
    );
  }
}
