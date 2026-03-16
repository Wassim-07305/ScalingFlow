// Firecrawl API integration for real web scraping
// Requires env var: FIRECRAWL_API_KEY

const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
    };
  };
}

interface FirecrawlSearchResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
}

interface FirecrawlSearchResponse {
  success: boolean;
  data?: FirecrawlSearchResult[];
}

export interface ScrapeResult {
  content: string;
  title: string;
  url: string;
}

export interface WebSearchResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
}

/**
 * Check if Firecrawl is configured (API key present)
 */
export function isFirecrawlConfigured(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

/**
 * Scrape a single URL and return its markdown content.
 * Returns null if Firecrawl is not configured or on error.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult | null> {
  if (!process.env.FIRECRAWL_API_KEY) return null;

  try {
    const res = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.warn(`Firecrawl scrape error ${res.status} for ${url}`);
      return null;
    }

    const data: FirecrawlScrapeResponse = await res.json();

    if (!data.success || !data.data?.markdown) {
      return null;
    }

    return {
      content: data.data.markdown,
      title: data.data.metadata?.title || url,
      url: data.data.metadata?.sourceURL || url,
    };
  } catch (err) {
    console.warn(`Firecrawl scrape failed for ${url}:`, err);
    return null;
  }
}

/**
 * Search the web for a query and return results.
 * Returns empty array if Firecrawl is not configured or on error.
 */
export async function searchWeb(
  query: string,
  limit: number = 5,
): Promise<WebSearchResult[]> {
  if (!process.env.FIRECRAWL_API_KEY) return [];

  try {
    const res = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit,
        scrapeOptions: {
          formats: ["markdown"],
        },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      console.warn(`Firecrawl search error ${res.status}`);
      return [];
    }

    const data: FirecrawlSearchResponse = await res.json();

    if (!data.success || !data.data) {
      return [];
    }

    return data.data.map((r) => ({
      url: r.url,
      title: r.title || r.url,
      description: r.description || "",
      markdown: r.markdown,
    }));
  } catch (err) {
    console.warn("Firecrawl search failed:", err);
    return [];
  }
}

/**
 * Search and scrape: search for a query, then return results with content.
 * Firecrawl search with scrapeOptions already returns markdown,
 * so no additional scraping is needed.
 */
export async function searchAndScrape(
  query: string,
  limit: number = 5,
): Promise<{ results: WebSearchResult[]; scrapedContent: ScrapeResult[] }> {
  const results = await searchWeb(query, limit);

  // Firecrawl search with scrapeOptions returns markdown content directly
  const scrapedContent: ScrapeResult[] = results
    .filter((r) => r.markdown && r.markdown.length > 100)
    .map((r) => ({
      content: truncateContent(r.markdown!, 3000),
      title: r.title,
      url: r.url,
    }));

  return { results, scrapedContent };
}

/**
 * Truncate content to a max character count, trying to break at a sentence.
 */
function truncateContent(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;

  const truncated = content.slice(0, maxChars);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf(".\n"),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
  );

  if (lastSentenceEnd > maxChars * 0.7) {
    return truncated.slice(0, lastSentenceEnd + 1);
  }

  return truncated + "...";
}
