"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Copy } from "lucide-react";
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

export function FollowerAdsGenerator({ initialData }: Props) {
  const [data, setData] = React.useState<FollowerAdsData | null>(initialData || null);
  const [loading, setLoading] = React.useState(false);

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
      toast.success("Follower Ads generees !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la generation");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié !");
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Users className="h-12 w-12 text-text-muted" />
        <p className="text-text-secondary text-sm text-center max-w-md">
          Genere des publicites pour attirer des abonnes qualifies vers ton profil (Social Funnel). Reels Ads, Image Ads et Carousel Ads optimises pour le follow.
        </p>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
          Generer les Follower Ads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Follower Ads</h3>
        <Button size="sm" onClick={generate} disabled={loading}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
          Regenerer
        </Button>
      </div>

      {/* Reels Ads */}
      {data.reels_ads && data.reels_ads.length > 0 && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">Reels Ads (15-30s)</h4>
          <div className="space-y-3">
            {data.reels_ads.map((ad, i) => (
              <div key={i} className="rounded-xl border border-border-default bg-bg-tertiary p-4 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">Reel #{i + 1}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-primary text-text-muted">{ad.angle}</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary mb-1">🎬 {ad.hook}</p>
                    <p className="text-xs text-text-secondary whitespace-pre-wrap">{ad.script}</p>
                    <p className="text-xs text-accent mt-2 font-medium">{ad.cta}</p>
                    <p className="text-[10px] text-text-muted mt-1">Audience : {ad.target_audience}</p>
                  </div>
                  <button
                    onClick={() => copyText(`Hook: ${ad.hook}\n\nScript:\n${ad.script}\n\nCTA: ${ad.cta}`)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-bg-primary transition-all"
                  >
                    <Copy className="h-3.5 w-3.5 text-text-muted" />
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
          <h4 className="text-sm font-medium text-accent mb-3">Image Ads</h4>
          <div className="grid gap-3 md:grid-cols-3">
            {data.image_ads.map((ad, i) => (
              <div key={i} className="rounded-xl border border-border-default bg-bg-tertiary p-4 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">{ad.angle}</span>
                  <button
                    onClick={() => copyText(`${ad.headline}\n\n${ad.body}\n\nCTA: ${ad.cta}`)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-bg-primary transition-all"
                  >
                    <Copy className="h-3 w-3 text-text-muted" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-text-primary">{ad.headline}</p>
                <p className="text-xs text-text-secondary mt-1">{ad.body}</p>
                <p className="text-xs text-accent mt-2">{ad.cta}</p>
                <p className="text-[10px] text-text-muted mt-2 italic">{ad.visual_description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Carousel Ads */}
      {data.carousel_ads && data.carousel_ads.length > 0 && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">Carousel Ads</h4>
          {data.carousel_ads.map((carousel, i) => (
            <div key={i} className="rounded-xl border border-border-default bg-bg-tertiary p-4 mb-3">
              <p className="text-sm font-semibold text-text-primary mb-2">{carousel.title}</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {carousel.slides.map((slide) => (
                  <div key={slide.slide_number} className="min-w-[140px] rounded-lg bg-bg-primary border border-border-default p-3">
                    <span className="text-[10px] text-accent font-medium">Slide {slide.slide_number}</span>
                    <p className="text-xs text-text-primary mt-1">{slide.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-accent mt-2 font-medium">{carousel.final_cta}</p>
            </div>
          ))}
        </section>
      )}

      {/* Targeting */}
      {data.targeting_suggestions && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">Ciblage recommande</h4>
          <div className="rounded-xl border border-border-default bg-bg-tertiary p-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs text-text-muted mb-1">Interets</p>
              <div className="flex flex-wrap gap-1">
                {data.targeting_suggestions.interests.map((i, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{i}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Lookalike</p>
              <p className="text-xs text-text-primary">{data.targeting_suggestions.lookalike_source}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Budget / jour</p>
              <p className="text-xs text-text-primary">{data.targeting_suggestions.budget_daily}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Duree test</p>
              <p className="text-xs text-text-primary">{data.targeting_suggestions.duration_test}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
