"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Copy, Check, Eye, MessageCircle, GraduationCap, Megaphone, Heart, BookOpen, Send } from "lucide-react";
import { toast } from "sonner";
import type { StoriesResult } from "@/lib/ai/prompts/stories-scripts";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { UnipilePublishDialog } from "@/components/shared/unipile-publish-dialog";
import { GenerateButton } from "@/components/shared/generate-button";

const STORY_THEMES = [
  { key: "educatif", label: "Éducatif" },
  { key: "coulisses", label: "Coulisses" },
  { key: "temoignage", label: "Témoignage" },
  { key: "engagement", label: "Engagement" },
  { key: "promotionnel", label: "Promotionnel" },
] as const;

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
    label: "Témoignage",
    icon: MessageCircle,
    badge: "default" as const,
  },
  education: {
    label: "Éducation",
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
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishContent, setPublishContent] = React.useState("");

  // Form state
  const [storyTheme, setStoryTheme] = React.useState("educatif");
  const [topic, setTopic] = React.useState("");
  const [showForm, setShowForm] = React.useState(true);

  React.useEffect(() => {
    if (initialData) {
      const result = initialData as StoriesResult;
      setStories(result.stories || []);
      setShowForm(false);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "stories",
          storyTheme,
          topic: topic || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      const result = data.result as StoriesResult;
      setStories(result.stories || []);
      setShowForm(false);
      toast.success("Stories générées !");
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
    toast.success("Copié !");
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading variant="immersive" text="Génération des stories" className={className} />;
  }

  if (stories.length === 0 || showForm) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Paramètres Stories
            </CardTitle>
            <CardDescription>
              Configurez le thème et le sujet pour générer des séries de stories engageantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Story theme */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Thème de la story</label>
              <div className="flex flex-wrap gap-2">
                {STORY_THEMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setStoryTheme(t.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      storyTheme === t.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Sujet précis <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: lancement produit, journée type, avant/après client..."
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <GenerateButton onClick={handleGenerate} className="w-full" icon={<BookOpen className="h-4 w-4 mr-2" />}>
              Générer 5 séries de Stories
            </GenerateButton>
            <p className="text-xs text-text-muted text-center">
              5 types : Coulisses, Témoignage, Éducation, CTA, Engagement
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Badge variant="default">{stories.length} séries de stories</Badge>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            Nouveau brief
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            Régénérer
          </Button>
        </div>
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
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyStory(story, i)} className={cn(copiedIndex === i && "text-accent")}>
                    {copiedIndex === i ? (
                      <><Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" /> Copié !</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" /> Copier</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Publier via Unipile"
                    onClick={() => {
                      const text = story.slides
                        .map((s, j) => `Slide ${j + 1}:\n${s.text}`)
                        .join("\n\n");
                      setPublishContent(text);
                      setPublishDialogOpen(true);
                    }}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
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

      <UnipilePublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={publishContent}
      />
    </div>
  );
}
