import { createClient } from "@/lib/supabase/server";
import { getBadgeDefinition } from "@/lib/gamification/badges";

const XP_REWARDS: Record<string, number> = {
  "generation.market_analysis": 50,
  "generation.persona": 50,
  "generation.competitors": 30,
  "generation.offer": 100,
  "generation.category_os": 50,
  "generation.brand": 50,
  "generation.vsl": 50,
  "generation.email": 30,
  "generation.sms": 30,
  "generation.ads": 50,
  "generation.funnel": 75,
  "generation.content_strategy": 50,
  "generation.reels": 30,
  "generation.youtube": 40,
  "generation.stories": 20,
  "generation.carousel": 20,
  "generation.pitch_deck": 40,
  "generation.sales_letter": 40,
  "generation.setting_script": 30,
  "generation.lead_magnet": 30,
  "generation.vault_analysis": 75,
  "validation.offer": 100,
  "community.post": 25,
  "community.comment": 10,
  "milestone.completed": 200,
  "onboarding.completed": 150,
  "streak.daily": 15,
};

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
];

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

const BADGE_CONDITIONS: {
  badge: string;
  condition: (stats: { xp: number; level: number; generations: number }) => boolean;
}[] = [
  { badge: "first_gen", condition: (s) => s.generations >= 1 },
  { badge: "gen_5", condition: (s) => s.generations >= 5 },
  { badge: "gen_20", condition: (s) => s.generations >= 20 },
  { badge: "gen_50", condition: (s) => s.generations >= 50 },
  { badge: "level_3", condition: (s) => s.level >= 3 },
  { badge: "level_5", condition: (s) => s.level >= 5 },
  { badge: "level_10", condition: (s) => s.level >= 10 },
  { badge: "xp_1000", condition: (s) => s.xp >= 1000 },
  { badge: "xp_5000", condition: (s) => s.xp >= 5000 },
];

export async function awardXP(
  userId: string,
  activityType: string,
  activityData?: Record<string, unknown>,
  xpOverride?: number
): Promise<{ xp_awarded: number; new_level: number; new_badges: string[] }> {
  const supabase = await createClient();

  const xpAmount = xpOverride ?? XP_REWARDS[activityType] ?? 10;

  // Fetch current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_points, level, badges")
    .eq("id", userId)
    .single();

  if (!profile) return { xp_awarded: 0, new_level: 1, new_badges: [] };

  const newXP = (profile.xp_points || 0) + xpAmount;
  const newLevel = calculateLevel(newXP);
  const currentBadges: string[] = profile.badges || [];

  // Count total generations for badge conditions
  const [
    { count: offerCount },
    { count: assetCount },
    { count: adCount },
    { count: funnelCount },
    { count: contentCount },
  ] = await Promise.all([
    supabase.from("offers").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("sales_assets").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("ad_creatives").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("funnels").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("content_pieces").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const totalGenerations =
    (offerCount || 0) + (assetCount || 0) + (adCount || 0) + (funnelCount || 0) + (contentCount || 0);

  const stats = { xp: newXP, level: newLevel, generations: totalGenerations };
  const newBadges: string[] = [];

  for (const { badge, condition } of BADGE_CONDITIONS) {
    if (!currentBadges.includes(badge) && condition(stats)) {
      newBadges.push(badge);
    }
  }

  const allBadges = [...currentBadges, ...newBadges];

  // Update profile
  await supabase
    .from("profiles")
    .update({
      xp_points: newXP,
      level: newLevel,
      badges: allBadges,
    })
    .eq("id", userId);

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: userId,
    activity_type: activityType,
    activity_data: { xp_awarded: xpAmount, ...activityData },
  });

  // Create notifications for new badges and level ups
  if (newLevel > (profile.level || 1)) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge" as const,
      title: `Niveau ${newLevel} atteint !`,
      message: `Bravo ! Tu es passé au niveau ${newLevel}.`,
    });
  }

  for (const badge of newBadges) {
    const badgeDef = getBadgeDefinition(badge);
    const badgeName = badgeDef?.name || badge;
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge" as const,
      title: `Badge "${badgeName}" debloque !`,
      message: badgeDef?.description || `Tu as debloque un nouveau badge.`,
    });
  }

  return { xp_awarded: xpAmount, new_level: newLevel, new_badges: newBadges };
}
