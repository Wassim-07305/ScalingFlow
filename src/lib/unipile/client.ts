import { UnipileClient } from "unipile-node-sdk";

// ─── Unipile SDK: Singleton client ──────────────────────────────

let client: UnipileClient | null = null;

export function getUnipileClient(): UnipileClient {
  if (client) return client;

  const apiUrl = process.env.UNIPILE_API_URL;
  const accessToken = process.env.UNIPILE_ACCESS_TOKEN;

  if (!apiUrl || !accessToken) {
    throw new Error(
      "Variables d'environnement UNIPILE_API_URL et UNIPILE_ACCESS_TOKEN requises",
    );
  }

  client = new UnipileClient(apiUrl, accessToken);
  return client;
}
