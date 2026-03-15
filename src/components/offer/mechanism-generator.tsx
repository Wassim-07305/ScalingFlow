"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { ViabilityScore } from "@/components/onboarding/viability-score";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  Sparkles,
  Lightbulb,
  Target,
  ShieldCheck,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Zap,
} from "lucide-react";

interface Mechanism {
  name: string;
  tagline: string;
  problem: string;
  root_cause: string;
  solution: string[];
  evidence: string[];
  uniqueness: string;
  elevator_pitch: string;
  score: number;
}

interface MechanismResult {
  mechanisms: Mechanism[];
  recommendation: string;
  recommended_index: number;
}

interface MechanismGeneratorProps {
  offerId?: string;
}

export function MechanismGenerator({ offerId }: MechanismGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MechanismResult | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [niche, setNiche] = useState("");
  const [offerName, setOfferName] = useState("");
  const [mainProblem, setMainProblem] = useState("");
  const [targetAvatar, setTargetAvatar] = useState("");

  const { user } = useUser();
  const supabase = createClient();

  // Auto-load from profile and offer
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("niche, selected_market")
        .eq("id", user.id)
        .single();

      if (profile) {
        setNiche(profile.niche || profile.selected_market || "");
      }

      if (offerId) {
        const { data: offer } = await supabase
          .from("offers")
          .select("offer_name, unique_mechanism")
          .eq("id", offerId)
          .single();

        if (offer) {
          setOfferName(offer.offer_name || "");
        }
      }

      // Load latest market analysis for avatar
      const { data: market } = await supabase
        .from("market_analyses")
        .select("target_avatar, market_description")
        .eq("user_id", user.id)
        .eq("selected", true)
        .single();

      if (market) {
        setTargetAvatar(
          typeof market.target_avatar === "string"
            ? market.target_avatar
            : JSON.stringify(market.target_avatar || "")
        );
        if (!mainProblem && market.market_description) {
          setMainProblem(String(market.market_description));
        }
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, offerId]);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      toast.error("Indique ta niche / ton marché");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/generate-mechanism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          offer_name: offerName,
          main_problem: mainProblem,
          target_avatar: targetAvatar,
          skills: [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Erreur ${res.status}`);
      }

      const data: MechanismResult = await res.json();
      setResult(data);
      setExpandedIndex(data.recommended_index);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!offerId || selectedIndex === null || !result) {
      toast.error("Sélectionne un mécanisme et assure-toi d'avoir une offre.");
      return;
    }

    setSaving(true);
    try {
      const mechanism = result.mechanisms[selectedIndex];
      const { error } = await supabase
        .from("offers")
        .update({
          unique_mechanism: mechanism.name,
          unique_mechanism_details: mechanism,
        })
        .eq("id", offerId);

      if (error) throw error;
      toast.success("Mécanisme unique sauvegardé !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const getContentForExport = () => {
    if (!result) return "";
    return result.mechanisms
      .map(
        (m, i) =>
          `## Mécanisme ${i + 1} : ${m.name}\n\n` +
          `Tagline : ${m.tagline}\n\n` +
          `Problème : ${m.problem}\n\n` +
          `Cause racine : ${m.root_cause}\n\n` +
          `Solution :\n${m.solution.map((s, j) => `${j + 1}. ${s}`).join("\n")}\n\n` +
          `Preuves :\n${m.evidence.map((e) => `- ${e}`).join("\n")}\n\n` +
          `Unicité : ${m.uniqueness}\n\n` +
          `Pitch : ${m.elevator_pitch}\n\n` +
          `Score : ${m.score}/100\n`
      )
      .join("\n---\n\n");
  };

  if (loading) {
    return <AILoading text="Création de mécanismes uniques" />;
  }

  return (
    <div className="space-y-6">
      {/* Input form */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-accent" />
              Générateur de Mécanisme Unique
            </CardTitle>
            <CardDescription>
              Trouve ton &quot;comment&quot; propriétaire qui rend ta promesse crédible et te différencie de tous les concurrents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Ta niche / marché
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Ex : Coaching fitness pour entrepreneurs"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Nom de ton offre
              </label>
              <input
                type="text"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                placeholder="Ex : Programme SCALE 90"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Problème principal de ta cible
              </label>
              <textarea
                value={mainProblem}
                onChange={(e) => setMainProblem(e.target.value)}
                placeholder="Ex : Les entrepreneurs n'arrivent pas à maintenir une routine fitness à cause de leur emploi du temps chargé..."
                rows={3}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Avatar client cible
              </label>
              <input
                type="text"
                value={targetAvatar}
                onChange={(e) => setTargetAvatar(e.target.value)}
                placeholder="Ex : Entrepreneur 30-45 ans, CA 5-50K/mois, pas le temps de s'entraîner"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
              />
            </div>
            <Button onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer 3 mécanismes uniques
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-text-primary">
              3 mécanismes uniques générés
            </h2>
            <p className="text-sm text-text-secondary">{result.recommendation}</p>
          </div>

          <div className="space-y-4">
            {result.mechanisms.map((mechanism, index) => {
              const isExpanded = expandedIndex === index;
              const isRecommended = index === result.recommended_index;
              const isSelected = selectedIndex === index;

              return (
                <Card
                  key={mechanism.name}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && "border-accent",
                    isRecommended && !isSelected && "border-accent/40"
                  )}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <ViabilityScore score={mechanism.score} size="sm" />
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            {mechanism.name}
                            {isRecommended && <Badge variant="cyan">Recommandé</Badge>}
                          </CardTitle>
                          <p className="text-sm text-text-secondary mt-1 italic">
                            {mechanism.tagline}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-text-muted shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-text-muted shrink-0" />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 pt-2">
                      {/* Problem */}
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-red-400" />
                          Problème
                        </h4>
                        <p className="text-sm text-text-secondary">{mechanism.problem}</p>
                      </div>

                      {/* Root cause */}
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-1">
                          <Lightbulb className="h-4 w-4 text-amber-400" />
                          Cause racine (l&apos;insight)
                        </h4>
                        <p className="text-sm text-text-secondary">{mechanism.root_cause}</p>
                      </div>

                      {/* Solution steps */}
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-accent" />
                          Le &quot;Comment&quot; — Ton process unique
                        </h4>
                        <ol className="space-y-1.5">
                          {mechanism.solution.map((step, i) => (
                            <li
                              key={i}
                              className="text-sm text-text-secondary flex items-start gap-2"
                            >
                              <span className="shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Evidence */}
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
                          <ShieldCheck className="h-4 w-4 text-blue-400" />
                          Preuves de crédibilité
                        </h4>
                        <ul className="space-y-1">
                          {mechanism.evidence.map((e, i) => (
                            <li
                              key={i}
                              className="text-sm text-text-secondary pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-blue-400"
                            >
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Uniqueness */}
                      <div className="rounded-lg bg-bg-tertiary p-3">
                        <h4 className="text-sm font-semibold text-accent mb-1">
                          <Fingerprint className="h-4 w-4 inline mr-1" />
                          Pourquoi c&apos;est unique
                        </h4>
                        <p className="text-sm text-text-secondary">{mechanism.uniqueness}</p>
                      </div>

                      {/* Elevator pitch */}
                      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                        <h4 className="text-sm font-semibold text-text-primary mb-1">
                          Pitch 30 secondes
                        </h4>
                        <p className="text-sm text-text-secondary italic">
                          &quot;{mechanism.elevator_pitch}&quot;
                        </p>
                      </div>

                      {/* Select button */}
                      <Button
                        className="w-full"
                        variant={isSelected ? "default" : "secondary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(index);
                        }}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Sélectionné
                          </>
                        ) : (
                          "Choisir ce mécanisme"
                        )}
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Save & export */}
          <div className="flex items-center gap-3">
            {offerId && selectedIndex !== null && (
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sauvegarder dans l&apos;offre
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null);
                setSelectedIndex(null);
              }}
            >
              Regénérer
            </Button>
          </div>

          <CopyExportBar
            copyContent={getContentForExport()}
            pdfContent={getContentForExport()}
            pdfTitle="Mécanisme Unique"
            pdfFilename="mecanisme-unique"
          />
        </>
      )}
    </div>
  );
}
