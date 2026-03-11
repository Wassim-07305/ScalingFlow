"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";

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

export function DmRetargetingGenerator({ initialData }: Props) {
  const [data, setData] = React.useState<DmRetargetingData | null>(initialData || null);
  const [loading, setLoading] = React.useState(false);

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
      toast.success("DM Retargeting Ads generees !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la generation");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copie !");
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <MessageCircle className="h-12 w-12 text-text-muted" />
        <p className="text-text-secondary text-sm text-center max-w-md">
          Genere des publicites de retargeting pour pousser tes followers chauds a t&apos;envoyer un DM. Inclut les ads, l&apos;automation DM, les audiences et le setup campagne.
        </p>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
          Generer les DM Retargeting Ads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">DM Retargeting Ads</h3>
        <Button size="sm" onClick={generate} disabled={loading}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
          Regenerer
        </Button>
      </div>

      {/* DM Ads */}
      {data.dm_ads && data.dm_ads.length > 0 && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">Publicites DM ({data.dm_ads.length} variations)</h4>
          <div className="space-y-3">
            {data.dm_ads.map((ad, i) => {
              const typeColor: Record<string, string> = {
                story_ad: "bg-pink-500/10 text-pink-400",
                feed_ad: "bg-blue-500/10 text-blue-400",
                reel_ad: "bg-purple-500/10 text-purple-400",
              };
              return (
                <div key={i} className="rounded-xl border border-border-default bg-bg-tertiary p-4 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColor[ad.type] || "bg-bg-primary text-text-muted"}`}>
                          {ad.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-primary text-text-muted">{ad.angle}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{ad.audience_segment.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-sm font-semibold text-text-primary mb-1">{ad.hook}</p>
                      <p className="text-xs text-text-secondary">{ad.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-accent font-medium">{ad.cta}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          &ldquo;{ad.dm_keyword}&rdquo;
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyText(`Hook: ${ad.hook}\n\n${ad.body}\n\nCTA: ${ad.cta}\nMot-cle: ${ad.dm_keyword}`)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-bg-primary transition-all"
                    >
                      <Copy className="h-3.5 w-3.5 text-text-muted" />
                    </button>
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
          <h4 className="text-sm font-medium text-accent mb-3">Automation DM</h4>
          <div className="rounded-xl border border-border-default bg-bg-tertiary p-4 space-y-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Message d&apos;accueil automatique</p>
              <p className="text-sm text-text-primary bg-bg-primary rounded-lg p-3">{data.dm_automation.welcome_message}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-2">Questions de qualification</p>
              <div className="space-y-2">
                {data.dm_automation.qualification_questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] text-accent font-medium mt-0.5">Q{i + 1}</span>
                    <p className="text-xs text-text-primary bg-bg-primary rounded-lg p-2 flex-1">{q}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Message de booking</p>
              <p className="text-sm text-text-primary bg-bg-primary rounded-lg p-3">{data.dm_automation.booking_message}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Relance no-show</p>
              <p className="text-sm text-text-primary bg-bg-primary rounded-lg p-3">{data.dm_automation.no_show_followup}</p>
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
                <div key={i} className="rounded-xl border border-border-default bg-bg-tertiary p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-text-primary">{aud.name}</p>
                    <span className={`text-[10px] font-medium ${priorityColor[aud.priority] || "text-text-muted"}`}>
                      {aud.priority}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{aud.source}</p>
                  <p className="text-[10px] text-text-muted mt-1">Taille estimee : {aud.size_estimate}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Campaign Setup */}
      {data.campaign_setup && (
        <section>
          <h4 className="text-sm font-medium text-accent mb-3">Setup Campagne</h4>
          <div className="rounded-xl border border-border-default bg-bg-tertiary p-4 grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-text-muted">Objectif</p>
              <p className="text-xs text-text-primary font-medium">{data.campaign_setup.objective}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Budget / jour</p>
              <p className="text-xs text-text-primary font-medium">{data.campaign_setup.budget_daily}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Placements</p>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {data.campaign_setup.placements.map((p, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary text-text-secondary">{p}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted">Cout / DM cible</p>
              <p className="text-xs text-accent font-medium">{data.campaign_setup.kpi_targets.cost_per_dm}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Taux DM → appel</p>
              <p className="text-xs text-accent font-medium">{data.campaign_setup.kpi_targets.dm_to_call_rate}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">ROAS cible</p>
              <p className="text-xs text-accent font-medium">{data.campaign_setup.kpi_targets.roas_target}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
