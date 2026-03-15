// Apify API integration for social media & web scraping
// Requires env var: APIFY_TOKEN

import { isFirecrawlConfigured } from "./firecrawl";

const APIFY_BASE_URL = "https://api.apify.com/v2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetaAdResult {
  brand: string;
  body: string;
  headline: string;
  ctaText: string;
  ctaUrl: string;
  startDate: string;
  endDate: string;
  format: string;
  imageUrls: string[];
  videoUrls: string[];
  platforms: string[];
}

export interface InstagramProfileResult {
  username: string;
  fullName: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  profilePicUrl: string;
  recentPosts: {
    caption: string;
    likes: number;
    comments: number;
    timestamp: string;
    url: string;
  }[];
}

export interface InstagramPostResult {
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  url: string;
  ownerUsername: string;
  hashtags: string[];
}

export interface TikTokResult {
  description: string;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  authorName: string;
  videoUrl: string;
  hashtags: string[];
}

export interface WebCrawlResult {
  url: string;
  title: string;
  markdown: string;
}

export interface GoogleTrendsResult {
  term: string;
  timelineData: { date: string; value: number }[];
  relatedQueries: string[];
}

// ---------------------------------------------------------------------------
// Configuration check
// ---------------------------------------------------------------------------

/**
 * Check if Apify is configured (token present)
 */
export function isApifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN);
}

/**
 * Check if any scraping provider is available (Apify OR Firecrawl)
 */
export function isScrapingAvailable(): boolean {
  return isApifyConfigured() || isFirecrawlConfigured();
}

// ---------------------------------------------------------------------------
// Core helper — run an Apify actor and return typed results
// ---------------------------------------------------------------------------

async function runActor<T>(
  actorId: string,
  input: Record<string, unknown>,
  maxWaitSecs = 60,
): Promise<T[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.warn("[apify] APIFY_TOKEN not configured");
    return [];
  }

  try {
    // 1. Start the actor run
    const startRes = await fetch(
      `${APIFY_BASE_URL}/acts/${actorId}/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!startRes.ok) {
      console.warn(
        `[apify] Failed to start actor ${actorId}: ${startRes.status} ${startRes.statusText}`,
      );
      return [];
    }

    const startData = await startRes.json();
    const runId: string = startData?.data?.id;
    if (!runId) {
      console.warn(`[apify] No run ID returned for actor ${actorId}`);
      return [];
    }

    // 2. Poll for completion
    const deadline = Date.now() + maxWaitSecs * 1000;
    let datasetId: string | undefined;

    while (Date.now() < deadline) {
      await sleep(3000);

      const pollRes = await fetch(
        `${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`,
        { signal: AbortSignal.timeout(30000) },
      );

      if (!pollRes.ok) {
        console.warn(`[apify] Poll error for run ${runId}: ${pollRes.status}`);
        return [];
      }

      const pollData = await pollRes.json();
      const status: string = pollData?.data?.status;

      if (status === "SUCCEEDED") {
        datasetId = pollData?.data?.defaultDatasetId;
        break;
      }

      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
        console.warn(`[apify] Actor run ${runId} ended with status: ${status}`);
        return [];
      }
      // RUNNING or READY — keep polling
    }

    if (!datasetId) {
      console.warn(`[apify] Timeout waiting for actor ${actorId} (run ${runId})`);
      return [];
    }

    // 3. Fetch dataset items
    const itemsRes = await fetch(
      `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`,
      { signal: AbortSignal.timeout(30000) },
    );

    if (!itemsRes.ok) {
      console.warn(`[apify] Failed to fetch dataset ${datasetId}: ${itemsRes.status}`);
      return [];
    }

    const items: T[] = await itemsRes.json();
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn(`[apify] Error running actor ${actorId}:`, err);
    return [];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Meta Ad Library
// ---------------------------------------------------------------------------

/**
 * Scrape Meta Ad Library — search competitor ads.
 * Uses actor: whoareyouanas/meta-ad-scraper
 */
export async function scrapeMetaAdLibrary(params: {
  searchQuery: string;
  country?: string;
  pageId?: string;
  limit?: number;
}): Promise<MetaAdResult[]> {
  const { searchQuery, country = "FR", pageId, limit = 20 } = params;

  const input: Record<string, unknown> = {
    searchQuery,
    country,
    activeStatus: "active",
    maxConcurrency: 1,
  };
  if (pageId) input.pageId = pageId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("whoareyouanas~meta-ad-scraper", input);

  return raw.slice(0, limit).map((item) => ({
    brand: item.brand ?? item.page_name ?? "",
    body: item.body ?? item.ad_creative_body ?? "",
    headline: item.headline ?? item.ad_creative_link_title ?? "",
    ctaText: item.ctaText ?? item.cta_text ?? "",
    ctaUrl: item.ctaUrl ?? item.ad_creative_link_url ?? "",
    startDate: item.startDate ?? item.ad_delivery_start_time ?? "",
    endDate: item.endDate ?? item.ad_delivery_stop_time ?? "",
    format: item.format ?? item.ad_format ?? "unknown",
    imageUrls: toStringArray(item.images ?? item.image_urls),
    videoUrls: toStringArray(item.videos ?? item.video_urls),
    platforms: toStringArray(item.platforms ?? item.publisher_platforms),
  }));
}

// ---------------------------------------------------------------------------
// Instagram Profile
// ---------------------------------------------------------------------------

/**
 * Scrape an Instagram profile + recent posts.
 * Uses actor: apify/instagram-profile-scraper
 */
export async function scrapeInstagramProfile(
  username: string,
): Promise<InstagramProfileResult | null> {
  const cleanUsername = username.replace(/^@/, "").trim();
  if (!cleanUsername) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("apify~instagram-profile-scraper", {
    usernames: [cleanUsername],
  });

  const profile = raw[0];
  if (!profile) return null;

  return {
    username: profile.username ?? cleanUsername,
    fullName: profile.fullName ?? profile.full_name ?? "",
    bio: profile.biography ?? profile.bio ?? "",
    followers: profile.followersCount ?? profile.edge_followed_by?.count ?? 0,
    following: profile.followsCount ?? profile.edge_follow?.count ?? 0,
    posts: profile.postsCount ?? profile.edge_owner_to_timeline_media?.count ?? 0,
    profilePicUrl: profile.profilePicUrl ?? profile.profile_pic_url_hd ?? "",
    recentPosts: Array.isArray(profile.latestPosts)
      ? profile.latestPosts.map((p: Record<string, unknown>) => ({
          caption: (p.caption as string) ?? "",
          likes: (p.likesCount as number) ?? (p.likes as number) ?? 0,
          comments: (p.commentsCount as number) ?? (p.comments as number) ?? 0,
          timestamp: (p.timestamp as string) ?? "",
          url: (p.url as string) ?? "",
        }))
      : [],
  };
}

// ---------------------------------------------------------------------------
// Instagram Posts
// ---------------------------------------------------------------------------

/**
 * Scrape Instagram posts by URL or hashtag.
 * Uses actor: apify/instagram-scraper
 */
export async function scrapeInstagramPosts(params: {
  url?: string;
  hashtag?: string;
  limit?: number;
}): Promise<InstagramPostResult[]> {
  const { url, hashtag, limit = 20 } = params;

  const input: Record<string, unknown> = {
    resultsLimit: limit,
  };

  if (url) {
    input.directUrls = [url];
  } else if (hashtag) {
    input.search = hashtag.replace(/^#/, "");
    input.searchType = "hashtag";
  } else {
    console.warn("[apify] scrapeInstagramPosts: no url or hashtag provided");
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("apify~instagram-scraper", input);

  return raw.slice(0, limit).map((item) => ({
    caption: item.caption ?? "",
    likes: item.likesCount ?? item.likes ?? 0,
    comments: item.commentsCount ?? item.comments ?? 0,
    timestamp: item.timestamp ?? "",
    url: item.url ?? item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : "",
    ownerUsername: item.ownerUsername ?? item.owner?.username ?? "",
    hashtags: toStringArray(item.hashtags),
  }));
}

// ---------------------------------------------------------------------------
// TikTok
// ---------------------------------------------------------------------------

/**
 * Scrape TikTok videos by hashtag or profile.
 * Uses actor: clockworks/free-tiktok-scraper (cheaper)
 */
export async function scrapeTikTok(params: {
  hashtag?: string;
  profileUrl?: string;
  limit?: number;
}): Promise<TikTokResult[]> {
  const { hashtag, profileUrl, limit = 20 } = params;

  const input: Record<string, unknown> = {};

  if (hashtag) {
    input.hashtags = [hashtag.replace(/^#/, "")];
  } else if (profileUrl) {
    input.profiles = [profileUrl];
  } else {
    console.warn("[apify] scrapeTikTok: no hashtag or profileUrl provided");
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("clockworks~free-tiktok-scraper", input);

  return raw.slice(0, limit).map((item) => ({
    description: item.text ?? item.description ?? item.desc ?? "",
    likes: item.diggCount ?? item.likes ?? 0,
    comments: item.commentCount ?? item.comments ?? 0,
    shares: item.shareCount ?? item.shares ?? 0,
    plays: item.playCount ?? item.plays ?? 0,
    authorName: item.authorMeta?.name ?? item.author?.uniqueId ?? item.authorName ?? "",
    videoUrl: item.webVideoUrl ?? item.videoUrl ?? "",
    hashtags: Array.isArray(item.hashtags)
      ? item.hashtags.map((h: Record<string, unknown>) =>
          typeof h === "string" ? h : (h.name as string) ?? "",
        )
      : [],
  }));
}

// ---------------------------------------------------------------------------
// Website Crawl
// ---------------------------------------------------------------------------

/**
 * Crawl a website and extract markdown content.
 * Uses actor: apify/website-content-crawler (FREE)
 */
export async function crawlWebsite(url: string): Promise<WebCrawlResult | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("apify~website-content-crawler", {
    startUrls: [{ url }],
    maxCrawlPages: 1,
    maxCrawlDepth: 0,
    saveMarkdown: true,
  });

  const page = raw[0];
  if (!page) return null;

  return {
    url: page.url ?? url,
    title: page.metadata?.title ?? page.title ?? "",
    markdown: page.markdown ?? page.text ?? "",
  };
}

// ---------------------------------------------------------------------------
// Google Trends
// ---------------------------------------------------------------------------

/**
 * Scrape Google Trends data for keywords.
 * Uses actor: apify/google-trends-scraper
 */
export async function scrapeGoogleTrends(params: {
  terms: string[];
  geo?: string;
}): Promise<GoogleTrendsResult[]> {
  const { terms, geo = "FR" } = params;

  if (!terms.length) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("apify~google-trends-scraper", {
    searchTerms: terms,
    geo,
  });

  return raw.map((item) => ({
    term: item.searchTerm ?? item.term ?? "",
    timelineData: Array.isArray(item.timelineData)
      ? item.timelineData.map((d: Record<string, unknown>) => ({
          date: (d.date as string) ?? (d.formattedTime as string) ?? "",
          value: (d.value as number) ?? (Array.isArray(d.value) ? d.value[0] : 0),
        }))
      : [],
    relatedQueries: Array.isArray(item.relatedQueries)
      ? item.relatedQueries.map((q: Record<string, unknown>) =>
          typeof q === "string" ? q : (q.query as string) ?? "",
        )
      : toStringArray(item.relatedQueries),
  }));
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" ? v : String(v))).filter(Boolean);
  }
  if (typeof value === "string") return [value];
  return [];
}
