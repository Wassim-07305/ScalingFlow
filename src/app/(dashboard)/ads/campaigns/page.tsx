"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CampaignDashboard } from "@/components/ads/campaign-dashboard";

export default function CampaignsPage() {
  return (
    <div>
      <PageHeader title="Campagnes" description="Gère tes campagnes Meta Ads." />
      <CampaignDashboard />
    </div>
  );
}
