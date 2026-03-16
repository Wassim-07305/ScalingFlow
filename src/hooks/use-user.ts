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
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select(PROFILE_COLUMNS)
            .eq("id", user.id)
            .single();
          if (error) {
            console.error("useUser: failed to load profile", error);
          } else if (mounted && profileData) {
            setProfile(profileData);
          }
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
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("id", session.user.id)
          .single();
        if (error) {
          console.error("useUser: failed to load profile", error);
        } else if (mounted && profileData) {
          setProfile(profileData);
        }
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
