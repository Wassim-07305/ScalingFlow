"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UnipileSendDialog } from "@/components/shared/unipile-send-dialog";

const PLATFORMS = [
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    activeColor: "bg-blue-500 text-white shadow-blue-500/25",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "bg-pink-500/15 text-pink-400 border-pink-500/20",
    activeColor:
      "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-pink-500/25",
  },
  {
    key: "messenger",
    label: "Messenger",
    icon: Send,
    color: "bg-blue-400/15 text-blue-300 border-blue-400/20",
    activeColor: "bg-blue-400 text-white shadow-blue-400/25",
  },
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
  const [activePlatform, setActivePlatform] =
    React.useState<string>("linkedin");
  const [expandedMessage, setExpandedMessage] = React.useState<number | null>(
    0,
  );
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
    const text =
      typeof result === "string" ? result : JSON.stringify(result, null, 2);
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
  const activeSequence =
    result?.sequences?.find(
      (s) => s.platform.toLowerCase() === activePlatform,
    ) || result?.sequences?.[0];

  if (loading) {
    return <AILoading text="Création de tes scripts de DM" />;
  }

  if (result) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Badge variant="default" className="animate-in fade-in duration-300">
            Scripts générés
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="transition-all hover:border-accent/40 hover:shadow-sm"
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
            <Button
              variant="outline"
              size="sm"
              onClick={copyAll}
              className="transition-all hover:border-accent/40 hover:shadow-sm"
            >
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copié !" : "Copier tout"}
            </Button>
          </div>
        </div>

        {/* Aperçu */}
        {result.overview && (
          <GlowCard glowColor="purple">
            <p className="text-sm text-text-secondary leading-relaxed">
              {result.overview}
            </p>
          </GlowCard>
        )}

        {/* Sélecteur de plateforme avec couleurs spécifiques */}
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map((platform) => {
            const PlatformIcon = platform.icon;
            const isActive = activePlatform === platform.key;
            return (
              <button
                key={platform.key}
                onClick={() => {
                  setActivePlatform(platform.key);
                  setExpandedMessage(0);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border",
                  isActive
                    ? cn(platform.activeColor, "shadow-lg")
                    : cn(platform.color, "hover:scale-[1.02]"),
                )}
              >
                <PlatformIcon className="h-4 w-4" />
                {platform.label}
              </button>
            );
          })}
        </div>

        {/* Séquence de messages */}
        {activeSequence ? (
          <div className="space-y-4">
            {/* Contexte de la séquence */}
            {activeSequence.context && (
              <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-default/50 backdrop-blur-sm">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">
                  Contexte
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {activeSequence.context}
                </p>
              </div>
            )}

            {activeSequence.target_persona && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent/5 border border-accent/10">
                <Target className="h-4 w-4 text-accent shrink-0" />
                <span className="text-sm text-text-secondary">
                  Cible :{" "}
                  <span className="text-text-primary font-medium">
                    {activeSequence.target_persona}
                  </span>
                </span>
              </div>
            )}

            {/* Messages */}
            {activeSequence.messages?.map((msg, i) => {
              const isExpanded = expandedMessage === i;
              return (
                <Card
                  key={i}
                  className={cn(
                    "transition-all duration-300 hover:border-border-hover",
                    isExpanded && "border-accent/30 shadow-lg shadow-accent/5",
                  )}
                >
                  <CardHeader
                    className="cursor-pointer py-3"
                    onClick={() => setExpandedMessage(isExpanded ? null : i)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent/20 text-accent text-xs font-bold ring-2 ring-accent/10">
                          {msg.step}
                        </div>
                        <span className="text-text-primary">
                          Message {msg.step}
                        </span>
                        {msg.timing && (
                          <Badge variant="muted" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {msg.timing}
                          </Badge>
                        )}
                      </CardTitle>
                      <div
                        className={cn(
                          "p-1 rounded-lg transition-transform duration-200",
                          isExpanded && "rotate-180",
                        )}
                      >
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      </div>
                    </div>
                  </CardHeader>
                  <div
                    className={cn(
                      "grid transition-all duration-300",
                      isExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <CardContent className="pt-0 space-y-3 pb-4">
                        {/* Le message */}
                        <div className="relative p-4 rounded-xl bg-bg-tertiary/50 border-l-3 border-accent backdrop-blur-sm">
                          <p className="text-sm text-text-primary whitespace-pre-wrap pr-16 leading-relaxed">
                            {msg.message}
                          </p>
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyMessage(msg.message);
                              }}
                              className="p-2 rounded-lg bg-bg-secondary/80 hover:bg-accent/20 transition-all duration-200 hover:scale-105"
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
                              className="p-2 rounded-lg bg-accent/10 hover:bg-accent/25 transition-all duration-200 hover:scale-105"
                              title="Envoyer via Unipile"
                            >
                              <Send className="h-3.5 w-3.5 text-accent" />
                            </button>
                          </div>
                        </div>

                        {/* Objectif */}
                        {msg.purpose && (
                          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-accent/5 border border-accent/10">
                            <Target className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-accent uppercase font-medium mb-0.5">
                                Objectif
                              </p>
                              <p className="text-xs text-text-secondary leading-relaxed">
                                {msg.purpose}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Déclencheur du prochain message */}
                        {msg.next_step_trigger && (
                          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-bg-tertiary/50 border border-border-default/50">
                            <ArrowRight className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-text-muted uppercase">
                                Envoyer le suivant si
                              </p>
                              <p className="text-xs text-text-secondary leading-relaxed">
                                {msg.next_step_trigger}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Do's et Don'ts */}
            {(activeSequence.dos?.length > 0 ||
              activeSequence.donts?.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {activeSequence.dos && activeSequence.dos.length > 0 && (
                  <Card className="border-green-500/10 bg-green-500/[0.02]">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />À faire
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1.5">
                        {activeSequence.dos.map((d, i) => (
                          <li
                            key={i}
                            className="text-xs text-text-secondary flex items-start gap-2"
                          >
                            <span className="text-green-400 mt-0.5 shrink-0">
                              +
                            </span>
                            <span className="leading-relaxed">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {activeSequence.donts && activeSequence.donts.length > 0 && (
                  <Card className="border-red-500/10 bg-red-500/[0.02]">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />À éviter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1.5">
                        {activeSequence.donts.map((d, i) => (
                          <li
                            key={i}
                            className="text-xs text-text-secondary flex items-start gap-2"
                          >
                            <span className="text-red-400 mt-0.5 shrink-0">
                              -
                            </span>
                            <span className="leading-relaxed">{d}</span>
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
          <div className="text-center py-12">
            <MessageSquare className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-text-muted">
              Aucune séquence trouvée pour cette plateforme.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleGenerate}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Régénérer
            </Button>
          </div>
        )}

        {/* Tips généraux */}
        {result.general_tips && result.general_tips.length > 0 && (
          <Card className="border-accent/10">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Conseils généraux
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {result.general_tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-xs text-text-secondary flex items-start gap-2.5"
                  >
                    <span className="text-accent mt-0.5 shrink-0">
                      {"\u2192"}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          onClick={() => setResult(null)}
          className="transition-all hover:border-accent/40"
        >
          <Sparkles className="h-4 w-4 mr-2" />
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

  // État initial
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
          <MessageSquare className="h-7 w-7 text-accent" />
        </div>
        <h3 className="font-semibold text-text-primary text-lg mb-1.5">
          Scripts de DM
        </h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
          L&apos;IA va créer des séquences de messages pour prospecter sur
          LinkedIn, Instagram et Messenger.
        </p>
      </div>

      <Card className="border-border-default/50 bg-bg-secondary/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Générateur de scripts DM
          </CardTitle>
          <CardDescription>
            Choisis la plateforme puis génère des séquences de messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Sélecteur de plateforme */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-3 block">
              Plateforme
            </label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map((platform) => {
                const PlatformIcon = platform.icon;
                const isActive = activePlatform === platform.key;
                return (
                  <button
                    key={platform.key}
                    onClick={() => setActivePlatform(platform.key)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border",
                      isActive
                        ? cn(platform.activeColor, "shadow-lg")
                        : cn(platform.color, "hover:scale-[1.02]"),
                    )}
                  >
                    <PlatformIcon className="h-4 w-4" />
                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Button size="lg" onClick={handleGenerate} className="w-full group">
            <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
            Générer les scripts DM
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
