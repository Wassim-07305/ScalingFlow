"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Select all columns — RLS already limits access to the user's own profile.
const PROFILE_SELECT = "*";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);
  // Stable reference — createClient() is already a singleton but useMemo
  // guarantees React won't re-trigger the effect on every render.
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Prevent double-init in React StrictMode
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(PROFILE_SELECT)
          .eq("id", userId)
          .single();
        if (error) {
          console.warn("useUser: profile load error", error.message);
        } else if (mounted && data) {
          setProfile(data);
        }
      } catch {
        // Network error — non-blocking
      }
    };

    const init = async () => {
      try {
        // 1. getSession() — instant read from localStorage
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          // 2. Fetch profile BEFORE resolving loading
          await fetchProfile(session.user.id);
          if (!mounted) return;
          setLoading(false);
          // 3. Verify JWT in background (network call)
          supabase.auth
            .getUser()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((r: any) => {
              if (mounted && r.data?.user) setUser(r.data.user);
            })
            .catch(() => {});
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("useUser: init error", err);
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: string, session: { user: User } | null) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await fetchProfile(u.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
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

  return { user, profile, loading, signOut };
}
