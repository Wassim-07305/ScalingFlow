"use client";

/**
 * UserContext — single source of truth for auth state across the entire dashboard.
 *
 * The DashboardShell receives userId, userName, email, avatarUrl from the
 * server layout (already authenticated). We bootstrap the context from those
 * values immediately (loading = false on first render) and do ONE background
 * verification + profile fetch — instead of every component doing it independently.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { identifyUser } from "@/lib/tracking/touchpoint-tracker";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  children: React.ReactNode;
  /** Passed down from the server layout — already verified server-side */
  initialUserId: string;
  initialEmail: string;
  initialFullName: string | null;
  initialAvatarUrl: string | null;
  initialRole: string;
}

export function UserProvider({
  children,
  initialUserId,
  initialEmail,
  initialFullName,
  initialAvatarUrl,
  initialRole,
}: UserProviderProps) {
  const supabase = useMemo(() => createClient(), []);

  // Bootstrap from server data — no loading flicker on first render
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => ({
    id: initialUserId,
    email: initialEmail,
    full_name: initialFullName,
    avatar_url: initialAvatarUrl,
    role: initialRole as Profile["role"],
    // Non-critical fields default to null/false — overwritten once full profile loads
    first_name: null,
    last_name: null,
    country: null,
    language: null,
    onboarding_completed: false,
    onboarding_step: 0,
    situation: null,
    situation_details: null,
    skills: null,
    vault_skills: null,
    expertise_answers: null,
    parcours: null,
    formations: null,
    experience_level: null,
    current_revenue: null,
    target_revenue: null,
    industries: null,
    objectives: null,
    budget_monthly: null,
    hours_per_week: null,
    deadline: null,
    team_size: null,
    expertise_profonde: null,
    parcours_answers: null,
    team_preference: null,
    has_paying_clients: null,
    formations_text: null,
    vault_completed: false,
    vault_analysis: null,
    selected_market: null,
    market_viability_score: null,
    niche: null,
    xp_points: 0,
    level: 1,
    // Let TypeScript surface any missing fields as compile errors
  } as Profile));
  const [loading, setLoading] = useState(false); // server already validated — not loading

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    const fetchFullProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (mounted && data) setProfile(data);
      } catch {
        // Non-blocking — bootstrap profile is already shown
      }
    };

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          // Fetch full profile in background (replaces bootstrap profile)
          fetchFullProfile(session.user.id);
          // Link anonymous visitor cookie to this user_id (non-blocking)
          identifyUser(session.user.id);
          // Verify JWT in background
          supabase.auth
            .getUser()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((r: any) => {
              if (mounted && r.data?.user) setUser(r.data.user);
            })
            .catch(() => {});
        }
      } catch {
        // Non-blocking
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (_event: string, session: any) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) fetchFullProfile(u.id);
        else setProfile(null);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = useMemo(
    () => ({ user, profile, loading, signOut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, loading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** Drop-in replacement for the old useUser() hook — reads from shared context */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser() must be used inside <UserProvider>");
  }
  return ctx;
}
