"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import {
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Loader2,
  Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface AdCampaign {
  id: string;
  campaign_name: string;
  status: "draft" | "active" | "paused" | "completed";
  daily_budget: number | null;
  total_budget: number | null;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  roas: number;
}

function getStatusLabel(status: AdCampaign["status"]): string {
  switch (status) {
    case "active":
      return "Actif";
    case "paused":
      return "Pause";
    case "draft":
      return "Brouillon";
    case "completed":
      return "Terminé";
  }
}

function getStatusVariant(
  status: AdCampaign["status"],
): "cyan" | "muted" | "yellow" | "default" {
  switch (status) {
    case "active":
      return "cyan";
    case "paused":
      return "muted";
    case "draft":
      return "yellow";
    case "completed":
      return "default";
  }
}

interface CampaignDashboardProps {
  className?: string;
}

export function CampaignDashboard({ className }: CampaignDashboardProps) {
  const { user, loading: userLoading } = useUser();
  const [campaigns, setCampaigns] = React.useState<AdCampaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCampaigns = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Impossible de charger les campagnes");
        setLoading(false);
        return;
      }

      setCampaigns(data ?? []);
      setLoading(false);
    };

    fetchCampaigns();
  }, [user, userLoading, supabase]);

  const totalSpent = campaigns.reduce((s, c) => s + c.total_spend, 0);
  const totalConversions = campaigns.reduce(
    (s, c) => s + c.total_conversions,
    0,
  );
  const totalClicks = campaigns.reduce((s, c) => s + c.total_clicks, 0);
  const totalImpressions = campaigns.reduce(
    (s, c) => s + c.total_impressions,
    0,
  );

  if (loading || userLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-text-muted/40 mb-4" />
              <p className="text-sm text-text-muted">
                Aucune campagne publicitaire. Crée tes premières publicités pour
                voir tes campagnes ici.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Dépense",
            value: totalSpent,
            suffix: " €",
            icon: DollarSign,
            color: "text-accent",
          },
          {
            label: "Impressions",
            value: totalImpressions,
            icon: Eye,
            color: "text-info",
          },
          {
            label: "Clics",
            value: totalClicks,
            icon: MousePointer,
            color: "text-accent",
          },
          {
            label: "Conversions",
            value: totalConversions,
            icon: TrendingUp,
            color: "text-accent",
          },
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
            {campaigns.map((campaign) => {
              const budget =
                campaign.total_budget ?? campaign.daily_budget ?? 0;
              const ctr =
                campaign.total_clicks > 0 && campaign.total_impressions > 0
                  ? (campaign.total_clicks / campaign.total_impressions) * 100
                  : 0;
              const cpa =
                campaign.total_conversions > 0
                  ? campaign.total_spend / campaign.total_conversions
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary border border-border-default"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusVariant(campaign.status)}>
                      {getStatusLabel(campaign.status)}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {campaign.campaign_name}
                      </p>
                      <p className="text-xs text-text-muted">
                        Budget: {budget}€ &middot; Dépense:{" "}
                        {campaign.total_spend}€
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-text-muted">CTR</p>
                      <p className="text-sm font-medium text-info">
                        {ctr.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">CPA</p>
                      <p className="text-sm font-medium text-accent">
                        {cpa.toFixed(2)}€
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Conv.</p>
                      <p className="text-sm font-medium text-accent">
                        {campaign.total_conversions}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
