"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Youtube,
  Image,
  FileText,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { YouTubeScriptResult } from "@/lib/ai/prompts/youtube-scripts";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { UnipilePublishDialog } from "@/components/shared/unipile-publish-dialog";
import { GenerateButton } from "@/components/shared/generate-button";

interface YouTubeGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function YouTubeGenerator({
  className,
  initialData,
}: YouTubeGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<YouTubeScriptResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [topic, setTopic] = React.useState("");
  const [showFullScript, setShowFullScript] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [usageLimited, setUsageLimited] = React.useState<{
    currentUsage: number;
    limit: number;
  } | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishContent, setPublishContent] = React.useState("");

  React.useEffect(() => {
    if (initialData) {
      setResult(initialData as YouTubeScriptResult);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Entre un sujet pour la video");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "youtube", topic }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          if (errData.usage) {
            setUsageLimited(errData.usage);
            return;
          }
        }
        throw new Error("Erreur lors de la génération");
      }
      const data = await response.json();
      setResult(data.result as YouTubeScriptResult);
      toast.success("Script YouTube généré !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copié !");
  };

  if (usageLimited) {
    return (
      <UpgradeWall
        currentUsage={usageLimited.currentUsage}
        limit={usageLimited.limit}
        className={className}
      />
    );
  }

  if (loading) {
    return (
      <AILoading
        variant="immersive"
        text="Génération du script YouTube"
        className={className}
      />
    );
  }

  if (!result) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="max-w-md mx-auto space-y-3">
          <div>
            <Label htmlFor="yt-topic">Sujet de la video</Label>
            <Input
              id="yt-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Comment automatiser sa prospection avec l'IA"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <GenerateButton
            onClick={handleGenerate}
            className="w-full"
            icon={<Youtube className="h-4 w-4 mr-2" />}
          >
            Générer le script YouTube
          </GenerateButton>
          <p className="text-sm text-text-secondary text-center">
            Script complet avec plan, thumbnail et description
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-danger" />
          <span className="text-sm font-medium text-text-primary">
            Script généré
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Nouveau sujet..."
            className="w-64"
          />
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            Régénérer
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Publier via Unipile"
            onClick={() => {
              const fullText = [
                result.titre,
                `\n${result.hook}`,
                (result.plan ?? [])
                  .map((s) => `${s.section} (${s.duree}): ${s.contenu}`)
                  .join("\n"),
                `\n${result.description_youtube}`,
                result.tags.join(", "),
              ].join("\n\n");
              setPublishContent(fullText);
              setPublishDialogOpen(true);
            }}
          >
            <Send className="h-3 w-3 mr-1" />
            Publier
          </Button>
        </div>
      </div>

      {/* Titre */}
      <GlowCard glowColor="orange">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-text-muted">Titre</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(result.titre, "titre")}
          >
            {copiedField === "titre" ? (
              <Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            {copiedField === "titre" ? "Copié !" : "Copier"}
          </Button>
        </div>
        <p className="text-lg font-semibold text-text-primary">
          {result.titre}
        </p>
      </GlowCard>

      {/* Hook */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-primary">
              Hook (30 premières secondes)
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(result.hook, "hook")}
            >
              {copiedField === "hook" ? (
                <Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copiedField === "hook" ? "Copié !" : "Copier"}
            </Button>
          </div>
          <p className="text-sm text-accent whitespace-pre-wrap">
            {result.hook}
          </p>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Plan de la video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(result.plan ?? []).map((section, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-lg bg-bg-tertiary">
                <Badge variant="muted" className="shrink-0">
                  {section.duree}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {section.section}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {section.contenu}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Script complet (expandable) */}
      <Card>
        <CardContent className="pt-5">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowFullScript(!showFullScript)}
          >
            <p className="text-sm font-medium text-text-primary">
              Script complet
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(result.script_complet, "script");
                }}
              >
                {copiedField === "script" ? (
                  <Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copiedField === "script" ? "Copié !" : "Copier"}
              </Button>
              {showFullScript ? (
                <ChevronUp className="h-4 w-4 text-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted" />
              )}
            </div>
          </button>
          {showFullScript && (
            <p className="text-sm text-text-secondary whitespace-pre-wrap mt-4">
              {result.script_complet}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Thumbnail */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">
              Concept de thumbnail
            </p>
          </div>
          <p className="text-sm text-text-secondary">
            {result.thumbnail_concept}
          </p>
        </CardContent>
      </Card>

      {/* Description + Tags */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-primary">
              Description YouTube
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(result.description_youtube, "desc")
              }
            >
              {copiedField === "desc" ? (
                <Check className="h-3 w-3 mr-1 animate-in zoom-in-50 duration-200" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copiedField === "desc" ? "Copié !" : "Copier"}
            </Button>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
            {result.description_youtube}
          </p>
          <div className="flex flex-wrap gap-1">
            {(result.tags ?? []).map((tag, i) => (
              <Badge key={i} variant="muted">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <UnipilePublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={publishContent}
      />
    </div>
  );
}
