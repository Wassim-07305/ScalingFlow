"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, Eye, MessageCircle, GraduationCap, Megaphone, Heart } from "lucide-react";
import { toast } from "sonner";
import type { StoriesResult } from "@/lib/ai/prompts/stories-scripts";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface StoriesGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const TYPE_CONFIG = {
  behind_the_scenes: {
    label: "Behind the scenes",
    icon: Eye,
    badge: "purple" as const,
  },
  temoignage: {
    label: "Temoignage",
    icon: MessageCircle,
    badge: "default" as const,
  },
  education: {
    label: "Education",
    icon: GraduationCap,
    badge: "blue" as const,
  },
  cta: {
    label: "Call-to-Action",
    icon: Megaphone,
    badge: "yellow" as const,
  },
  engagement: {
    label: "Engagement",
    icon: Heart,
    badge: "cyan" as const,
  },
};

export function StoriesGenerator({ className, initialData }: StoriesGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [stories, setStories] = React.useState<StoriesResult["stories"]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  React.useEffect(() => {
    if (initialData) {
      const result = initialData as StoriesResult;
      setStories(result.stories || []);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "stories" }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
      }
      const data = await response.json();
      const result = data.result as StoriesResult;
      setStories(result.stories || []);
      toast.success("Stories generees !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyStory = (story: StoriesResult["stories"][number], index: number) => {
    const text = story.slides
      .map((s, i) => `Slide ${i + 1}:\n${s.text}\n[Visual: ${s.visual_direction}]`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Copie !");
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Generation des stories" className={className} />;
  }

  if (stories.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generer 5 series de Stories
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          5 types : Coulisses, Temoignage, Education, CTA, Engagement
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Badge variant="default">{stories.length} series de stories</Badge>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          Regenerer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story, i) => {
          const config = TYPE_CONFIG[story.type] || TYPE_CONFIG.engagement;
          const Icon = config.icon;

          return (
            <GlowCard key={i} glowColor={i % 2 === 0 ? "purple" : "cyan"}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-text-muted" />
                  <Badge variant={config.badge}>{config.label}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyStory(story, i)}>
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedIndex === i ? "Copie !" : "Copier"}
                </Button>
              </div>

              {/* Slides */}
              <div className="space-y-3">
                {story.slides.map((slide, j) => (
                  <div
                    key={j}
                    className="p-3 rounded-lg bg-bg-tertiary border border-border-default"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        Slide {j + 1}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-primary">{slide.text}</p>
                    <p className="text-xs text-text-muted mt-1 italic">
                      {slide.visual_direction}
                    </p>
                  </div>
                ))}
              </div>

              {/* Stickers */}
              {story.sticker_suggestions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border-default">
                  <p className="text-xs text-text-muted mb-2">Suggestions de stickers</p>
                  <div className="space-y-1">
                    {story.sticker_suggestions.map((sticker, j) => (
                      <p key={j} className="text-xs text-info">
                        {sticker}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
