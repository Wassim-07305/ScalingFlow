"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import { cn } from "@/lib/utils/cn";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { toast } from "sonner";
import {
  Sparkles,
  MessageSquare,
  Copy,
  FileDown,
  Clock,
  ArrowRight,
  Target,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Instagram,
  Send,
} from "lucide-react";
import { UnipileSendDialog } from "@/components/shared/unipile-send-dialog";

const PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "messenger", label: "Messenger", icon: Send },
] as const;

interface DmMessage {
  step: number;
  message: string;
  purpose: string;
  timing: string;
  next_step_trigger: string;
}

interface DmSequence {
  platform: string;
  context: string;
  target_persona: string;
  messages: DmMessage[];
  dos: string[];
  donts: string[];
}

interface DmScriptsResult {
  title: string;
  overview: string;
  sequences: DmSequence[];
  general_tips: string[];
}

export function DmScripts() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<DmScriptsResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [activePlatform, setActivePlatform] = React.useState<string>("linkedin");
  const [expandedMessage, setExpandedMessage] = React.useState<number | null>(0);
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [sendMessage, setSendMessage] = React.useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sales_script",
          scriptType: "dm_scripts",
          context: { platform: activePlatform },
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();

      const parsed = data.ai_raw_response || data;
      if (typeof parsed === "string") {
        try {
          setResult(JSON.parse(parsed));
        } catch {
          setResult({
            title: "Scripts DM",
            overview: parsed,
            sequences: [],
            general_tips: [],
          });
        }
      } else {
        setResult(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copié dans le presse-papiers");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success("Message copié");
  };

  // Séquence active filtrée par plateforme
  const activeSequence = result?.sequences?.find(
    (s) => s.platform.toLowerCase() === activePlatform
  ) || result?.sequences?.[0];

  if (loading) {
    return <AILoading text="Création de tes scripts de DM" />;
  }

  if (result) {
    return (
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Badge variant="default">Scripts générés</Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToPDF({
                  title: "Scripts DM - Prospection",
                  subtitle: "Généré par ScalingFlow",
                  content: result as unknown as Record<string, unknown>,
                  filename: "scripts-dm-scalingflow.pdf",
                })
              }
            >
              <FileDown className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copié !" : "Copier tout"}
            </Button>
          </div>
        </div>

        {/* Aperçu */}
        {result.overview && (
          <GlowCard glowColor="purple">
            <p className="text-sm text-text-secondary leading-relaxed">{result.overview}</p>
          </GlowCard>
        )}

        {/* Selecteur de plateforme */}
        <div className="flex gap-2">
          {PLATFORMS.map((platform) => {
            const PlatformIcon = platform.icon;
            return (
              <button
                key={platform.key}
                onClick={() => {
                  setActivePlatform(platform.key);
                  setExpandedMessage(0);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activePlatform === platform.key
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                )}
              >
                <PlatformIcon className="h-4 w-4" />
                {platform.label}
              </button>
            );
          })}
        </div>

        {/* Sequence de messages */}
        {activeSequence ? (
          <div className="space-y-4">
            {/* Contexte de la séquence */}
            {activeSequence.context && (
              <div className="p-3 rounded-lg bg-bg-tertiary">
                <p className="text-xs text-text-muted uppercase mb-1">Contexte</p>
                <p className="text-sm text-text-secondary">{activeSequence.context}</p>
              </div>
            )}

            {activeSequence.target_persona && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm text-text-secondary">
                  Cible : <span className="text-text-primary font-medium">{activeSequence.target_persona}</span>
                </span>
              </div>
            )}

            {/* Messages */}
            {activeSequence.messages?.map((msg, i) => {
              const isExpanded = expandedMessage === i;
              return (
                <Card key={i}>
                  <CardHeader
                    className="cursor-pointer py-3"
                    onClick={() => setExpandedMessage(isExpanded ? null : i)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-3">
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-accent/20 text-accent text-xs font-bold">
                          {msg.step}
                        </div>
                        Message {msg.step}
                        {msg.timing && (
                          <Badge variant="muted" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {msg.timing}
                          </Badge>
                        )}
                      </CardTitle>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      )}
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0 space-y-3">
                      {/* Le message */}
                      <div className="relative p-4 rounded-lg bg-bg-tertiary border-l-2 border-accent">
                        <p className="text-sm text-text-primary whitespace-pre-wrap pr-8">
                          {msg.message}
                        </p>
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyMessage(msg.message);
                            }}
                            className="p-1.5 rounded-md bg-bg-secondary hover:bg-accent/20 transition-colors"
                            title="Copier le message"
                          >
                            <Copy className="h-3.5 w-3.5 text-text-muted" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSendMessage(msg.message);
                              setSendDialogOpen(true);
                            }}
                            className="p-1.5 rounded-md bg-bg-secondary hover:bg-accent/20 transition-colors"
                            title="Envoyer via Unipile"
                          >
                            <Send className="h-3.5 w-3.5 text-accent" />
                          </button>
                        </div>
                      </div>

                      {/* Objectif */}
                      {msg.purpose && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-accent/5">
                          <Target className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-accent uppercase font-medium">Objectif</p>
                            <p className="text-xs text-text-secondary">{msg.purpose}</p>
                          </div>
                        </div>
                      )}

                      {/* Déclencheur du prochain message */}
                      {msg.next_step_trigger && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-bg-tertiary">
                          <ArrowRight className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-text-muted uppercase">Envoyer le suivant si</p>
                            <p className="text-xs text-text-secondary">{msg.next_step_trigger}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* Do's et Don'ts */}
            {(activeSequence.dos?.length > 0 || activeSequence.donts?.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {activeSequence.dos && activeSequence.dos.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-green-400">À faire</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1">
                        {activeSequence.dos.map((d, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-green-400">+</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {activeSequence.donts && activeSequence.donts.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-red-400">À éviter</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1">
                        {activeSequence.donts.map((d, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-red-400">-</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">
              Aucune séquence trouvée pour cette plateforme.
            </p>
          </div>
        )}

        {/* Tips generaux */}
        {result.general_tips && result.general_tips.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Conseils généraux
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5">
                {result.general_tips.map((tip, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-accent">{"\u2192"}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => setResult(null)}>
          Régénérer les scripts
        </Button>

        <UnipileSendDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          message={sendMessage}
          platformFilter={activePlatform}
        />
      </div>
    );
  }

  // Etat initial
  return (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="h-10 w-10 text-accent mx-auto mb-3" />
        <h3 className="font-semibold text-text-primary mb-1">Scripts de DM</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          L&apos;IA va créer des séquences de messages pour prospecter sur LinkedIn, Instagram et Messenger.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Générateur de scripts DM
          </CardTitle>
          <CardDescription>
            Choisis la plateforme puis génère des séquences de messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélecteur de plateforme */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Plateforme
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map((platform) => {
                const PlatformIcon = platform.icon;
                return (
                  <button
                    key={platform.key}
                    onClick={() => setActivePlatform(platform.key)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      activePlatform === platform.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <PlatformIcon className="h-4 w-4" />
                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button size="lg" onClick={handleGenerate} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Générer les scripts DM
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
