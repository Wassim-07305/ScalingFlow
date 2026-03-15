import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { generateFunnelPageHTML } from "@/lib/utils/export-html";
import { getMetaPixelConfig } from "@/lib/tracking/meta-capi";
import type { BrandTheme } from "@/lib/utils/export-html";
import type { Metadata } from "next";
import Script from "next/script";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: funnel } = await supabase
    .from("funnels")
    .select("funnel_name, optin_page")
    .eq("published_slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!funnel) return { title: "Page introuvable" };

  const optin = funnel.optin_page as Record<string, string> | null;

  return {
    title: funnel.funnel_name || "Funnel",
    description: optin?.subheadline || optin?.headline || "",
    openGraph: {
      title: funnel.funnel_name || "Funnel",
      description: optin?.subheadline || "",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PublicFunnelPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const supabase = await createClient();

  const { data: funnel } = await supabase
    .from("funnels")
    .select("*")
    .eq("published_slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!funnel) {
    notFound();
  }

  // Get brand info for the funnel owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, niche")
    .eq("id", funnel.user_id)
    .maybeSingle();

  // Get brand identity for theming
  const { data: brand } = await supabase
    .from("brand_identities")
    .select("brand_kit")
    .eq("user_id", funnel.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch the user's Meta pixel config
  const pixelConfig = await getMetaPixelConfig(supabase, funnel.user_id);

  // Build theme from brand identity
  const theme: BrandTheme = {};
  if (brand?.brand_kit && typeof brand.brand_kit === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kit = brand.brand_kit as any;
    if (Array.isArray(kit.colors) && kit.colors.length > 0) {
      theme.accentColor = kit.colors[0];
      if (kit.colors[1]) theme.bgColor = kit.colors[1];
      if (kit.colors[2]) theme.bgCard = kit.colors[2];
    }
    if (kit.font_heading) theme.fontHeading = kit.font_heading;
    if (kit.font_body) theme.fontBody = kit.font_body;
    if (kit.logo_url) theme.logoUrl = kit.logo_url;
  }

  const funnelData = funnel.ai_raw_response || {
    optin_page: funnel.optin_page,
    vsl_page: funnel.vsl_page,
    thankyou_page: funnel.thankyou_page,
  };

  const brandName = funnel.funnel_name || profile?.first_name || "Mon Offre";

  // Determine which page to show (default: optin)
  const pageType = (pageParam === "vsl" || pageParam === "thankyou") ? pageParam : "optin";

  const html = generateFunnelPageHTML(
    funnelData,
    pageType,
    { brandName, theme }
  );

  return (
    <>
      {/* Meta Pixel injection */}
      {pixelConfig && (
        <>
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelConfig.pixelId}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixelConfig.pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      <div
        className="min-h-screen"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
