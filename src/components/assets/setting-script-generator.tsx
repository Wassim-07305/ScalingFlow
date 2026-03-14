"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AILoading } from "@/components/shared/ai-loading";
import { GlowCard } from "@/components/shared/glow-card";
import {
  Sparkles,
  Phone,
  HelpCircle,
  Presentation,
  ShieldAlert,
  PhoneCall,
  Send,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import type { SettingScriptResult } from "@/lib/ai/prompts/setting-script";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

interface SettingScriptGeneratorProps {
  className?: string;
  initialData?: SettingScriptResult;
}

const TABS = [
  { key: "opening", label: "Ouverture", icon: Phone },
  { key: "qualification", label: "Qualification", icon: HelpCircle },
  { key: "presentation", label: "Présentation", icon: Presentation },
  { key: "objections", label: "Objections", icon: ShieldAlert },
  { key: "closing", label: "Closing", icon: PhoneCall },
  { key: "followup", label: "Follow-up", icon: Send },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CALL_TYPES = ["Découverte", "Qualification", "Closing"] as const;

export function SettingScriptGenerator({
  className,
  initialData,
}: SettingScriptGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  const [script, setScript] = React.useState<SettingScriptResult | null>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabKey>("opening");
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);
  const [callType, setCallType] = React.useState<string>("Découverte");
  const [context, setContext] = React.useState("");

  React.useEffect(() => {
    if (initialData) setScript(initialData);
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "setting_script", callType, context: context || undefined }),
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
      setScript(raw as SettingScriptResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return (
      <AILoading
        text="Création de ton script de setting"
        className={className}
      />
    );
  }

  if (!script) {
    return (
      <div className={cn("max-w-xl mx-auto py-8", className)}>
        {error && <p className="text-sm text-danger mb-4 text-center">{error}</p>}
        <Card>
          <CardHeader>
            <CardTitle>Script de Setting</CardTitle>
            <CardDescription>Script complet pour qualifier et booker tes prospects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Call type */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Type d&apos;appel</label>
              <div className="flex flex-wrap gap-2">
                {CALL_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setCallType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      callType === type
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional context */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">Contexte (optionnel)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ex : Appel avec un prospect qui a téléchargé notre guide..."
                className="w-full rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[80px] resize-none"
              />
            </div>

            <Button className="w-full" size="lg" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le script de setting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tab navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                activeTab === tab.key
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setScript(null)} className="flex-shrink-0 ml-2">
          <RefreshCw className="h-4 w-4 mr-1" />
          Nouveau brief
        </Button>
      </div>

      {/* Tab content */}
      {activeTab === "opening" && script.opening && (
        <GlowCard glowColor="blue">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-text-primary">Ouverture</h3>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
            {script.opening.script}
          </p>
          {script.opening.notes && (
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted font-medium mb-1">
                Notes :
              </p>
              <p className="text-xs text-text-secondary">
                {script.opening.notes}
              </p>
            </div>
          )}
        </GlowCard>
      )}

      {activeTab === "qualification" && script.qualification && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-text-primary">
              Questions de qualification
            </h3>
            <Badge variant="muted">
              {script.qualification.questions.length} questions
            </Badge>
          </div>

          {script.qualification.questions.map((q, i) => (
            <Card key={i}>
              <CardContent className="py-3">
                <p className="text-sm font-medium text-text-primary mb-2">
                  {i + 1}. {q.question}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-bg-tertiary">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted font-medium">
                        Réponse idéale
                      </p>
                      <p className="text-xs text-text-secondary">
                        {q.ideal_answer}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-bg-tertiary">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted font-medium">
                        Red flag
                      </p>
                      <p className="text-xs text-text-secondary">
                        {q.red_flag}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "presentation" && script.presentation && (
        <GlowCard glowColor="blue">
          <div className="flex items-center gap-2 mb-4">
            <Presentation className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-text-primary">
              Mini-présentation
            </h3>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
            {script.presentation.script}
          </p>
          {script.presentation.notes && (
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-default">
              <p className="text-xs text-text-muted font-medium mb-1">
                Notes :
              </p>
              <p className="text-xs text-text-secondary">
                {script.presentation.notes}
              </p>
            </div>
          )}
        </GlowCard>
      )}

      {activeTab === "objections" && script.objection_handling && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-text-primary">
              Gestion des objections
            </h3>
            <Badge variant="muted">
              {script.objection_handling.length} objections
            </Badge>
          </div>

          {script.objection_handling.map((obj, i) => (
            <Card key={i}>
              <CardContent className="py-3">
                <div className="flex items-start gap-2 mb-2">
                  <Badge variant="red" className="text-xs flex-shrink-0 mt-0.5">
                    Objection
                  </Badge>
                  <p className="text-sm font-medium text-text-primary">
                    &laquo; {obj.objection} &raquo;
                  </p>
                </div>
                <div className="ml-2 pl-3 border-l-2 border-accent/30">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {obj.response}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "closing" && script.closing && (
        <GlowCard glowColor="blue">
          <div className="flex items-center gap-2 mb-4">
            <PhoneCall className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-text-primary">
              Closing & prise de RDV
            </h3>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
            {script.closing.script}
          </p>
          {script.closing.transition_to_call && (
            <div className="p-3 rounded-lg bg-accent-muted border border-accent/20">
              <p className="text-xs text-accent font-medium mb-1">
                Phrase de transition :
              </p>
              <p className="text-sm text-text-primary italic">
                &laquo; {script.closing.transition_to_call} &raquo;
              </p>
            </div>
          )}
        </GlowCard>
      )}

      {activeTab === "followup" && script.follow_up && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-text-primary">
              Templates de suivi
            </h3>
          </div>

          <GlowCard glowColor="blue">
            <Badge variant="blue" className="mb-3">
              SMS de confirmation
            </Badge>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {script.follow_up.sms_template}
            </p>
          </GlowCard>

          <GlowCard glowColor="purple">
            <Badge variant="purple" className="mb-3">
              Email de rappel
            </Badge>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {script.follow_up.email_template}
            </p>
          </GlowCard>
        </div>
      )}
    </div>
  );
}
