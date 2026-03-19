/**
 * Hash une IP pour le stockage RGPD-compliant.
 * Utilise SHA-256 via l'API Web Crypto (disponible dans Edge Runtime et Node.js 18+).
 */
export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
