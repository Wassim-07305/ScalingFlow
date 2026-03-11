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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  };

  return (
    <DashboardShell
      role={userProfile.role || "user"}
      userName={userProfile.full_name || "Utilisateur"}
      email={userProfile.email || user.email || ""}
      avatarUrl={userProfile.avatar_url}
      userId={user.id}
    >
      {children}
    </DashboardShell>
  );
}
