"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Sword,
  Bomb,
  Blocks,
  Fingerprint,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { CategoryOSResult } from "@/lib/ai/prompts/category-os";
import { UpgradeWall } from "@/components/shared/upgrade-wall";

const STEPS = [
  { key: "new_game", label: "New Game", icon: Gamepad2, color: "text-accent" },
  { key: "ennemi", label: "Ennemi", icon: Sword, color: "text-danger" },
  { key: "truth_bombs", label: "Truth Bombs", icon: Bomb, color: "text-warning" },
  { key: "modele_tangible", label: "Framework", icon: Blocks, color: "text-info" },
  { key: "identite", label: "Identité", icon: Fingerprint, color: "text-[#A78BFA]" },
] as const;

interface CategoryOSWizardProps {
  offerId?: string;
  className?: string;
}

export function CategoryOSWizard({ offerId, className }: CategoryOSWizardProps) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CategoryOSResult | null>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [usageLimited, setUsageLimited] = React.useState<{currentUsage: number; limit: number} | null>(null);

  const handleGenerate = async () => {
    if (!offerId) {
      toast.error("Veuillez d'abord générer une offre.");
      return;
    }

    setLoading(true);
    setResult(null);
    setCurrentStep(0);

    try {
      const response = await fetch("/api/ai/generate-category-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403 && errData.usage) { setUsageLimited(errData.usage); return; }
        throw new Error(errData.error || "Erreur lors de la génération");
      }

      const data: CategoryOSResult = await response.json();
      setResult(data);
      toast.success("Category OS généré avec succès !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (usageLimited) {
    return <UpgradeWall currentUsage={usageLimited.currentUsage} limit={usageLimited.limit} className={className} />;
  }

  if (loading) {
    return <AILoading text="Génération du Category OS" className={className} />;
  }

  if (!result) {
    return (
      <div className={cn("space-y-6", className)}>
        {offerId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Category OS — Positionnement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Le Category OS définit ton positionnement unique en 5 étapes : nouvelle catégorie, ennemi commun, vérités dérangeantes, framework propriétaire et identité de marque.
              </p>
              <Button size="lg" onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer le Category OS
              </Button>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Gamepad2}
            title="Aucune offre disponible"
            description="Génère d'abord une offre pour pouvoir créer ton positionnement Category OS."
          />
        )}
      </div>
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setCurrentStep(i)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
              i === currentStep
                ? "bg-accent text-white"
                : i < currentStep
                ? "bg-accent-muted text-accent"
                : "bg-bg-tertiary text-text-muted hover:text-text-secondary"
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <step.icon className={cn("h-5 w-5", step.color)} />
            {step.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && <NewGameStep data={result.new_game} />}
          {currentStep === 1 && <EnnemiStep data={result.ennemi} />}
          {currentStep === 2 && <TruthBombsStep data={result.truth_bombs} />}
          {currentStep === 3 && <ModeleTangibleStep data={result.modele_tangible} />}
          {currentStep === 4 && <IdentiteStep data={result.identite} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>
        <span className="text-xs text-text-muted">
          {currentStep + 1} / {STEPS.length}
        </span>
        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button variant="outline" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-1" />
            Régénérer
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Sub-step components ---

function NewGameStep({ data }: { data: CategoryOSResult["new_game"] }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-accent-muted/30 border border-accent/20">
        <p className="text-xs text-accent font-medium uppercase tracking-wide mb-1">
          Nouvelle catégorie
        </p>
        <p className="text-xl font-bold text-text-primary">{data.category_name}</p>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Pourquoi c&apos;est nouveau
          </p>
          <p className="text-sm text-text-secondary">{data.why_new}</p>
        </div>
        <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
            Déclaration de positionnement
          </p>
          <p className="text-base font-medium text-text-primary italic">
            &ldquo;{data.positioning_statement}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function EnnemiStep({ data }: { data: CategoryOSResult["ennemi"] }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
        <p className="text-xs text-danger font-medium uppercase tracking-wide mb-1">
          L&apos;ennemi
        </p>
        <p className="text-xl font-bold text-text-primary">{data.enemy_name}</p>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Description</p>
          <p className="text-sm text-text-secondary">{data.description}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            Pourquoi c&apos;est nuisible
          </p>
          <p className="text-sm text-text-secondary">{data.why_harmful}</p>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-tertiary border border-border-default">
          <ArrowRight className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Notre contraste
            </p>
            <p className="text-sm text-text-primary">{data.contrast_with_us}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TruthBombsStep({ data }: { data: CategoryOSResult["truth_bombs"] }) {
  return (
    <div className="space-y-4">
      {data.bombs.map((bomb, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-bg-tertiary border border-border-default space-y-3"
        >
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-warning/12 text-warning text-sm font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <p className="text-base font-semibold text-text-primary pt-0.5">
              {bomb.statement}
            </p>
          </div>
          <p className="text-sm text-text-secondary pl-10">{bomb.explanation}</p>
          <div className="flex items-center gap-2 pl-10">
            <Lightbulb className="h-3.5 w-3.5 text-warning" />
            <p className="text-xs text-warning">{bomb.impact}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModeleTangibleStep({ data }: { data: CategoryOSResult["modele_tangible"] }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-info/10 border border-info/20">
        <p className="text-xs text-info font-medium uppercase tracking-wide mb-1">
          Framework propriétaire
        </p>
        <p className="text-xl font-bold text-text-primary">{data.framework_name}</p>
      </div>
      <div className="space-y-3">
        {data.steps.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-xl bg-bg-tertiary border border-border-default"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-info/12 text-info text-sm font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-text-primary">{step.name}</p>
              <p className="text-sm text-text-secondary mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
          Représentation visuelle
        </p>
        <p className="text-sm text-text-secondary">{data.visual_description}</p>
      </div>
    </div>
  );
}

function IdentiteStep({ data }: { data: CategoryOSResult["identite"] }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs text-text-muted uppercase tracking-wide">Headlines de marque</p>
        {data.brand_headlines.map((headline, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-bg-tertiary border border-border-default"
          >
            <p className="text-sm font-medium text-text-primary">{headline}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 rounded-xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)]">
          <p className="text-xs text-[#A78BFA] font-medium uppercase tracking-wide mb-1">
            Tagline
          </p>
          <p className="text-base font-semibold text-text-primary">{data.tagline}</p>
        </div>
        <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Ton de voix</p>
          <p className="text-sm text-text-secondary">{data.tone_of_voice}</p>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-bg-tertiary border border-border-default">
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
          Proposition de valeur
        </p>
        <p className="text-base text-text-primary font-medium">{data.value_proposition}</p>
      </div>
      <Badge variant="default">Category OS termine</Badge>
    </div>
  );
}
