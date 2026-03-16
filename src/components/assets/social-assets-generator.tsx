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
import { Loader2, Share2, Download, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { UnipilePublishDialog } from "@/components/shared/unipile-publish-dialog";

interface SocialAssetsData {
  testimonial_cards?: Array<{
    title: string;
    quote: string;
    client_name: string;
    client_role: string;
    metric: string;
    format: string;
    design_notes: string;
  }>;
  social_banners?: Array<{
    platform: string;
    type: string;
    headline: string;
    subline: string;
    cta: string;
    dimensions: string;
    design_notes: string;
  }>;
  highlight_covers?: Array<{
    name: string;
    icon_description: string;
    color: string;
  }>;
  email_signature?: {
    name: string;
    title: string;
    tagline: string;
    cta_text: string;
    cta_url: string;
  };
  social_proof_badges?: Array<{
    text: string;
    style: string;
    usage: string;
  }>;
}

interface Props {
  initialData?: SocialAssetsData;
}

const ASSET_TYPES = ["Bannières", "Posts", "Bio", "Couvertures"] as const;

export function SocialAssetsGenerator({ initialData }: Props) {
  const [data, setData] = React.useState<SocialAssetsData | null>(
    initialData || null,
  );
  const [loading, setLoading] = React.useState(false);
  const [assetType, setAssetType] = React.useState<string>("Bannières");
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishContent, setPublishContent] = React.useState("");

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetType: "social_assets",
          selectedAssetType: assetType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      const result = await res.json();
      const parsed = result.ai_raw_response || JSON.parse(result.content);
      setData(parsed);
      toast.success("Social assets générés !");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de la génération",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success("Copié dans le presse-papier");
  };

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Assets
            </CardTitle>
            <CardDescription>
              Génère des assets visuels pour tes réseaux sociaux : cartes
              témoignage, bannières, highlights, signature email et badges de
              preuve sociale.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Asset type */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Type d&apos;asset
              </label>
              <div className="flex flex-wrap gap-2">
                {ASSET_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setAssetType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      assetType === type
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Générer les social assets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Social Assets
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyAll}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Copier tout
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPublishContent(JSON.stringify(data, null, 2));
              setPublishDialogOpen(true);
            }}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Publier via Unipile
          </Button>
          <Button size="sm" onClick={generate} disabled={loading}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Régénérer
          </Button>
          <Button size="sm" variant="outline" onClick={() => setData(null)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Nouveau brief
          </Button>
        </div>
      </div>

      {/* Cartes témoignage */}
      {data.testimonial_cards && data.testimonial_cards.length > 0 && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">
            Cartes Témoignage
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            {data.testimonial_cards.map((card, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-default bg-bg-tertiary p-4 space-y-2"
              >
                <p className="text-xs font-medium text-accent">{card.metric}</p>
                <p className="text-sm text-text-primary italic">
                  &ldquo;{card.quote}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    {card.client_name} — {card.client_role}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {card.format}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bannières */}
      {data.social_banners && data.social_banners.length > 0 && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">
            Bannières Sociales
          </h4>
          <div className="space-y-3">
            {data.social_banners.map((banner, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-default bg-bg-tertiary p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {banner.platform}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {banner.type} — {banner.dimensions}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {banner.headline}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {banner.subline}
                </p>
                <p className="text-xs text-accent mt-1">{banner.cta}</p>
                <p className="text-[10px] text-text-muted mt-2 italic">
                  {banner.design_notes}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Highlight covers */}
      {data.highlight_covers && data.highlight_covers.length > 0 && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">
            Highlight Covers
          </h4>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.highlight_covers.map((h, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 min-w-[80px]"
              >
                <div className="h-14 w-14 rounded-full border-2 border-accent/30 flex items-center justify-center text-[10px] text-text-muted text-center p-1">
                  {h.icon_description}
                </div>
                <span className="text-xs text-text-primary font-medium">
                  {h.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Signature email */}
      {data.email_signature && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">
            Signature Email
          </h4>
          <div className="rounded-xl border border-border-default bg-bg-tertiary p-4 max-w-md">
            <p className="text-sm font-semibold text-text-primary">
              {data.email_signature.name}
            </p>
            <p className="text-xs text-text-secondary">
              {data.email_signature.title}
            </p>
            <p className="text-xs text-accent mt-1 italic">
              {data.email_signature.tagline}
            </p>
            <p className="text-xs text-text-muted mt-2">
              {data.email_signature.cta_text}
            </p>
          </div>
        </section>
      )}

      {/* Badges */}
      {data.social_proof_badges && data.social_proof_badges.length > 0 && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">
            Badges Preuve Sociale
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.social_proof_badges.map((badge, i) => (
              <div
                key={i}
                className="px-3 py-2 rounded-lg border border-accent/20 bg-accent/5"
              >
                <p className="text-xs font-medium text-accent">{badge.text}</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {badge.usage}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <UnipilePublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={publishContent}
      />
    </div>
  );
}
