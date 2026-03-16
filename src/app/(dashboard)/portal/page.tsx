"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Loader2,
  BarChart3,
  Megaphone,
  FileText,
  Target,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  MousePointerClick,
  Percent,
} from "lucide-react";

interface PortalData {
  organization: {
    name: string;
    logo_url: string | null;
    primary_color: string;
    accent_color: string;
  };
  role: string;
  summary: {
    total_spend: number;
    total_leads: number;
    total_revenue: number;
    total_clients: number;
    active_funnels: number;
    total_assets: number;
    active_campaigns: number;
  };
  funnels: Array<{
    id: string;
    funnel_name: string;
    status: string;
    total_visits: number;
    total_optins: number;
    conversion_rate: number;
    created_at: string;
  }>;
  assets: Array<{
    id: string;
    asset_type: string;
    title: string;
    status: string;
    created_at: string;
  }>;
  campaigns: Array<{
    id: string;
    campaign_name: string;
    status: string;
    total_spend: number;
    total_clicks: number;
    total_conversions: number;
    roas: number;
    created_at: string;
  }>;
  content: Array<{
    id: string;
    content_type: string;
    title: string;
    scheduled_date: string | null;
    published: boolean;
  }>;
}

const ASSET_LABELS: Record<string, string> = {
  vsl_script: "Script VSL",
  email_sequence: "Séquence Email",
  sms_sequence: "Séquence SMS",
  sales_letter: "Lettre de vente",
  pitch_deck: "Pitch Deck",
  sales_script: "Script de vente",
  setting_script: "Script de setting",
  case_study: "Étude de cas",
  lead_magnet: "Lead Magnet",
  thankyou_video_script: "Script remerciement",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  instagram_post: "Post Instagram",
  instagram_reel: "Reel",
  instagram_story: "Story",
  instagram_carousel: "Carousel",
  youtube_video: "Vidéo YouTube",
  youtube_short: "YouTube Short",
  linkedin_post: "Post LinkedIn",
  tiktok_video: "TikTok",
  blog_post: "Article blog",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(val);
}

export default function PortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const res = await fetch("/api/integrations/whitelabel/portal");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || "Erreur lors du chargement");
          return;
        }
        const portalData = await res.json();
        setData(portalData);
      } catch {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };
    fetchPortal();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader
          title="Portail"
          description="Accède aux ressources de ton organisation."
        />
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">
              {error || "Tu ne fais pas partie d'une organisation."}
            </p>
            <p className="text-sm text-text-muted mt-2">
              Demande à ton coach/formateur de t&apos;inviter dans son
              organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { organization, summary, funnels, assets, campaigns, content } = data;

  return (
    <div>
      <PageHeader
        title={`Portail ${organization.name}`}
        description="Dashboard, funnels, assets et rapports de ton organisation."
      />

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          icon={DollarSign}
          label="Revenue (30j)"
          value={formatCurrency(summary.total_revenue)}
          color="text-emerald-400"
        />
        <StatCard
          icon={Users}
          label="Leads (30j)"
          value={String(summary.total_leads)}
          color="text-blue-400"
        />
        <StatCard
          icon={Target}
          label="Clients (30j)"
          value={String(summary.total_clients)}
          color="text-purple-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Dépenses Ads (30j)"
          value={formatCurrency(summary.total_spend)}
          color="text-orange-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Active Funnels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-accent" />
              Funnels actifs ({summary.active_funnels})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnels.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                Aucun funnel publié
              </p>
            ) : (
              <div className="space-y-3">
                {funnels.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {f.funnel_name}
                      </p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {f.total_visits} visites
                        </span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {f.total_optins} optins
                        </span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {(f.conversion_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={f.status === "published" ? "default" : "muted"}
                    >
                      {f.status === "published" ? "Actif" : f.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ad Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-accent" />
              Campagnes Ads ({summary.active_campaigns})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                Aucune campagne active
              </p>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {c.campaign_name}
                      </p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-text-muted">
                          {formatCurrency(c.total_spend)} dépensé
                        </span>
                        <span className="text-xs text-text-muted">
                          {c.total_conversions} conv.
                        </span>
                        <span className="text-xs text-text-muted">
                          ROAS {c.roas.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={c.status === "active" ? "default" : "yellow"}
                    >
                      {c.status === "active" ? "Actif" : "Pause"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Assets de vente ({summary.total_assets})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                Aucun asset validé
              </p>
            ) : (
              <div className="space-y-2">
                {assets.slice(0, 10).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        {ASSET_LABELS[a.asset_type] || a.asset_type}
                      </p>
                    </div>
                    <Badge variant={a.status === "active" ? "default" : "cyan"}>
                      {a.status === "active" ? "Actif" : "Validé"}
                    </Badge>
                  </div>
                ))}
                {assets.length > 10 && (
                  <p className="text-xs text-text-muted text-center pt-2">
                    + {assets.length - 10} autres assets
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Calendrier éditorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            {content.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                Aucun contenu planifié
              </p>
            ) : (
              <div className="space-y-2">
                {content.slice(0, 10).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-default"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {c.title}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs text-text-muted">
                          {CONTENT_TYPE_LABELS[c.content_type] ||
                            c.content_type}
                        </span>
                        {c.scheduled_date && (
                          <span className="text-xs text-text-muted">
                            {new Date(c.scheduled_date).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={c.published ? "default" : "muted"}>
                      {c.published ? "Publié" : "Planifié"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center shrink-0">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">
              {label}
            </p>
            <p className="text-lg font-bold text-text-primary">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
