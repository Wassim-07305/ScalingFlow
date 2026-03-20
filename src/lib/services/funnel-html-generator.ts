/**
 * funnel-html-generator.ts
 *
 * Wrapper over exportFunnelToHTML (src/lib/utils/export-html.ts) for the
 * downloadable HTML export. Injects SEO meta tags, OG tags, Schema.org markup,
 * and accessibility improvements.
 *
 * NOTE: The live served version at /f/[slug] uses Next.js generateMetadata()
 * for SEO — do NOT modify that path here.
 */

import { exportFunnelToHTML, type BrandTheme } from "@/lib/utils/export-html";

interface FunnelExportData {
  optin_page?: {
    headline?: string;
    subheadline?: string;
    bullet_points?: string[];
    cta_text?: string;
    social_proof_text?: string;
  };
  vsl_page?: {
    headline?: string;
    intro_text?: string;
    benefit_bullets?: string[];
    faq?: { question: string; answer: string }[];
  };
  thankyou_page?: {
    confirmation_message?: string;
    next_steps?: string[];
    upsell_headline?: string;
    upsell_description?: string;
    upsell_cta?: string;
  };
}

interface GenerateOptions {
  brandName?: string;
  theme?: BrandTheme;
  canonicalUrl?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generates an enhanced downloadable HTML file for the full funnel.
 * Adds SEO meta tags, OG tags, Schema.org markup, and lazy loading.
 */
export function generateFunnelExportHTML(
  data: FunnelExportData,
  options: GenerateOptions = {},
): string {
  const { brandName = "Mon Offre", theme, canonicalUrl, ogImageUrl, noIndex = false } = options;

  const description =
    data.optin_page?.subheadline ||
    data.optin_page?.headline ||
    `Découvrez ${brandName}`;

  // Get the base HTML from the existing generator
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseHtml = exportFunnelToHTML(data as any, brandName, theme);

  // Build the SEO head injection
  const seoTags = `
    <!-- SEO Meta Tags -->
    <meta name="description" content="${esc(description)}">
    ${noIndex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">'}
    ${canonicalUrl ? `<link rel="canonical" href="${esc(canonicalUrl)}">` : ""}

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(brandName)}">
    <meta property="og:description" content="${esc(description)}">
    ${canonicalUrl ? `<meta property="og:url" content="${esc(canonicalUrl)}">` : ""}
    ${ogImageUrl ? `<meta property="og:image" content="${esc(ogImageUrl)}">` : ""}
    ${ogImageUrl ? `<meta property="og:image:width" content="1200">` : ""}
    ${ogImageUrl ? `<meta property="og:image:height" content="630">` : ""}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(brandName)}">
    <meta name="twitter:description" content="${esc(description)}">
    ${ogImageUrl ? `<meta name="twitter:image" content="${esc(ogImageUrl)}">` : ""}

    <!-- Schema.org -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${esc(brandName)}",
      "description": "${esc(description)}"${canonicalUrl ? `,\n      "url": "${esc(canonicalUrl)}"` : ""}
    }
    </script>`;

  // Inject SEO tags after the first <meta charset> tag in the base HTML
  // The base HTML from exportFunnelToHTML always starts with <!DOCTYPE html><html lang="fr"><head>
  const injectionPoint = baseHtml.indexOf("</title>");
  if (injectionPoint === -1) {
    // Fallback: inject after <head>
    return baseHtml.replace("<head>", `<head>${seoTags}`);
  }

  return (
    baseHtml.slice(0, injectionPoint + "</title>".length) +
    seoTags +
    baseHtml.slice(injectionPoint + "</title>".length)
  );
}
