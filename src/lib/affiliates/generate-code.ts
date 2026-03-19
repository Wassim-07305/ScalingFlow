/**
 * Génère un code affilié unique au format "PRENOM-XXXX"
 * Ex: "TOM-A3K9", "MARIE-Z7P2"
 */

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1 pour éviter confusion

function randomSuffix(length = 4): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

/**
 * Génère un code affilié à partir du prénom.
 * Normalise le prénom (majuscules, sans accents, max 6 chars).
 */
export function generateAffiliateCode(firstName: string): string {
  const normalized = firstName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6);

  const prefix = normalized || "SF";
  return `${prefix}-${randomSuffix(4)}`;
}
