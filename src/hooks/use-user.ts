"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const AUTH_TIMEOUT_MS = 5000;

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const resolved = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const done = () => {
      if (!resolved.current && mounted) {
        resolved.current = true;
        setLoading(false);
      }
    };

    // Safety timeout — force loading=false even if getUser() hangs
    const timeout = setTimeout(() => {
      if (!resolved.current) {
        console.warn("useUser: auth timed out after", AUTH_TIMEOUT_MS, "ms");
        done();
      }
    }, AUTH_TIMEOUT_MS);

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (mounted) setProfile(profile);
        }
      } catch (err) {
        console.error("useUser: failed to load user", err);
      } finally {
        done();
      }
    };

    getUser();

    const {
      data: { subscription },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      // If auth event fires before getUser resolves, mark as done
      done();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (mounted) setProfile(profile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
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
