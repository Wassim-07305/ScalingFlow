// Re-export from the shared UserContext.
// All components calling useUser() now read from a single provider
// instead of each making independent auth + profile fetches.
export { useUser } from "@/contexts/user-context";
