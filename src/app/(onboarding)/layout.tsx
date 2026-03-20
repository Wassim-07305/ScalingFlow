import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/contexts/user-context";

export default async function OnboardingLayout({
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
    .select("id, email, full_name, avatar_url, role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/");
  }

  return (
    <UserProvider
      initialUserId={user.id}
      initialEmail={profile?.email || user.email || ""}
      initialFullName={profile?.full_name || null}
      initialAvatarUrl={profile?.avatar_url || null}
      initialRole={profile?.role || "user"}
    >
      {children}
    </UserProvider>
  );
}
