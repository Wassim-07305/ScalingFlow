"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CampaignDashboard } from "@/components/ads/campaign-dashboard";
import { AudienceBuilder } from "@/components/ads/audience-builder";
import { CampaignLauncher } from "@/components/ads/campaign-launcher";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Megaphone, Users, Rocket } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div>
      <PageHeader
        title="Campagnes"
        description="Gère tes campagnes Meta Ads, configure tes audiences et lance des campagnes automatiquement."
      />

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Megaphone className="h-3.5 w-3.5" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="audiences" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Audiences
          </TabsTrigger>
          <TabsTrigger value="launch" className="gap-1.5">
            <Rocket className="h-3.5 w-3.5" />
            Lancer une campagne
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignDashboard />
        </TabsContent>

        <TabsContent value="audiences">
          <AudienceBuilder />
        </TabsContent>

        <TabsContent value="launch">
          <CampaignLauncher />
        </TabsContent>
      </Tabs>
    </div>
  );
}
