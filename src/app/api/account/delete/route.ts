import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE() {
  // 1. Authenticate user via session cookie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 2. Use service role to delete user data and auth record
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // Delete user-owned data across all tables
    // Most tables have ON DELETE CASCADE from profiles, but we explicitly
    // clean up to ensure nothing is left behind.
    const tablesToClean = [
      "community_comments",
      "community_likes",
      "community_posts",
      "notifications",
      "activity_log",
      "leaderboard_scores",
      "video_progress",
      "content_pieces",
      "ad_campaigns",
      "ad_creatives",
      "sales_assets",
      "funnels",
      "offers",
      "market_analyses",
    ];

    for (const table of tablesToClean) {
      await serviceClient.from(table).delete().eq("user_id", user.id);
    }

    // Delete the profile (should cascade from auth, but be explicit)
    await serviceClient.from("profiles").delete().eq("id", user.id);

    // 3. Delete the auth user
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(
      user.id,
    );

    if (deleteError) {
      console.error("Erreur suppression auth user:", deleteError);
      return NextResponse.json(
        { error: "Impossible de supprimer le compte" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur suppression compte:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression" },
      { status: 500 },
    );
  }
}
