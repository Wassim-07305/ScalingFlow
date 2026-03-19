import { createAdminClient } from "@/lib/supabase/admin";

const XP_AFFILIATE: Record<string, number> = {
  "affiliate.referral_signup": 50,
  "affiliate.conversion": 100,
};

const AFFILIATE_BADGE_CONDITIONS: {
  badge: string;
  condition: (totalConversions: number) => boolean;
}[] = [
  { badge: "affiliate_first", condition: (c) => c >= 1 },
  { badge: "affiliate_ambassador", condition: (c) => c >= 10 },
  { badge: "affiliate_top", condition: (c) => c >= 50 },
];

/**
 * Attribue de l'XP à un affilié (pour une action comme referral_signup ou conversion).
 * Utilise le client admin car on agit au nom d'un autre user.
 */
export async function awardXPForUser(
  userId: string,
  activityType: "affiliate.referral_signup" | "affiliate.conversion",
): Promise<void> {
  const xpAmount = XP_AFFILIATE[activityType] ?? 0;
  if (xpAmount === 0) return;

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_points, level, badges")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const newXP = (profile.xp_points || 0) + xpAmount;

  const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];
  let newLevel = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (newXP >= LEVEL_THRESHOLDS[i]) {
      newLevel = i + 1;
      break;
    }
  }

  const currentBadges: string[] = profile.badges || [];
  const newBadges: string[] = [];

  if (activityType === "affiliate.conversion") {
    // Compter les conversions totales de l'affilié
    const { data: affiliateData } = await supabase
      .from("affiliates")
      .select("total_conversions")
      .eq("user_id", userId)
      .maybeSingle();

    const totalConversions = (affiliateData?.total_conversions || 0) + 1;

    for (const { badge, condition } of AFFILIATE_BADGE_CONDITIONS) {
      if (!currentBadges.includes(badge) && condition(totalConversions)) {
        newBadges.push(badge);
      }
    }
  }

  const allBadges = [...currentBadges, ...newBadges];

  await supabase
    .from("profiles")
    .update({ xp_points: newXP, level: newLevel, badges: allBadges })
    .eq("id", userId);

  await supabase.from("activity_log").insert({
    user_id: userId,
    activity_type: activityType,
    activity_data: { xp_awarded: xpAmount },
  });

  // Notif level up
  if (newLevel > (profile.level || 1)) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge",
      title: `Niveau ${newLevel} atteint !`,
      message: `Bravo ! Tu es passé au niveau ${newLevel}.`,
    });
  }

  // Notifs badges
  for (const badge of newBadges) {
    const badgeNames: Record<string, string> = {
      affiliate_first: "Premier Referral",
      affiliate_ambassador: "Ambassadeur",
      affiliate_top: "Top Affilié",
    };
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge",
      title: `Badge "${badgeNames[badge] || badge}" débloqué !`,
      message: `Tu viens de débloquer un nouveau badge grâce au programme partenaire.`,
    });
  }
}
