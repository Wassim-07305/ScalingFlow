import { createServerClient } from "@supabase/ssr";

export interface ResolvedOrganization {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
}

/* ── In-memory cache with 5-minute TTL ── */

interface CacheEntry {
  org: ResolvedOrganization | null;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

/**
 * Résout une organisation à partir du hostname de la requête.
 * Vérifie d'abord `custom_domain` exact, puis le pattern `{slug}.scalingflow.com`.
 * Les résultats sont mis en cache 5 minutes.
 */
export async function resolveOrganization(
  hostname: string,
): Promise<ResolvedOrganization | null> {
  // Normaliser le hostname (supprimer le port éventuel)
  const cleanHost = hostname.split(":")[0].toLowerCase();

  // Vérifier le cache
  const cached = cache.get(cleanHost);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.org;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  // Utiliser le service role pour bypasser RLS (middleware n'a pas de cookies user)
  const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });

  let org: ResolvedOrganization | null = null;

  // 1. Vérifier custom_domain exact
  const { data: byDomain } = await supabase
    .from("organizations")
    .select("id, name, slug, primary_color, accent_color, logo_url")
    .eq("custom_domain", cleanHost)
    .maybeSingle();

  if (byDomain) {
    org = byDomain as ResolvedOrganization;
  } else {
    // 2. Vérifier le pattern {slug}.scalingflow.com
    const baseDomain = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
      : "scalingflow.com";

    if (cleanHost.endsWith(`.${baseDomain}`)) {
      const slug = cleanHost.replace(`.${baseDomain}`, "");

      if (slug && !slug.includes(".")) {
        const { data: bySlug } = await supabase
          .from("organizations")
          .select("id, name, slug, primary_color, accent_color, logo_url")
          .eq("slug", slug)
          .maybeSingle();

        if (bySlug) {
          org = bySlug as ResolvedOrganization;
        }
      }
    }
  }

  // Mettre en cache (même les résultats null pour éviter les requêtes répétées)
  cache.set(cleanHost, { org, expiresAt: Date.now() + TTL_MS });

  // Nettoyer les entrées expirées périodiquement (max 100 entrées)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt < now) {
        cache.delete(key);
      }
    }
  }

  return org;
}
