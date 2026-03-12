import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/gamification/xp-engine";
import { rateLimit } from "@/lib/utils/rate-limit";

// Types d'activites autorisees depuis le client
const ALLOWED_ACTIVITIES = [
  "community.post",
  "community.comment",
  "onboarding.completed",
  "streak.daily",
  "challenge.completed",
] as const;

type AllowedActivity = (typeof ALLOWED_ACTIVITIES)[number];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Rate limiting
    const rl = await rateLimit(user.id, "gamification-award", { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requetes. Reessaie dans quelques secondes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const activityType = body.activityType as string;

    if (!activityType || !ALLOWED_ACTIVITIES.includes(activityType as AllowedActivity)) {
      return NextResponse.json(
        { error: "Type d'activite invalide" },
        { status: 400 }
      );
    }

    const result = await awardXP(user.id, activityType, body.data, body.xpOverride);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
