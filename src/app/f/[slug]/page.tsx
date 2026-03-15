import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { exportFunnelToHTML } from "@/lib/utils/export-html";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
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
    description: optin?.subheadline || "",
  };
}

export default async function PublicFunnelPage({ params }: Props) {
  const { slug } = await params;
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

  const funnelData = funnel.ai_raw_response || {
    optin_page: funnel.optin_page,
    vsl_page: funnel.vsl_page,
    thankyou_page: funnel.thankyou_page,
  };

  const html = exportFunnelToHTML(
    funnelData,
    funnel.funnel_name || profile?.first_name || "Mon Offre"
  );

  return (
    <div
      className="min-h-screen"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
