import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Clés autorisées (allowlist de sécurité)
const ALLOWED_SETTING_KEYS = new Set([
  "ANTHROPIC_API_KEY",
  "APIFY_TOKEN",
  "REPLICATE_API_TOKEN",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "UNIPILE_API_URL",
  "UNIPILE_ACCESS_TOKEN",
]);

// Clés non secrètes (retournées en clair)
const NON_SECRET_KEYS = new Set([
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "UNIPILE_API_URL",
]);

function maskValue(value: string): string {
  if (value.length <= 4) return "****";
  return "****" + value.slice(-4);
}

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user;
}

// GET — retourne tous les settings (valeurs masquées pour les secrets)
export async function GET() {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("system_settings")
    .select("key, value, is_secret, updated_at");

  const dbKeys = new Set((rows ?? []).map((r) => r.key));

  // Construire la map des settings avec valeurs masquées
  const settings: Record<
    string,
    { value: string; is_secret: boolean; source: "db" | "env" | "unset" }
  > = {};

  for (const key of ALLOWED_SETTING_KEYS) {
    const dbRow = (rows ?? []).find((r) => r.key === key);
    const isSecret = !NON_SECRET_KEYS.has(key);

    if (dbRow) {
      settings[key] = {
        value: isSecret ? maskValue(dbRow.value) : dbRow.value,
        is_secret: isSecret,
        source: "db",
      };
    } else if (process.env[key]) {
      settings[key] = {
        value: isSecret ? maskValue(process.env[key]!) : process.env[key]!,
        is_secret: isSecret,
        source: "env",
      };
    } else {
      settings[key] = {
        value: "",
        is_secret: isSecret,
        source: "unset",
      };
    }
  }

  const unconfigured = Array.from(ALLOWED_SETTING_KEYS).filter(
    (k) => !dbKeys.has(k) && !process.env[k],
  );

  return NextResponse.json({ settings, unconfigured });
}

// PUT — upsert une ou plusieurs clés
export async function PUT(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();

  // Support single { key, value } ou batch { settings: { key: value } }
  let updates: Array<{ key: string; value: string }> = [];

  if (body.key && typeof body.value === "string") {
    updates = [{ key: body.key, value: body.value }];
  } else if (body.settings && typeof body.settings === "object") {
    updates = Object.entries(body.settings).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  } else {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }

  // Validation allowlist
  for (const { key } of updates) {
    if (!ALLOWED_SETTING_KEYS.has(key)) {
      return NextResponse.json(
        { error: `Clé non autorisée : ${key}` },
        { status: 400 },
      );
    }
  }

  // Filtrer les valeurs vides (supprimer la clé si vide)
  const toDelete = updates.filter((u) => u.value.trim() === "").map((u) => u.key);
  const toUpsert = updates
    .filter((u) => u.value.trim() !== "")
    .map((u) => ({
      key: u.key,
      value: u.value.trim(),
      is_secret: !NON_SECRET_KEYS.has(u.key),
      updated_at: new Date().toISOString(),
    }));

  const admin = createAdminClient();

  if (toDelete.length > 0) {
    await admin.from("system_settings").delete().in("key", toDelete);
  }

  if (toUpsert.length > 0) {
    const { error } = await admin
      .from("system_settings")
      .upsert(toUpsert, { onConflict: "key" });

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
