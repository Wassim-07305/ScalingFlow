import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserProvider } from "@/contexts/user-context";
import { createAdminClient } from "@/lib/supabase/admin";

// Cache le profil utilisateur 60s — revalidé via revalidateTag(`profile-${userId}`) lors d'une mise à jour
// Utilise le client admin (service role) car unstable_cache s'exécute hors contexte de requête
// et ne peut pas accéder aux cookies de session.
const getCachedProfile = unstable_cache(
  async (userId: string) => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, organization_id")
      .eq("id", userId)
      .maybeSingle();
    return data;
  },
  ["user-profile"],
  { revalidate: 60 },
);

// Cache le branding organisation 5 min — change rarement
const getCachedOrgBranding = unstable_cache(
  async (orgId: string) => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("organizations")
      .select("brand_name, logo_url, primary_color, accent_color, features")
      .eq("id", orgId)
      .maybeSingle();
    return data;
  },
  ["org-branding"],
  { revalidate: 300 },
);

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

  const profile = await getCachedProfile(user.id);

  const userProfile = profile || {
    id: user.id,
    email: user.email || "",
    full_name:
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Utilisateur",
    avatar_url: null,
    role: "user",
    organization_id: null,
  };

  // Fetch organization branding + features if user belongs to one (caché 5 min)
  let orgBranding: {
    brand_name: string | null;
    logo_url: string | null;
    primary_color: string;
    accent_color: string;
    features: Record<string, boolean> | null;
  } | null = null;

  if (userProfile.organization_id) {
    const org = await getCachedOrgBranding(userProfile.organization_id);
    if (org) orgBranding = org;
  }

  return (
    <UserProvider
      initialUserId={user.id}
      initialEmail={userProfile.email || user.email || ""}
      initialFullName={userProfile.full_name || "Utilisateur"}
      initialAvatarUrl={userProfile.avatar_url}
      initialRole={userProfile.role || "user"}
    >
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
    </UserProvider>
  );
}
