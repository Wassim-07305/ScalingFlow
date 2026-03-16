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
import { MessageCircle, Copy, Check, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { UnipileSendDialog } from "@/components/shared/unipile-send-dialog";

interface DmRetargetingData {
  dm_ads?: Array<{
    type: string;
    hook: string;
    body: string;
    cta: string;
    dm_keyword: string;
    visual_description: string;
    angle: string;
    audience_segment: string;
  }>;
  dm_automation?: {
    welcome_message: string;
    qualification_questions: string[];
    booking_message: string;
    no_show_followup: string;
  };
  audiences?: Array<{
    name: string;
    source: string;
    size_estimate: string;
    priority: string;
  }>;
  campaign_setup?: {
    objective: string;
    budget_daily: string;
    placements: string[];
    schedule: string;
    kpi_targets: {
      cost_per_dm: string;
      dm_to_call_rate: string;
      roas_target: string;
    };
  };
}

interface Props {
  initialData?: DmRetargetingData;
}

const RETARGETING_TYPES = [
  "Visiteurs site",
  "Engagés",
  "Abandons panier",
  "Anciens clients",
] as const;

export function DmRetargetingGenerator({ initialData }: Props) {
  const [data, setData] = React.useState<DmRetargetingData | null>(
    initialData || null,
  );
  const [loading, setLoading] = React.useState(false);
  const [retargetingType, setRetargetingType] =
    React.useState<string>("Visiteurs site");
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [sendMessage, setSendMessage] = React.useState("");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetType: "dm_retargeting" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      const result = await res.json();
      const parsed = result.ai_raw_response || JSON.parse(result.content);
      setData(parsed);
      toast.success("DM Retargeting Ads générées !");
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
      <AILoading
        variant="immersive"
        text="Création de tes DM Retargeting Ads"
      />
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" />
              DM Retargeting Ads
            </CardTitle>
            <CardDescription>
              Génère des publicités de retargeting pour pousser tes followers
              chauds à t&apos;envoyer un DM. Inclut les ads, l&apos;automation
              DM, les audiences et le setup campagne.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Retargeting type */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Type de retargeting
              </label>
              <p className="text-xs text-text-muted mb-2">
                Quel segment tu veux recibler
              </p>
              <div className="flex flex-wrap gap-2">
                {RETARGETING_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setRetargetingType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                      retargetingType === type
                        ? "bg-accent text-white shadow-md shadow-accent/25"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80",
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <GenerateButton
              onClick={generate}
              className="w-full"
              icon={<MessageCircle className="h-4 w-4 mr-2" />}
            >
              Générer les DM Retargeting Ads
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
          DM Retargeting Ads
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

      {/* DM Ads */}
      {data.dm_ads && data.dm_ads.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-accent">Publicités DM</h4>
            <Badge variant="default" className="text-[10px]">
              {data.dm_ads.length} variations
            </Badge>
          </div>
          <div className="space-y-3">
            {data.dm_ads.map((ad, i) => {
              const typeColor: Record<string, string> = {
                story_ad: "bg-pink-500/10 text-pink-400",
                feed_ad: "bg-blue-500/10 text-blue-400",
                reel_ad: "bg-purple-500/10 text-purple-400",
              };
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border-default bg-bg-secondary hover:border-border-hover p-4 group transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold text-text-muted">
                          #{i + 1}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColor[ad.type] || "bg-bg-tertiary text-text-muted"}`}
                        >
                          {ad.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted">
                          {ad.angle}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                          {ad.audience_segment.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-text-primary mb-1">
                        {ad.hook}
                      </p>
                      <p className="text-xs text-text-secondary">{ad.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 inline-block">
                          <p className="text-xs text-accent font-medium">
                            {ad.cta}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          &ldquo;{ad.dm_keyword}&rdquo;
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() =>
                          copyText(
                            `Hook: ${ad.hook}\n\n${ad.body}\n\nCTA: ${ad.cta}\nMot-clé: ${ad.dm_keyword}`,
                            `ad-${i}`,
                          )
                        }
                        className={cn(
                          "p-1.5 rounded-lg hover:bg-bg-tertiary transition-all",
                          copiedKey === `ad-${i}` && "opacity-100",
                        )}
                        title="Copier"
                      >
                        {copiedKey === `ad-${i}` ? (
                          <Check className="h-3.5 w-3.5 text-accent animate-in zoom-in-50 duration-200" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-text-muted" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSendMessage(
                            `${ad.hook}\n\n${ad.body}\n\n${ad.cta}`,
                          );
                          setSendDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-all"
                        title="Envoyer via Unipile"
                      >
                        <Send className="h-3.5 w-3.5 text-accent" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* DM Automation */}
      {data.dm_automation && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">
            Automation DM
          </h4>
          <div className="rounded-xl border border-border-default bg-bg-secondary p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-text-muted font-medium">
                  Message d&apos;accueil automatique
                </p>
                <button
                  onClick={() => {
                    setSendMessage(data.dm_automation!.welcome_message);
                    setSendDialogOpen(true);
                  }}
                  className="p-1 rounded-md hover:bg-bg-tertiary transition-colors"
                  title="Envoyer via Unipile"
                >
                  <Send className="h-3.5 w-3.5 text-accent" />
                </button>
              </div>
              <p className="text-sm text-text-primary bg-bg-tertiary rounded-xl p-3">
                {data.dm_automation.welcome_message}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium mb-2">
                Questions de qualification
              </p>
              <div className="space-y-2">
                {data.dm_automation.qualification_questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] text-accent font-bold mt-0.5 bg-accent/10 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      Q{i + 1}
                    </span>
                    <p className="text-xs text-text-primary bg-bg-tertiary rounded-xl p-2 flex-1">
                      {q}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-text-muted font-medium">
                  Message de booking
                </p>
                <button
                  onClick={() => {
                    setSendMessage(data.dm_automation!.booking_message);
                    setSendDialogOpen(true);
                  }}
                  className="p-1 rounded-md hover:bg-bg-tertiary transition-colors"
                  title="Envoyer via Unipile"
                >
                  <Send className="h-3.5 w-3.5 text-accent" />
                </button>
              </div>
              <p className="text-sm text-text-primary bg-bg-tertiary rounded-xl p-3">
                {data.dm_automation.booking_message}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-text-muted font-medium">
                  Relance no-show
                </p>
                <button
                  onClick={() => {
                    setSendMessage(data.dm_automation!.no_show_followup);
                    setSendDialogOpen(true);
                  }}
                  className="p-1 rounded-md hover:bg-bg-tertiary transition-colors"
                  title="Envoyer via Unipile"
                >
                  <Send className="h-3.5 w-3.5 text-accent" />
                </button>
              </div>
              <p className="text-sm text-text-primary bg-bg-tertiary rounded-xl p-3">
                {data.dm_automation.no_show_followup}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Audiences */}
      {data.audiences && data.audiences.length > 0 && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">Audiences</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {data.audiences.map((aud, i) => {
              const priorityColor: Record<string, string> = {
                haute: "text-emerald-400",
                moyenne: "text-yellow-400",
                basse: "text-text-muted",
              };
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border-default bg-bg-secondary hover:border-border-hover p-4 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-text-primary">
                      {aud.name}
                    </p>
                    <span
                      className={`text-[10px] font-medium ${priorityColor[aud.priority] || "text-text-muted"}`}
                    >
                      {aud.priority}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{aud.source}</p>
                  <p className="text-[10px] text-text-muted mt-1">
                    Taille estimée : {aud.size_estimate}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Campaign Setup */}
      {data.campaign_setup && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">
            Setup Campagne
          </h4>
          <div className="rounded-xl border border-border-default bg-bg-secondary p-4 grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-text-muted font-medium">Objectif</p>
              <p className="text-xs text-text-primary font-semibold mt-0.5">
                {data.campaign_setup.objective}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">
                Budget / jour
              </p>
              <p className="text-xs text-text-primary font-semibold mt-0.5">
                {data.campaign_setup.budget_daily}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Placements</p>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {data.campaign_setup.placements.map((p, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">
                Coût / DM cible
              </p>
              <p className="text-xs text-accent font-semibold mt-0.5">
                {data.campaign_setup.kpi_targets.cost_per_dm}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">
                Taux DM vers appel
              </p>
              <p className="text-xs text-accent font-semibold mt-0.5">
                {data.campaign_setup.kpi_targets.dm_to_call_rate}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">ROAS cible</p>
              <p className="text-xs text-accent font-semibold mt-0.5">
                {data.campaign_setup.kpi_targets.roas_target}
              </p>
            </div>
          </div>
        </section>
      )}

      <UnipileSendDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        message={sendMessage}
      />
    </div>
  );
}
