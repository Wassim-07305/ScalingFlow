"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, Linkedin, Twitter, Instagram } from "lucide-react";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

const PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "twitter", label: "Twitter/X", icon: Twitter },
  { key: "instagram", label: "Instagram", icon: Instagram },
] as const;

interface PostGeneratorProps {
  className?: string;
}

export function PostGenerator({ className }: PostGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [posts, setPosts] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [platform, setPlatform] = React.useState("linkedin");
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) { setUsageLimited(errData.usage); return; }
        }
        throw new Error("Erreur lors de la generation");
      }
      const data = await response.json();
      const raw = data.ai_raw_response || data;
      setPosts(raw.posts || raw.ideas || [raw]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Création de tes posts" className={className} />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Platform selector */}
      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              platform === p.key
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            <p.icon className="h-4 w-4" />
            {p.label}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Button size="lg" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer des posts {platform}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="blue">{posts.length} posts générés</Badge>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              Régénérer
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post, i) => (
              <GlowCard key={i} glowColor={i % 2 === 0 ? "blue" : "cyan"}>
                <div className="flex items-center justify-between mb-3">
                  {post.type && <Badge variant="muted">{post.type}</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(post.content || post.text || JSON.stringify(post), i)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedIndex === i ? "Copié !" : "Copier"}
                  </Button>
                </div>
                {post.title && (
                  <h4 className="font-medium text-text-primary text-sm mb-2">{post.title}</h4>
                )}
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {post.content || post.text || ""}
                </p>
                {post.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.hashtags.map((h: string, j: number) => (
                      <span key={j} className="text-xs text-info">{h}</span>
                    ))}
                  </div>
                )}
              </GlowCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
