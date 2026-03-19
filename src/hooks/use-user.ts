"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Explicitly list columns to avoid fetching sensitive fields
// (meta_access_token, claude_api_key, webhook_api_key, stripe_customer_id)
const PROFILE_COLUMNS = [
  "id",
  "email",
  "full_name",
  "first_name",
  "last_name",
  "country",
  "language",
  "avatar_url",
  "role",
  "onboarding_completed",
  "onboarding_step",
  "situation",
  "situation_details",
  "skills",
  "vault_skills",
  "expertise_answers",
  "parcours",
  "formations",
  "experience_level",
  "current_revenue",
  "target_revenue",
  "industries",
  "objectives",
  "budget_monthly",
  "hours_per_week",
  "deadline",
  "team_size",
  "vault_completed",
  "vault_analysis",
  "selected_market",
  "market_viability_score",
  "niche",
  "xp_points",
  "level",
  "streak_days",
  "last_active_date",
  "badges",
  "global_progress",
  "show_on_leaderboard",
  "show_revenue",
  "subscription_status",
  "meta_ad_account_id",
  "ghl_webhook_url",
  "organization_id",
  "stripe_connect_account_id",
  "created_at",
  "updated_at",
].join(", ");

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const resolved = useRef(false);
  const supabase = createClient();

  const fetchProfile = async (userId: string, mounted: { current: boolean }) => {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
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
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (mounted.current && user) setUser(user);
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
