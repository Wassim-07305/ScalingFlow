import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lit un paramètre depuis la table system_settings (DB first),
 * avec fallback sur process.env[key].
 * Toujours exécuté côté serveur. Utilise le service role pour bypasser les RLS.
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("system_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (data?.value) return data.value;
  } catch {
    // Table absente ou ligne non trouvée — fallback env var
  }

  return process.env[key] ?? null;
}
