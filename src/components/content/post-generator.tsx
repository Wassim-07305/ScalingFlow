"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { Sparkles, Copy, Check, Linkedin, Twitter, Instagram, Pencil, Send } from "lucide-react";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { UnipilePublishDialog } from "@/components/shared/unipile-publish-dialog";
import { GenerateButton } from "@/components/shared/generate-button";
import { toast } from "sonner";

const PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "twitter", label: "Twitter/X", icon: Twitter },
  { key: "instagram", label: "Instagram", icon: Instagram },
] as const;

const CONTENT_TONES = [
  { key: "expert", label: "Expert" },
  { key: "storytelling", label: "Storytelling" },
  { key: "inspirant", label: "Inspirant" },
  { key: "educatif", label: "Éducatif" },
  { key: "controverse", label: "Controversé" },
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
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishContent, setPublishContent] = React.useState("");

  // Form state
  const [topic, setTopic] = React.useState("");
  const [contentTone, setContentTone] = React.useState("expert");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          topic: topic || undefined,
          tone: contentTone,
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
    toast.success("Copié !");
  };

  const updatePost = (index: number, field: string, value: string) => {
    setPosts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading variant="immersive" text="Création de tes posts" className={className} />;
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Créer des posts {platform === "linkedin" ? "LinkedIn" : platform === "twitter" ? "Twitter/X" : "Instagram"}
            </CardTitle>
            <CardDescription>
              L&apos;IA génère des posts optimisés pour {platform === "linkedin" ? "LinkedIn" : platform === "twitter" ? "Twitter/X" : "Instagram"} en fonction de ton profil et de ton offre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Topic */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">
                Sujet ou thème <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: productivité, mindset entrepreneur, études de cas clients..."
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Tone */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Tonalité</label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TONES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setContentTone(t.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      contentTone === t.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <GenerateButton onClick={handleGenerate} className="w-full">
              Générer des posts {platform}
            </GenerateButton>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="blue">{posts.length} posts générés</Badge>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPosts([])}>
                Nouveau brief
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                Régénérer
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post, i) => {
              const isEditing = editingIndex === i;
              return (
                <GlowCard key={i} glowColor={i % 2 === 0 ? "blue" : "cyan"}>
                  <div className="flex items-center justify-between mb-3">
                    {post.type && <Badge variant="muted">{post.type}</Badge>}
                    <div className="flex items-center gap-1 ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isEditing) {
                            setEditingIndex(null);
                            toast.success("Modifications sauvegardées");
                          } else {
                            setEditingIndex(i);
                          }
                        }}
                      >
                        {isEditing ? (
                          <><Check className="h-3 w-3 mr-1" /> OK</>
                        ) : (
                          <><Pencil className="h-3 w-3 mr-1" /> Modifier</>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(post.content || post.text || JSON.stringify(post), i)}
                        className={cn(copiedIndex === i && "text-accent")}
                      >
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
                          setPublishContent(post.content || post.text || "");
                          setPublishDialogOpen(true);
                        }}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {post.title && !isEditing && (
                    <h4 className="font-medium text-text-primary text-sm mb-2">{post.title}</h4>
                  )}
                  {post.title && isEditing && (
                    <input
                      type="text"
                      value={post.title}
                      onChange={(e) => updatePost(i, "title", e.target.value)}
                      className="w-full mb-2 rounded-lg border border-border-default bg-bg-secondary px-2 py-1.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  )}
                  {isEditing ? (
                    <textarea
                      value={post.content || post.text || ""}
                      onChange={(e) => updatePost(i, post.content ? "content" : "text", e.target.value)}
                      className="w-full rounded-lg border border-border-default bg-bg-secondary px-2 py-1.5 text-sm text-text-secondary resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                      rows={6}
                    />
                  ) : (
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">
                      {post.content || post.text || ""}
                    </p>
                  )}
                  {post.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.hashtags.map((h: string, j: number) => (
                        <span key={j} className="text-xs text-info">{h}</span>
                      ))}
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
        </>
      )}
    </div>
  );
}
