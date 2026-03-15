"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface WhitelabelBranding {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  isWhitelabel: boolean;
  loading: boolean;
}

const DEFAULTS: Omit<WhitelabelBranding, "loading"> = {
  brandName: "ScalingFlow",
  logoUrl: null,
  primaryColor: "#34D399",
  accentColor: "#10B981",
  isWhitelabel: false,
};

/**
 * Hook qui récupère le branding whitelabel de l'organisation de l'utilisateur.
 * Si l'utilisateur n'appartient à aucune organisation, retourne les valeurs par défaut ScalingFlow.
 */
export function useWhitelabel(): WhitelabelBranding {
  const { profile, loading: userLoading } = useUser();
  const [branding, setBranding] = useState<WhitelabelBranding>({
    ...DEFAULTS,
    loading: true,
  });

  useEffect(() => {
    if (userLoading) return;

    if (!profile?.organization_id) {
      setBranding({ ...DEFAULTS, loading: false });
      return;
    }

    const fetchBranding = async () => {
      const supabase = createClient();
      const { data: org } = await supabase
        .from("organizations")
        .select("brand_name, logo_url, primary_color, accent_color, name")
        .eq("id", profile.organization_id as string)
        .single();

      if (org) {
        setBranding({
          brandName: org.brand_name || org.name || DEFAULTS.brandName,
          logoUrl: org.logo_url || null,
          primaryColor: org.primary_color || DEFAULTS.primaryColor,
          accentColor: org.accent_color || DEFAULTS.accentColor,
          isWhitelabel: true,
          loading: false,
        });
      } else {
        setBranding({ ...DEFAULTS, loading: false });
      }
    };

    fetchBranding();
  }, [profile?.organization_id, userLoading]);

  return branding;
}
