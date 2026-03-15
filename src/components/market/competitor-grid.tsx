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
  Bot,
  Zap,
  Camera,
  Cpu,
  ExternalLink,
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

type DataSource = "apify_crawl" | "google_trends" | "web_scraping" | "ai_only";

interface TrendsDataItem {
  term: string;
  timelineData: { date: string; value: number }[];
  relatedQueries: string[];
}

interface ScreenshotItem {
  url: string;
  screenshotUrl: string;
}

interface TechStackItem {
  url: string;
  technologies: { name: string; category: string }[];
}

interface CompetitorGridProps {
  competitors: Competitor[];
  marketGaps?: string[];
  positioningOpportunities?: string[];
  recommendedDifferentiation?: string;
  industryBenchmarks?: IndustryBenchmarks;
  dataSource?: DataSource;
  scrapingUsed?: boolean;
  trendsData?: TrendsDataItem[];
  screenshots?: ScreenshotItem[];
  techStacks?: TechStackItem[];
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

        {/* Différenciation */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Target className="h-3 w-3 text-info" />
            Différenciation
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

const DATA_SOURCE_LABELS: Record<DataSource, { label: string; color: string; bgColor: string; borderColor: string }> = {
  apify_crawl: { label: "Apify Crawl", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  google_trends: { label: "Google Trends", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  web_scraping: { label: "Web Scraping", color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
  ai_only: { label: "Analyse IA", color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
};

export function CompetitorGrid({
  competitors,
  marketGaps,
  positioningOpportunities,
  recommendedDifferentiation,
  industryBenchmarks,
  dataSource = "ai_only",
  scrapingUsed = false,
  trendsData,
  screenshots,
  techStacks,
}: CompetitorGridProps) {
  const sourceConfig = DATA_SOURCE_LABELS[dataSource];

  return (
    <div className="space-y-6">
      {/* Data source badge */}
      <div className={`flex items-center gap-2 p-3 rounded-lg ${sourceConfig.bgColor} border ${sourceConfig.borderColor}`}>
        {scrapingUsed ? (
          <Zap className={`h-4 w-4 shrink-0 ${sourceConfig.color}`} />
        ) : (
          <Bot className={`h-4 w-4 shrink-0 ${sourceConfig.color}`} />
        )}
        <p className={`text-sm ${sourceConfig.color}`}>
          {scrapingUsed
            ? `Analyse enrichie via ${sourceConfig.label} — données réelles`
            : "Analyse basée sur l'intelligence artificielle"
          }
        </p>
        <Badge variant="default" className="ml-auto shrink-0 text-xs">
          {sourceConfig.label}
        </Badge>
      </div>

      {/* Google Trends data */}
      {trendsData && trendsData.length > 0 && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              Tendances Google Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendsData.map((trend, i) => {
                const avgValue = trend.timelineData.length > 0
                  ? Math.round(trend.timelineData.reduce((s, d) => s + d.value, 0) / trend.timelineData.length)
                  : 0;
                return (
                  <div key={i} className="p-3 rounded-lg bg-bg-tertiary border border-border-default">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-text-primary">{trend.term}</p>
                      <Badge variant={avgValue > 60 ? "default" : avgValue > 30 ? "blue" : "cyan"}>
                        Intérêt : {avgValue}/100
                      </Badge>
                    </div>
                    {trend.relatedQueries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {trend.relatedQueries.slice(0, 6).map((q, j) => (
                          <Badge key={j} variant="muted" className="text-xs">
                            {q}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Captures des sites concurrents */}
      {screenshots && screenshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-accent" />
              Captures des sites concurrents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenshots.map((s, i) => {
                let displayUrl = s.url;
                try {
                  displayUrl = new URL(s.url).hostname.replace("www.", "");
                } catch { /* keep original */ }

                return (
                  <a
                    key={i}
                    href={s.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-2xl border border-border-default overflow-hidden bg-bg-tertiary transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.screenshotUrl}
                        alt={`Capture de ${displayUrl}`}
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                        <ExternalLink className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-sm text-text-secondary truncate">{displayUrl}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stack technologique */}
      {techStacks && techStacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-accent" />
              Stack technologique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {techStacks.map((ts, i) => {
                let displayUrl = ts.url;
                try {
                  displayUrl = new URL(ts.url).hostname.replace("www.", "");
                } catch { /* keep original */ }

                // Group technologies by category
                const grouped = ts.technologies.reduce<Record<string, string[]>>((acc, tech) => {
                  const cat = tech.category || "Autre";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(tech.name);
                  return acc;
                }, {});

                return (
                  <div key={i} className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
                    <p className="text-sm font-medium text-text-primary mb-3">{displayUrl}</p>
                    <div className="space-y-3">
                      {Object.entries(grouped).map(([category, techs]) => (
                        <div key={category}>
                          <p className="text-xs text-text-secondary mb-1.5 uppercase tracking-wider">{category}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {techs.map((name, j) => (
                              <span
                                key={j}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Synthese strategique */}
      {(marketGaps || positioningOpportunities || recommendedDifferentiation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lacunes du marché */}
          {marketGaps && marketGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  Lacunes du marché
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

      {/* Différenciation recommandée */}
      {recommendedDifferentiation && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-accent" />
              Différenciation recommandée
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
