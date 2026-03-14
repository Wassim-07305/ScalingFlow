import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  await supabase
    .from("profiles")
    .update({ onboarding_completed: false, onboarding_step: 0 })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
