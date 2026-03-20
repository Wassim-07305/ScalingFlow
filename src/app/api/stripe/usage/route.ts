import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/lib/stripe/check-usage";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const stats = await getUsageStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 },
    );
  }
}
