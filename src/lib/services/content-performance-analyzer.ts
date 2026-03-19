import type { SupabaseClient } from "@supabase/supabase-js";

export interface ContentTypePerf {
  avgEngagement: number; // (likes + comments + shares) / max(views,1) * 100
  avgReach: number; // average views
  conversionScore: number; // shares as proxy for conversion intent
  count: number;
}

export interface ContentAnglePerf {
  angle: string;
  avgEngagement: number;
  count: number;
}

export interface ContentPerformanceProfile {
  hasData: boolean;
  bestFormat: string; // reel | carousel | story | post | youtube
  distribution: Record<string, number>; // { reel: 50, carousel: 25, story: 15, post: 10 }
  bestAngle: string;
  byType: Record<string, ContentTypePerf>;
  byAngle: Record<string, ContentAnglePerf>;
  insightText: string;
}

const DEFAULT_DISTRIBUTION: Record<string, number> = {
  reel: 40,
  carousel: 25,
  story: 25,
  post: 10,
};

const DEFAULT_PROFILE: ContentPerformanceProfile = {
  hasData: false,
  bestFormat: "reel",
  distribution: DEFAULT_DISTRIBUTION,
  bestAngle: "educatif",
  byType: {},
  byAngle: {},
  insightText:
    "Pas encore assez de données. Distribution équilibrée par défaut.",
};

// Map content_type strings to normalized format keys
function normalizeType(raw: string): string {
  const t = (raw || "").toLowerCase();
  if (t.includes("reel") || t === "instagram_reel" || t === "tiktok_video")
    return "reel";
  if (t.includes("carousel") || t === "instagram_carousel") return "carousel";
  if (t.includes("story") || t === "instagram_story") return "story";
  if (t.includes("youtube") || t === "youtube_video" || t === "youtube_short")
    return "youtube";
  return "post";
}

export async function analyzeContentPerformance(
  userId: string,
  supabase: SupabaseClient,
): Promise<ContentPerformanceProfile> {
  const since30d = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Query content_pieces (user-published content with metrics)
  const { data: pieces } = await supabase
    .from("content_pieces")
    .select("content_type, views, likes, comments, shares")
    .eq("user_id", userId)
    .gte("created_at", since30d);

  // Query content_suggestions with status=published (auto-generated published content)
  const { data: suggestions } = await supabase
    .from("content_suggestions")
    .select("content_type, angle, script")
    .eq("user_id", userId)
    .eq("status", "published")
    .gte("created_at", since30d);

  const byType: Record<
    string,
    {
      totalEngagement: number;
      totalReach: number;
      totalShares: number;
      count: number;
    }
  > = {};

  const byAngle: Record<string, { totalEngagement: number; count: number }> =
    {};

  // Process content_pieces
  for (const p of pieces ?? []) {
    const type = normalizeType(p.content_type as string);
    const views = (p.views as number) || 0;
    const likes = (p.likes as number) || 0;
    const comments = (p.comments as number) || 0;
    const shares = (p.shares as number) || 0;
    const engagement =
      views > 0 ? ((likes + comments + shares) / views) * 100 : 0;

    if (!byType[type]) {
      byType[type] = {
        totalEngagement: 0,
        totalReach: 0,
        totalShares: 0,
        count: 0,
      };
    }
    byType[type].totalEngagement += engagement;
    byType[type].totalReach += views;
    byType[type].totalShares += shares;
    byType[type].count++;
  }

  // Process published suggestions (track by angle)
  for (const s of suggestions ?? []) {
    const type = normalizeType(s.content_type as string);
    const angle = (s.angle as string) || "educatif";

    // Count angle occurrences (we don't have engagement metrics on suggestions yet)
    if (!byAngle[angle]) {
      byAngle[angle] = { totalEngagement: 0, count: 0 };
    }
    byAngle[angle].count++;

    // Also count in byType if not already tracked from content_pieces
    if (!byType[type]) {
      byType[type] = {
        totalEngagement: 0,
        totalReach: 0,
        totalShares: 0,
        count: 0,
      };
    }
  }

  // Check if we have enough data (at least 3 pieces across any types)
  const totalPieces = Object.values(byType).reduce((s, v) => s + v.count, 0);
  if (totalPieces < 3) {
    return DEFAULT_PROFILE;
  }

  // Build normalized byType output
  const byTypeResult: Record<string, ContentTypePerf> = {};
  for (const [type, data] of Object.entries(byType)) {
    if (data.count === 0) continue;
    byTypeResult[type] = {
      avgEngagement: data.totalEngagement / data.count,
      avgReach: data.totalReach / data.count,
      conversionScore: data.totalShares / data.count,
      count: data.count,
    };
  }

  // Build normalized byAngle output
  const byAngleResult: Record<string, ContentAnglePerf> = {};
  for (const [angle, data] of Object.entries(byAngle)) {
    byAngleResult[angle] = {
      angle,
      avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0,
      count: data.count,
    };
  }

  // Find best format by engagement
  const sortedTypes = Object.entries(byTypeResult).sort(
    ([, a], [, b]) => b.avgEngagement - a.avgEngagement,
  );
  const bestFormat = sortedTypes[0]?.[0] ?? "reel";
  const bestFormatPerf = sortedTypes[0]?.[1];

  // Find best angle by count (most published = most validated)
  const sortedAngles = Object.entries(byAngleResult).sort(
    ([, a], [, b]) => b.count - a.count,
  );
  const bestAngle = sortedAngles[0]?.[0] ?? "educatif";

  // Calculate adaptive distribution
  // Base: equal split among known formats
  const knownTypes = sortedTypes.map(([t]) => t);
  const allFormats = ["reel", "carousel", "story", "post"];
  const baseShare = 100 / allFormats.length; // 25 each

  const distribution: Record<string, number> = {};
  for (const fmt of allFormats) {
    distribution[fmt] = baseShare;
  }

  // Boost best format by 20% if it's significantly better (2x engagement)
  if (sortedTypes.length >= 2 && bestFormatPerf) {
    const secondBest = sortedTypes[1]?.[1];
    if (
      secondBest &&
      bestFormatPerf.avgEngagement >= secondBest.avgEngagement * 1.5
    ) {
      distribution[bestFormat] = (distribution[bestFormat] ?? baseShare) + 20;
      // Redistribute the 20% from worst performers
      const worstFormats = knownTypes.slice(-2);
      for (const fmt of worstFormats) {
        distribution[fmt] = Math.max(5, (distribution[fmt] ?? baseShare) - 10);
      }
    }
  }

  // Normalize to 100
  const total = Object.values(distribution).reduce((s, v) => s + v, 0);
  for (const fmt of Object.keys(distribution)) {
    distribution[fmt] = Math.round((distribution[fmt] / total) * 100);
  }

  // Build insightText
  let insightText = "";
  if (sortedTypes.length >= 2) {
    const second = sortedTypes[1];
    const ratio =
      second[1].avgEngagement > 0
        ? (bestFormatPerf!.avgEngagement / second[1].avgEngagement).toFixed(1)
        : "∞";
    insightText = `Tes ${bestFormat}s performent ${ratio}x mieux que tes ${second[0]}s. J'ai ajusté tes suggestions en conséquence.`;
  } else if (sortedTypes.length === 1) {
    insightText = `Tes ${bestFormat}s ont un engagement moyen de ${bestFormatPerf?.avgEngagement.toFixed(1)}%. Continue sur cette lancée !`;
  } else {
    insightText = "Distribution optimisée selon tes données de performance.";
  }

  return {
    hasData: true,
    bestFormat,
    distribution,
    bestAngle,
    byType: byTypeResult,
    byAngle: byAngleResult,
    insightText,
  };
}
