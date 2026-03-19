"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Select all columns — RLS already limits access to the user's own profile.
// Sensitive fields (meta_access_token, claude_api_key, etc.) are the user's
// own keys and are safe to fetch client-side. Using "*" prevents column
// mismatch errors when the database schema evolves.
const PROFILE_SELECT = "*";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const resolved = useRef(false);
  const supabase = createClient();

  const fetchProfile = async (userId: string, mounted: { current: boolean }) => {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .single();
    if (error) {
      console.error("useUser: failed to load profile", error);
    } else if (mounted.current && profileData) {
      setProfile(profileData);
    }
  };

  useEffect(() => {
    const mounted = { current: true };

    const done = () => {
      if (!resolved.current) {
        resolved.current = true;
        setLoading(false);
      }
    };

    const init = async () => {
      try {
        // 1. getSession() — lecture localStorage, instantané, débloque le loading
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted.current) return;

        if (session?.user) {
          setUser(session.user);
          done();
          // 2. Charge le profil + vérifie le JWT en arrière-plan (réseau)
          fetchProfile(session.user.id, mounted);
          supabase.auth.getUser().then(({ data }) => {
            if (mounted.current && data.user) setUser(data.user);
          }).catch(() => {});
        } else {
          done();
        }
      } catch (err) {
        console.error("useUser: init error", err);
        done();
      }
    };

    init();

    const {
      data: { subscription },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!mounted.current) return;
      setUser(session?.user ?? null);
      done();
      if (session?.user) {
        fetchProfile(session.user.id, mounted);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted.current = false;
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
