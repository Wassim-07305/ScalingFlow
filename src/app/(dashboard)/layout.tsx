import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: {
    template: "%s | ScalingFlow",
    default: "Dashboard | ScalingFlow",
  },
  description: "Plateforme IA pour structurer et scaler ton business.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Timeout de 5s sur la vérification d'auth pour éviter un blocage si Supabase est lent
  const authResult = await Promise.race([
    supabase.auth.getUser(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
  ]);

  const user = authResult && "data" in authResult ? authResult.data.user : null;

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userProfile = profile || {
    id: user.id,
    email: user.email || "",
    full_name:
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur",
    avatar_url: null,
    role: "user",
    organization_id: null,
  };

  // Fetch organization branding if user belongs to one
  let orgBranding: {
    brand_name: string | null;
    logo_url: string | null;
    primary_color: string;
    accent_color: string;
  } | null = null;

  if (userProfile.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("brand_name, logo_url, primary_color, accent_color")
      .eq("id", userProfile.organization_id)
      .single();

    if (org) {
      orgBranding = org;
    }
  }

  return (
    <DashboardShell
      role={userProfile.role || "user"}
      userName={userProfile.full_name || "Utilisateur"}
      email={userProfile.email || user.email || ""}
      avatarUrl={userProfile.avatar_url}
      userId={user.id}
      orgBranding={orgBranding}
    >
      {children}
    </DashboardShell>
  );
}
