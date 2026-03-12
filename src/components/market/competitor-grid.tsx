"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  Lightbulb,
  Target,
  DollarSign,
  Megaphone,
  TrendingUp,
  BarChart3,
  Globe,
} from "lucide-react";

interface AdInsight {
  platform: string;
  ad_formats: string[];
  estimated_monthly_spend: string;
  main_hooks: string[];
  cta_patterns: string[];
  landing_page_type: string;
}

interface ContentInsight {
  platform: string;
  posting_frequency: string;
  top_content_types: string[];
  engagement_level: string;
  audience_size_estimate: string;
}

interface Competitor {
  name: string;
  positioning: string;
  pricing_estimate: string;
  strengths: string[];
  weaknesses: string[];
  differentiation: string;
  ad_insights?: AdInsight[];
  content_insights?: ContentInsight[];
  funnel_type?: string;
  estimated_revenue_range?: string;
}

interface IndustryBenchmarks {
  avg_cpa: string;
  avg_ctr: string;
  avg_conversion_rate: string;
  dominant_ad_platform: string;
  dominant_content_platform: string;
}

interface CompetitorGridProps {
  competitors: Competitor[];
  marketGaps?: string[];
  positioningOpportunities?: string[];
  recommendedDifferentiation?: string;
  industryBenchmarks?: IndustryBenchmarks;
}

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{competitor.name}</span>
          <Badge variant="muted" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {competitor.pricing_estimate}
          </Badge>
        </CardTitle>
        <p className="text-sm text-text-secondary">{competitor.positioning}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Forces */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-accent" />
            Forces
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {competitor.strengths.map((s, i) => (
              <Badge key={i} variant="default" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Faiblesses */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-warning" />
            Faiblesses
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {competitor.weaknesses.map((w, i) => (
              <Badge key={i} variant="yellow" className="text-xs">
                {w}
              </Badge>
            ))}
          </div>
        </div>

        {/* Differenciation */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Target className="h-3 w-3 text-info" />
            Differenciation
          </h4>
          <p className="text-sm text-text-secondary">{competitor.differentiation}</p>
        </div>

        {/* Funnel & Revenue */}
        {(competitor.funnel_type || competitor.estimated_revenue_range) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {competitor.funnel_type && (
              <Badge variant="blue" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                {competitor.funnel_type}
              </Badge>
            )}
            {competitor.estimated_revenue_range && (
              <Badge variant="cyan" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {competitor.estimated_revenue_range}
              </Badge>
            )}
          </div>
        )}

        {/* Ad Insights */}
        {competitor.ad_insights && competitor.ad_insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="h-3 w-3 text-blue-400" />
              Insights Publicitaires
            </h4>
            <div className="space-y-2">
              {competitor.ad_insights.map((ad, i) => (
                <div key={i} className="bg-bg-tertiary/50 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="blue" className="text-xs">{ad.platform}</Badge>
                    <span className="text-xs text-text-muted">{ad.estimated_monthly_spend}</span>
                  </div>
                  {ad.main_hooks.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ad.main_hooks.map((h, j) => (
                        <span key={j} className="text-xs text-text-secondary bg-bg-secondary px-1.5 py-0.5 rounded">{h}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-text-muted">
                    CTA : {ad.cta_patterns.join(", ")} | LP : {ad.landing_page_type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Insights */}
        {competitor.content_insights && competitor.content_insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-accent" />
              Insights Contenu Organique
            </h4>
            <div className="space-y-2">
              {competitor.content_insights.map((c, i) => (
                <div key={i} className="bg-bg-tertiary/50 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-xs">{c.platform}</Badge>
                    <span className="text-xs text-text-muted">{c.audience_size_estimate}</span>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {c.posting_frequency} | Engagement : {c.engagement_level}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.top_content_types.map((t, j) => (
                      <span key={j} className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CompetitorGrid({
  competitors,
  marketGaps,
  positioningOpportunities,
  recommendedDifferentiation,
  industryBenchmarks,
}: CompetitorGridProps) {
  return (
    <div className="space-y-6">
      {/* Industry Benchmarks */}
      {industryBenchmarks && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Benchmarks du secteur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center">
                <p className="text-xs text-text-muted">CPA moyen</p>
                <p className="text-sm font-semibold text-text-primary">{industryBenchmarks.avg_cpa}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted">CTR moyen</p>
                <p className="text-sm font-semibold text-text-primary">{industryBenchmarks.avg_ctr}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted">Taux conversion</p>
                <p className="text-sm font-semibold text-text-primary">{industryBenchmarks.avg_conversion_rate}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted">Ads dominant</p>
                <p className="text-sm font-semibold text-text-primary">{industryBenchmarks.dominant_ad_platform}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted">Contenu dominant</p>
                <p className="text-sm font-semibold text-text-primary">{industryBenchmarks.dominant_content_platform}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grille des concurrents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {competitors.map((competitor, i) => (
          <CompetitorCard key={i} competitor={competitor} />
        ))}
      </div>

      {/* Synthese strategique */}
      {(marketGaps || positioningOpportunities || recommendedDifferentiation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lacunes du marche */}
          {marketGaps && marketGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  Lacunes du marche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {marketGaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-warning mt-0.5">-</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Opportunites de positionnement */}
          {positioningOpportunities && positioningOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-accent" />
                  Opportunites de positionnement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {positioningOpportunities.map((opp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-accent mt-0.5">-</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Differenciation recommandee */}
      {recommendedDifferentiation && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-accent" />
              Differenciation recommandee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary leading-relaxed">
              {recommendedDifferentiation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
