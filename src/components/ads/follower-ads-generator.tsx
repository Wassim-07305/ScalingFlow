"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GenerateButton } from "@/components/shared/generate-button";
import { Users, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FollowerAdsData {
  reels_ads?: Array<{
    hook: string;
    script: string;
    cta: string;
    angle: string;
    target_audience: string;
  }>;
  image_ads?: Array<{
    headline: string;
    body: string;
    visual_description: string;
    cta: string;
    angle: string;
  }>;
  carousel_ads?: Array<{
    title: string;
    slides: Array<{ slide_number: number; text: string; visual_note: string }>;
    final_cta: string;
    angle: string;
  }>;
  targeting_suggestions?: {
    interests: string[];
    lookalike_source: string;
    exclusions: string[];
    budget_daily: string;
    duration_test: string;
  };
}

interface Props {
  initialData?: FollowerAdsData;
}

const PLATFORMS = ["Instagram", "Facebook", "TikTok"] as const;
const OBJECTIVES = ["Abonnés", "Notoriété", "Engagement"] as const;

export function FollowerAdsGenerator({ initialData }: Props) {
  const [data, setData] = React.useState<FollowerAdsData | null>(
    initialData || null,
  );
  const [loading, setLoading] = React.useState(false);
  const [platform, setPlatform] = React.useState<string>("Instagram");
  const [objective, setObjective] = React.useState<string>("Abonnés");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetType: "follower_ads" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      const result = await res.json();
      const parsed = result.ai_raw_response || JSON.parse(result.content);
      setData(parsed);
      toast.success("Follower Ads générées !");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de la génération",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copié dans le presse-papiers");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <AILoading variant="immersive" text="Création de tes Follower Ads" />
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Follower Ads
            </CardTitle>
            <CardDescription>
              Génère des publicités pour attirer des abonnés qualifiés vers ton
              profil. Reels Ads, Image Ads et Carousel Ads optimisés pour le
              follow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Platform */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Plateforme
              </label>
              <p className="text-xs text-text-muted mb-2">
                La plateforme où tu veux gagner des abonnés
              </p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                      platform === p
                        ? "bg-accent text-white shadow-md shadow-accent/25"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Objective */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Objectif
              </label>
              <p className="text-xs text-text-muted mb-2">
                L&apos;objectif principal de cette campagne
              </p>
              <div className="flex flex-wrap gap-2">
                {OBJECTIVES.map((obj) => (
                  <button
                    key={obj}
                    onClick={() => setObjective(obj)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                      objective === obj
                        ? "bg-accent text-white shadow-md shadow-accent/25"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80",
                    )}
                  >
                    {obj}
                  </button>
                ))}
              </div>
            </div>

            <GenerateButton
              onClick={generate}
              className="w-full"
              icon={<Users className="h-4 w-4 mr-2" />}
            >
              Générer les Follower Ads
            </GenerateButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-text-primary">
          Follower Ads
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={generate}
            disabled={loading}
          >
            Régénérer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setData(null)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Nouveau brief
          </Button>
        </div>
      </div>

      {/* Reels Ads */}
      {data.reels_ads && data.reels_ads.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-accent">
              Reels Ads (15-30s)
            </h4>
            <Badge variant="purple" className="text-[10px]">
              {data.reels_ads.length} scripts
            </Badge>
          </div>
          <div className="space-y-3">
            {data.reels_ads.map((ad, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-default bg-bg-secondary hover:border-border-hover p-4 group transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-text-muted">
                        #{i + 1}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
                        Reel
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted">
                        {ad.angle}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      {ad.hook}
                    </p>
                    <p className="text-xs text-text-secondary whitespace-pre-wrap">
                      {ad.script}
                    </p>
                    <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mt-2 inline-block">
                      <p className="text-xs text-accent font-medium">
                        {ad.cta}
                      </p>
                    </div>
                    <p className="text-[10px] text-text-muted mt-2">
                      Audience : {ad.target_audience}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      copyText(
                        `Hook: ${ad.hook}\n\nScript:\n${ad.script}\n\nCTA: ${ad.cta}`,
                        `reel-${i}`,
                      )
                    }
                    className={cn(
                      "opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-bg-tertiary transition-all",
                      copiedKey === `reel-${i}` && "opacity-100",
                    )}
                    title="Copier"
                  >
                    {copiedKey === `reel-${i}` ? (
                      <Check className="h-3.5 w-3.5 text-accent animate-in zoom-in-50 duration-200" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-text-muted" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Image Ads */}
      {data.image_ads && data.image_ads.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-accent">Image Ads</h4>
            <Badge variant="blue" className="text-[10px]">
              {data.image_ads.length} visuels
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {data.image_ads.map((ad, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-default bg-bg-secondary hover:border-border-hover p-4 group transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted">
                      #{i + 1}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                      {ad.angle}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyText(
                        `${ad.headline}\n\n${ad.body}\n\nCTA: ${ad.cta}`,
                        `img-${i}`,
                      )
                    }
                    className={cn(
                      "opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-bg-tertiary transition-all",
                      copiedKey === `img-${i}` && "opacity-100",
                    )}
                    title="Copier"
                  >
                    {copiedKey === `img-${i}` ? (
                      <Check className="h-3 w-3 text-accent animate-in zoom-in-50 duration-200" />
                    ) : (
                      <Copy className="h-3 w-3 text-text-muted" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {ad.headline}
                </p>
                <p className="text-xs text-text-secondary mt-1">{ad.body}</p>
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mt-2">
                  <p className="text-xs text-accent font-medium text-center">
                    {ad.cta}
                  </p>
                </div>
                <p className="text-[10px] text-text-muted mt-2 italic">
                  {ad.visual_description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Carousel Ads */}
      {data.carousel_ads && data.carousel_ads.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-accent">Carousel Ads</h4>
            <Badge variant="cyan" className="text-[10px]">
              {data.carousel_ads.length} carousels
            </Badge>
          </div>
          {data.carousel_ads.map((carousel, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-default bg-bg-secondary hover:border-border-hover p-4 mb-3 transition-all duration-200"
            >
              <p className="text-sm font-semibold text-text-primary mb-2">
                {carousel.title}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {carousel.slides.map((slide) => (
                  <div
                    key={slide.slide_number}
                    className="min-w-[140px] rounded-xl bg-bg-tertiary border border-border-default p-3 flex-shrink-0"
                  >
                    <span className="text-[10px] text-accent font-medium">
                      Slide {slide.slide_number}
                    </span>
                    <p className="text-xs text-text-primary mt-1">
                      {slide.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mt-2 inline-block">
                <p className="text-xs text-accent font-medium">
                  {carousel.final_cta}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Targeting */}
      {data.targeting_suggestions && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">
            Ciblage recommandé
          </h4>
          <div className="rounded-xl border border-border-default bg-bg-secondary p-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs text-text-muted mb-1 font-medium">
                Intérêts
              </p>
              <div className="flex flex-wrap gap-1">
                {data.targeting_suggestions.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1 font-medium">
                Lookalike
              </p>
              <p className="text-xs text-text-primary">
                {data.targeting_suggestions.lookalike_source}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1 font-medium">
                Budget / jour
              </p>
              <p className="text-xs text-text-primary font-semibold">
                {data.targeting_suggestions.budget_daily}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1 font-medium">
                Durée test
              </p>
              <p className="text-xs text-text-primary">
                {data.targeting_suggestions.duration_test}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
