import { createServerClient } from "@supabase/ssr";

export interface ResolvedFunnel {
  slug: string;
}

/* ── In-memory cache with 5-minute TTL ── */

interface CacheEntry {
  funnel: ResolvedFunnel | null;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

function getAppDomain(): string {
  if (process.env.NEXT_PUBLIC_APP_DOMAIN) return process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
    } catch {}
  }
  return "scalingflow.io";
}

/**
 * Résout un funnel publié à partir du hostname de la requête.
 * Vérifie d'abord le pattern `{slug}.${APP_DOMAIN}`, puis `custom_domain` exact.
 * Les résultats sont mis en cache 5 minutes.
 */
export async function resolveFunnelByHostname(
  hostname: string,
): Promise<ResolvedFunnel | null> {
  const cleanHost = hostname.split(":")[0].toLowerCase();

  // Vérifier le cache
  const cached = cache.get(cleanHost);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.funnel;
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

  let funnel: ResolvedFunnel | null = null;

  // 1. Vérifier le pattern {slug}.${APP_DOMAIN}
  const appDomain = getAppDomain();
  if (cleanHost.endsWith(`.${appDomain}`)) {
    const slug = cleanHost.replace(`.${appDomain}`, "");

    if (slug && !slug.includes(".")) {
      const { data } = await supabase
        .from("funnels")
        .select("published_slug")
        .eq("published_slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (data) {
        funnel = { slug: data.published_slug };
      }
    }
  }

  // 2. Vérifier custom_domain exact (si pas trouvé par sous-domaine)
  if (!funnel) {
    const { data } = await supabase
      .from("funnels")
      .select("published_slug")
      .eq("custom_domain", cleanHost)
      .eq("published", true)
      .maybeSingle();

    if (data) {
      funnel = { slug: data.published_slug };
    }
  }

  // Mettre en cache (même les résultats null)
  cache.set(cleanHost, { funnel, expiresAt: Date.now() + TTL_MS });

  // Nettoyer les entrées expirées (max 100 entrées)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt < now) {
        cache.delete(key);
      }
    }
  }

  return funnel;
}
