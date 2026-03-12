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

interface BadgeStats {
  xp: number;
  level: number;
  generations: number;
  streak: number;
  communityPosts: number;
  maxRoas: number;
}

const BADGE_CONDITIONS: {
  badge: string;
  condition: (stats: BadgeStats) => boolean;
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
  // Streak badges
  { badge: "streak_7", condition: (s) => s.streak >= 7 },
  { badge: "streak_30", condition: (s) => s.streak >= 30 },
  // Community badges
  { badge: "community_first", condition: (s) => s.communityPosts >= 1 },
  { badge: "community_10", condition: (s) => s.communityPosts >= 10 },
  // Ads performance badges
  { badge: "roas_2x", condition: (s) => s.maxRoas >= 2 },
  { badge: "roas_5x", condition: (s) => s.maxRoas >= 5 },
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

  // Count total generations and other stats for badge conditions
  const [
    { count: offerCount },
    { count: assetCount },
    { count: adCount },
    { count: funnelCount },
    { count: contentCount },
    { count: communityPostsCount },
    campaignsRes,
    profileStreakRes,
  ] = await Promise.all([
    supabase.from("offers").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("sales_assets").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("ad_creatives").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("funnels").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("content_pieces").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("ad_campaigns").select("roas").eq("user_id", userId),
    supabase.from("profiles").select("streak_days").eq("id", userId).single(),
  ]);

  const totalGenerations =
    (offerCount || 0) + (assetCount || 0) + (adCount || 0) + (funnelCount || 0) + (contentCount || 0);

  const maxRoas = (campaignsRes.data ?? []).reduce(
    (max, c) => Math.max(max, c.roas ?? 0),
    0
  );

  const stats: BadgeStats = {
    xp: newXP,
    level: newLevel,
    generations: totalGenerations,
    streak: profileStreakRes.data?.streak_days ?? 0,
    communityPosts: communityPostsCount ?? 0,
    maxRoas,
  };
  const newBadges: string[] = [];

  for (const { badge, condition } of BADGE_CONDITIONS) {
    if (!currentBadges.includes(badge) && condition(stats)) {
      newBadges.push(badge);
    }
  }

  const allBadges = [...currentBadges, ...newBadges];

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      xp_points: newXP,
      level: newLevel,
      badges: allBadges,
    })
    .eq("id", userId);

  if (updateError) {
    console.error("awardXP: failed to update profile", updateError);
  }

  // Log activity
  const { error: logError } = await supabase.from("activity_log").insert({
    user_id: userId,
    activity_type: activityType,
    activity_data: { xp_awarded: xpAmount, ...activityData },
  });

  if (logError) {
    console.error("awardXP: failed to log activity", logError);
  }

  // Create notifications for new badges and level ups
  if (newLevel > (profile.level || 1)) {
    const { error: levelNotifError } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge" as const,
      title: `Niveau ${newLevel} atteint !`,
      message: `Bravo ! Tu es passé au niveau ${newLevel}.`,
    });
    if (levelNotifError) console.error("awardXP: failed to create level notification", levelNotifError);
  }

  for (const badge of newBadges) {
    const badgeDef = getBadgeDefinition(badge);
    const badgeName = badgeDef?.name || badge;
    const { error: badgeNotifError } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge" as const,
      title: `Badge "${badgeName}" debloque !`,
      message: badgeDef?.description || `Tu as debloque un nouveau badge.`,
    });
    if (badgeNotifError) console.error("awardXP: failed to create badge notification", badgeNotifError);
  }

  return { xp_awarded: xpAmount, new_level: newLevel, new_badges: newBadges };
}
