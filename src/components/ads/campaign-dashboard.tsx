"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { TrendingUp, Eye, MousePointer, DollarSign } from "lucide-react";

const MOCK_CAMPAIGNS = [
  {
    id: 1,
    name: "Campagne Acquisition - Lead Magnet",
    status: "active",
    budget: 500,
    spent: 342,
    impressions: 45200,
    clicks: 1890,
    conversions: 67,
    ctr: 4.18,
    cpa: 5.1,
  },
  {
    id: 2,
    name: "Retargeting - VSL Viewers",
    status: "active",
    budget: 300,
    spent: 187,
    impressions: 12400,
    clicks: 890,
    conversions: 23,
    ctr: 7.18,
    cpa: 8.13,
  },
  {
    id: 3,
    name: "Lookalike - Clients existants",
    status: "paused",
    budget: 800,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpa: 0,
  },
];

interface CampaignDashboardProps {
  className?: string;
}

export function CampaignDashboard({ className }: CampaignDashboardProps) {
  const totalSpent = MOCK_CAMPAIGNS.reduce((s, c) => s + c.spent, 0);
  const totalConversions = MOCK_CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const totalClicks = MOCK_CAMPAIGNS.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = MOCK_CAMPAIGNS.reduce((s, c) => s + c.impressions, 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Dépensé", value: totalSpent, suffix: " €", icon: DollarSign, color: "text-accent" },
          { label: "Impressions", value: totalImpressions, icon: Eye, color: "text-info" },
          { label: "Clics", value: totalClicks, icon: MousePointer, color: "text-accent" },
          { label: "Conversions", value: totalConversions, icon: TrendingUp, color: "text-accent" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">{kpi.label}</p>
                  <p className={cn("text-2xl font-bold", kpi.color)}>
                    <AnimatedCounter value={kpi.value} />
                    {kpi.suffix || ""}
                  </p>
                </div>
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns list */}
      <Card>
        <CardHeader>
          <CardTitle>Campagnes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_CAMPAIGNS.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary border border-border-default"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={campaign.status === "active" ? "cyan" : "muted"}>
                    {campaign.status === "active" ? "Actif" : "Pause"}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{campaign.name}</p>
                    <p className="text-xs text-text-muted">
                      Budget: {campaign.budget}€ &middot; Dépensé: {campaign.spent}€
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-text-muted">CTR</p>
                    <p className="text-sm font-medium text-info">{campaign.ctr}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">CPA</p>
                    <p className="text-sm font-medium text-accent">{campaign.cpa}€</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Conv.</p>
                    <p className="text-sm font-medium text-accent">{campaign.conversions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
