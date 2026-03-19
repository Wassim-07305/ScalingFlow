// Apify API integration for social media & web scraping
// Requires env var: APIFY_TOKEN (ou via system_settings DB)

import { isFirecrawlConfigured } from "./firecrawl";
import { getSetting } from "@/lib/settings/get-setting";

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

export interface YouTubeTranscriptResult {
  title: string;
  description: string;
  viewCount: number;
  likeCount: number;
  channelName: string;
  duration: string;
  uploadDate: string;
  transcript: string;
  url: string;
}

export interface FacebookPostResult {
  text: string;
  likes: number;
  comments: number;
  shares: number;
  type: string;
  timestamp: string;
  url: string;
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
  const token = await getSetting("APIFY_TOKEN");
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

      if (
        status === "FAILED" ||
        status === "ABORTED" ||
        status === "TIMED-OUT"
      ) {
        console.warn(`[apify] Actor run ${runId} ended with status: ${status}`);
        return [];
      }
      // RUNNING or READY — keep polling
    }

    if (!datasetId) {
      console.warn(
        `[apify] Timeout waiting for actor ${actorId} (run ${runId})`,
      );
      return [];
    }

    // 3. Fetch dataset items
    const itemsRes = await fetch(
      `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`,
      { signal: AbortSignal.timeout(30000) },
    );

    if (!itemsRes.ok) {
      console.warn(
        `[apify] Failed to fetch dataset ${datasetId}: ${itemsRes.status}`,
      );
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
 * Scrape Meta Ad Library — search competitor ads by keyword.
 * Uses the official Meta Ad Library API (requires META_ACCESS_TOKEN).
 */
export async function scrapeMetaAdLibrary(params: {
  searchQuery: string;
  country?: string;
  pageId?: string;
  limit?: number;
  maxWaitSecs?: number;
}): Promise<MetaAdResult[]> {
  const { searchQuery, country = "FR", pageId, limit = 20 } = params;

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    console.warn("[meta-ad-library] META_ACCESS_TOKEN not configured");
    return [];
  }

  const fields = [
    "id",
    "page_name",
    "ad_creative_bodies",
    "ad_creative_link_captions",
    "ad_creative_link_titles",
    "ad_delivery_start_time",
    "ad_delivery_stop_time",
    "ad_snapshot_url",
    "publisher_platforms",
    "impressions",
  ].join(",");

  const url = new URL("https://graph.facebook.com/v19.0/ads_archive");
  url.searchParams.set("access_token", token);
  url.searchParams.set("search_terms", searchQuery);
  url.searchParams.set("ad_reached_countries", JSON.stringify([country]));
  url.searchParams.set("ad_active_status", "ACTIVE");
  url.searchParams.set("ad_type", "ALL");
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", String(limit));
  if (pageId) url.searchParams.set("search_page_ids", JSON.stringify([pageId]));

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[meta-ad-library] API error ${res.status}: ${err}`);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const items = data?.data ?? [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.slice(0, limit).map((item: any) => ({
      brand: item.page_name ?? "",
      body: item.ad_creative_bodies?.[0] ?? "",
      headline: item.ad_creative_link_titles?.[0] ?? "",
      ctaText: item.ad_creative_link_captions?.[0] ?? "",
      ctaUrl: item.ad_snapshot_url ?? "",
      startDate: item.ad_delivery_start_time ?? "",
      endDate: item.ad_delivery_stop_time ?? "",
      format: "unknown",
      imageUrls: [],
      videoUrls: [],
      platforms: toStringArray(item.publisher_platforms),
    }));
  } catch (err) {
    console.warn("[meta-ad-library] Fetch error:", err);
    return [];
  }
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
    posts:
      profile.postsCount ?? profile.edge_owner_to_timeline_media?.count ?? 0,
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
    url:
      (item.url ?? item.shortCode)
        ? `https://www.instagram.com/p/${item.shortCode}/`
        : "",
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
    authorName:
      item.authorMeta?.name ?? item.author?.uniqueId ?? item.authorName ?? "",
    videoUrl: item.webVideoUrl ?? item.videoUrl ?? "",
    hashtags: Array.isArray(item.hashtags)
      ? item.hashtags.map((h: Record<string, unknown>) =>
          typeof h === "string" ? h : ((h.name as string) ?? ""),
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
export async function crawlWebsite(
  url: string,
): Promise<WebCrawlResult | null> {
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
  maxWaitSecs?: number;
}): Promise<GoogleTrendsResult[]> {
  const { terms, geo = "FR", maxWaitSecs = 60 } = params;

  if (!terms.length) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("apify~google-trends-scraper", {
    searchTerms: terms,
    geo,
  }, maxWaitSecs);

  return raw.map((item) => ({
    term: item.searchTerm ?? item.term ?? "",
    timelineData: Array.isArray(item.timelineData)
      ? item.timelineData.map((d: Record<string, unknown>) => ({
          date: (d.date as string) ?? (d.formattedTime as string) ?? "",
          value:
            (d.value as number) ?? (Array.isArray(d.value) ? d.value[0] : 0),
        }))
      : [],
    relatedQueries: Array.isArray(item.relatedQueries)
      ? item.relatedQueries.map((q: Record<string, unknown>) =>
          typeof q === "string" ? q : ((q.query as string) ?? ""),
        )
      : toStringArray(item.relatedQueries),
  }));
}

// ---------------------------------------------------------------------------
// YouTube Transcript
// ---------------------------------------------------------------------------

/**
 * Scrape a YouTube video transcript (or channel videos).
 * Uses actor: starvibe/youtube-video-transcript
 */
export async function scrapeYouTubeTranscript(
  videoUrl: string,
): Promise<YouTubeTranscriptResult | null> {
  if (!videoUrl) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("starvibe~youtube-video-transcript", {
    urls: [videoUrl],
  });

  const item = raw[0];
  if (!item) return null;

  return {
    title: item.title ?? "",
    description: item.description ?? "",
    viewCount: item.viewCount ?? item.view_count ?? 0,
    likeCount: item.likeCount ?? item.like_count ?? 0,
    channelName: item.channelName ?? item.channel_name ?? item.author ?? "",
    duration: item.duration ?? "",
    uploadDate: item.uploadDate ?? item.upload_date ?? item.publishedAt ?? "",
    transcript: item.transcript ?? item.captions ?? item.subtitles ?? "",
    url: item.url ?? videoUrl,
  };
}

// ---------------------------------------------------------------------------
// Facebook Posts
// ---------------------------------------------------------------------------

/**
 * Scrape Facebook page posts.
 * Uses actor: danek/facebook-pages-posts-ppr
 */
export async function scrapeFacebookPosts(
  pageUrl: string,
  limit = 15,
): Promise<FacebookPostResult[]> {
  if (!pageUrl) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("danek~facebook-pages-posts-ppr", {
    startUrls: [{ url: pageUrl }],
    maxPosts: limit,
  });

  return raw.slice(0, limit).map((item) => ({
    text: item.text ?? item.message ?? item.postText ?? "",
    likes: item.likes ?? item.likesCount ?? item.reactions ?? 0,
    comments: item.comments ?? item.commentsCount ?? 0,
    shares: item.shares ?? item.sharesCount ?? 0,
    type: item.type ?? item.postType ?? "post",
    timestamp: item.time ?? item.timestamp ?? item.date ?? "",
    url: item.url ?? item.postUrl ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Google Maps Reviews
// ---------------------------------------------------------------------------

export interface GoogleMapsReview {
  name: string;
  text: string;
  stars: number;
  publishedAtDate: string;
  responseFromOwner: string | null;
  reviewUrl: string;
}

/**
 * Scrape Google Maps reviews for a business.
 * Uses actor: compass/Google-Maps-Reviews-Scraper
 */
export async function scrapeGoogleMapsReviews(params: {
  googleMapsUrl: string;
  limit?: number;
}): Promise<GoogleMapsReview[]> {
  const { googleMapsUrl, limit = 30 } = params;

  if (!googleMapsUrl) {
    console.warn("[apify] scrapeGoogleMapsReviews: no URL provided");
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>("compass~Google-Maps-Reviews-Scraper", {
    startUrls: [{ url: googleMapsUrl }],
    maxReviews: limit,
    language: "fr",
  });

  return raw.slice(0, limit).map((item) => ({
    name: item.name ?? item.reviewerName ?? item.author ?? "",
    text: item.text ?? item.reviewText ?? item.body ?? "",
    stars: item.stars ?? item.rating ?? item.score ?? 0,
    publishedAtDate: item.publishedAtDate ?? item.publishAt ?? item.date ?? "",
    responseFromOwner:
      item.responseFromOwner?.text ?? item.ownerResponse ?? null,
    reviewUrl: item.reviewUrl ?? item.url ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Trustpilot Reviews
// ---------------------------------------------------------------------------

export interface TrustpilotReview {
  title: string;
  text: string;
  rating: number;
  date: string;
  author: string;
}

/**
 * Scrape Trustpilot reviews for a business.
 * Uses actor: nikita-sviridenko/trustpilot-reviews-scraper
 */
export async function scrapeTrustpilotReviews(params: {
  trustpilotUrl: string;
  limit?: number;
}): Promise<TrustpilotReview[]> {
  const { trustpilotUrl, limit = 30 } = params;

  if (!trustpilotUrl) {
    console.warn("[apify] scrapeTrustpilotReviews: no URL provided");
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>(
    "nikita-sviridenko~trustpilot-reviews-scraper",
    {
      startUrls: [{ url: trustpilotUrl }],
      maxItems: limit,
    },
  );

  return raw.slice(0, limit).map((item) => ({
    title: item.title ?? item.heading ?? "",
    text: item.text ?? item.reviewBody ?? item.body ?? "",
    rating: item.rating ?? item.stars ?? item.score ?? 0,
    date: item.date ?? item.publishedDate ?? item.createdAt ?? "",
    author:
      item.author ?? item.consumer?.displayName ?? item.reviewerName ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Website Screenshot
// ---------------------------------------------------------------------------

export interface WebsiteScreenshot {
  url: string;
  screenshotUrl: string;
  width: number;
  height: number;
}

/**
 * Take a full-page screenshot of a website.
 * Uses actor: dz_omar/screenshot
 */
export async function screenshotWebsite(
  url: string,
): Promise<WebsiteScreenshot | null> {
  const token = await getSetting("APIFY_TOKEN");
  if (!token) {
    console.warn("[apify] APIFY_TOKEN not configured");
    return null;
  }

  try {
    // Start the actor run with a 30s timeout
    const startRes = await fetch(
      `${APIFY_BASE_URL}/acts/dz_omar~screenshot/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: [{ url }],
          screenshotType: "full",
          format: "png",
          width: 1280,
        }),
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!startRes.ok) {
      console.warn(
        `[apify] Failed to start screenshot actor: ${startRes.status}`,
      );
      return null;
    }

    const startData = await startRes.json();
    const runId: string = startData?.data?.id;
    if (!runId) {
      console.warn("[apify] No run ID returned for screenshot actor");
      return null;
    }

    // Poll for completion (max 30s)
    const deadline = Date.now() + 30000;
    let datasetId: string | undefined;

    while (Date.now() < deadline) {
      await sleep(2000);

      const pollRes = await fetch(
        `${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`,
        { signal: AbortSignal.timeout(10000) },
      );

      if (!pollRes.ok) return null;

      const pollData = await pollRes.json();
      const status: string = pollData?.data?.status;

      if (status === "SUCCEEDED") {
        datasetId = pollData?.data?.defaultDatasetId;
        break;
      }

      if (
        status === "FAILED" ||
        status === "ABORTED" ||
        status === "TIMED-OUT"
      ) {
        console.warn(
          `[apify] Screenshot run ${runId} ended with status: ${status}`,
        );
        return null;
      }
    }

    if (!datasetId) {
      console.warn(
        `[apify] Timeout waiting for screenshot actor (run ${runId})`,
      );
      return null;
    }

    // Fetch dataset items
    const itemsRes = await fetch(
      `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!itemsRes.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = await itemsRes.json();
    const item = Array.isArray(items) ? items[0] : null;

    if (!item) return null;

    const screenshotUrl =
      item.screenshotUrl ??
      item.screenshot_url ??
      item.url_screenshot ??
      item.imageUrl ??
      "";
    if (!screenshotUrl) return null;

    return {
      url,
      screenshotUrl,
      width: item.width ?? 1280,
      height: item.height ?? 800,
    };
  } catch (err) {
    console.warn("[apify] Error running screenshot actor:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tech Stack Detection
// ---------------------------------------------------------------------------

export interface TechStackResult {
  url: string;
  technologies: { name: string; category: string }[];
}

/**
 * Detect the technology stack of a website.
 * Uses actor: botflowtech/website-technology-stack-detector
 */
export async function detectTechStack(
  url: string,
): Promise<TechStackResult | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await runActor<any>(
    "botflowtech~website-technology-stack-detector",
    {
      urls: [url],
    },
  );

  const item = raw[0];
  if (!item) return null;

  // Normalise technologies array from various response shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let technologies: { name: string; category: string }[] = [];

  if (Array.isArray(item.technologies)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    technologies = item.technologies
      .map((t: any) => ({
        name: typeof t === "string" ? t : (t.name ?? t.technology ?? ""),
        category:
          typeof t === "string"
            ? "Autre"
            : (t.category ?? t.categories?.[0] ?? "Autre"),
      }))
      .filter((t: { name: string }) => t.name);
  } else if (Array.isArray(item.detectedTechnologies)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    technologies = item.detectedTechnologies
      .map((t: any) => ({
        name: t.name ?? t.technology ?? "",
        category: t.category ?? t.categories?.[0] ?? "Autre",
      }))
      .filter((t: { name: string }) => t.name);
  }

  return {
    url: item.url ?? url,
    technologies,
  };
}

// ---------------------------------------------------------------------------
// Reddit
// ---------------------------------------------------------------------------

export interface RedditPostResult {
  title: string;
  text: string;
  subreddit: string;
  score: number;
  comments: number;
  url: string;
  author: string;
  topComments: string[];
}

/**
 * Scrape Reddit posts by keyword search.
 * Uses Reddit's public JSON API (no key required).
 */
export async function scrapeReddit(params: {
  query: string;
  limit?: number;
}): Promise<RedditPostResult[]> {
  const { query, limit = 20 } = params;

  if (!query) {
    console.warn("[reddit] scrapeReddit: no query provided");
    return [];
  }

  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=${limit}&type=link`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ScalingFlow/1.0 market-research-bot" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[reddit] Search failed: ${res.status}`);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts = data?.data?.children ?? [];

    return posts.slice(0, limit).map((child: any) => {
      const p = child.data;
      return {
        title: p.title ?? "",
        text: p.selftext ?? "",
        subreddit: p.subreddit ?? "",
        score: p.score ?? 0,
        comments: p.num_comments ?? 0,
        url: p.url ?? `https://reddit.com${p.permalink ?? ""}`,
        author: p.author ?? "",
        topComments: [],
      };
    });
  } catch (err) {
    console.warn("[reddit] scrapeReddit error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : String(v)))
      .filter(Boolean);
  }
  if (typeof value === "string") return [value];
  return [];
}
