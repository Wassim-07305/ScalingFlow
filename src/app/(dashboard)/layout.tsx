import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import {
  NAV_SECTIONS,
  NAV_ITEMS,
  QUICK_LINKS,
  BREADCRUMB_LABELS,
} from "@/lib/constants/navigation";

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
    <AppShell
      role={userProfile.role || "user"}
      userName={userProfile.full_name || "Utilisateur"}
      email={userProfile.email || user.email || ""}
      avatarUrl={userProfile.avatar_url}
      userId={user.id}
      navSections={NAV_SECTIONS}
      navItems={NAV_ITEMS}
      quickLinks={QUICK_LINKS}
      breadcrumbLabels={BREADCRUMB_LABELS}
      logoSrc="/icons/icon-192.png"
      appName={
        <>
          Scaling<span className="text-accent">Flow</span>
        </>
      }
      adminRoles={["admin"]}
    >
      {children}
    </AppShell>
  );
}
