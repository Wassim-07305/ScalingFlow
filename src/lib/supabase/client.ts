import { createBrowserClient } from "@supabase/ssr";
import { withLogging } from "./debug";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!client) {
    client = withLogging(
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
      "browser",
    );
  }
  return client;
}
