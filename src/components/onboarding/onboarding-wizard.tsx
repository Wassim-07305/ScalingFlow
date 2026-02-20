"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AILoading } from "@/components/shared/ai-loading";
import { MarketAnalysis } from "@/components/onboarding/market-analysis";
import { cn } from "@/lib/utils/cn";
import type { MarketAnalysisResult } from "@/types/ai";
import {
  ArrowRight,
  ArrowLeft,
  Code2,
  Workflow,
  Bot,
  Database,
  Globe,
  Palette,
  Zap,
  LineChart,
  ShieldCheck,
  PenTool,
} from "lucide-react";

const STEPS = [
  "Compétences",
  "Expérience",
  "Revenus",
  "Industries",
  "Objectifs",
  "Budget",
];

const SKILLS = [
  { label: "N8N / Make", icon: Workflow },
  { label: "Chatbots IA", icon: Bot },
  { label: "Développement web", icon: Code2 },
  { label: "Bases de données", icon: Database },
  { label: "APIs & Intégrations", icon: Globe },
  { label: "UI/UX Design", icon: Palette },
  { label: "Automatisation", icon: Zap },
  { label: "Data / Analytics", icon: LineChart },
  { label: "Cybersécurité", icon: ShieldCheck },
  { label: "Copywriting", icon: PenTool },
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Débutant", desc: "< 1 an de freelance" },
  { value: "intermediate", label: "Intermédiaire", desc: "1-3 ans" },
  { value: "advanced", label: "Avancé", desc: "3+ ans" },
];

const INDUSTRIES = [
  "E-commerce",
  "SaaS",
  "Immobilier",
  "Santé",
  "Finance",
  "Éducation",
  "Restaurant / Food",
  "Agences marketing",
  "Coaching / Consulting",
  "Juridique",
  "BTP / Construction",
  "Logistique",
];

const OBJECTIVES = [
  "Trouver ma niche",
  "Créer une offre irrésistible",
  "Générer des leads",
  "Lancer des pubs Meta",
  "Créer un funnel de vente",
  "Scaler mon activité",
  "Structurer mon delivery",
  "Automatiser mon business",
];

const BUDGETS = [
  { value: 0, label: "0€ - Pas de budget" },
  { value: 500, label: "500€/mois" },
  { value: 1000, label: "1 000€/mois" },
  { value: 2000, label: "2 000€/mois" },
  { value: 5000, label: "5 000€+/mois" },
];

export function OnboardingWizard() {
  const store = useOnboardingStore();
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<MarketAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleArrayItem = (
    key: "skills" | "industries" | "objectives",
    item: string
  ) => {
    const current = store[key];
    if (current.includes(item)) {
      store.setField(
        key,
        current.filter((i) => i !== item)
      );
    } else {
      store.setField(key, [...current, item]);
    }
  };

  const canProceed = () => {
    switch (store.step) {
      case 0:
        return store.skills.length > 0;
      case 1:
        return store.experienceLevel !== "";
      case 2:
        return store.currentRevenue >= 0 && store.targetRevenue > 0;
      case 3:
        return store.industries.length > 0;
      case 4:
        return store.objectives.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/analyze-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: store.skills,
          experienceLevel: store.experienceLevel,
          currentRevenue: store.currentRevenue,
          targetRevenue: store.targetRevenue,
          industries: store.industries,
          objectives: store.objectives,
          budgetMonthly: store.budgetMonthly,
        }),
      });

      if (!res.ok) throw new Error("Erreur analyse");

      const data: MarketAnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch {
      setError("Erreur lors de l'analyse. Réessaie.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectMarket = async (marketIndex: number) => {
    if (!user || !analysisResult) return;

    const market = analysisResult.markets[marketIndex];

    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: 7,
        skills: store.skills,
        experience_level: store.experienceLevel as "beginner" | "intermediate" | "advanced",
        current_revenue: store.currentRevenue,
        target_revenue: store.targetRevenue,
        industries: store.industries,
        objectives: store.objectives,
        budget_monthly: store.budgetMonthly,
        selected_market: market.name,
        market_viability_score: market.viability_score,
        niche: market.name,
      })
      .eq("id", user.id);

    router.push("/offer");
    router.refresh();
  };

  const handleNext = () => {
    if (store.step === 5) {
      handleAnalyze();
    } else {
      store.nextStep();
    }
  };

  // Show analysis results
  if (analysisResult) {
    return (
      <MarketAnalysis
        result={analysisResult}
        onSelect={handleSelectMarket}
      />
    );
  }

  // Show loading
  if (isAnalyzing) {
    return <AILoading text="Analyse de ton marché en cours" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Step indicator */}
      <StepIndicator steps={STEPS} currentStep={store.step} />

      {/* Error */}
      {error && (
        <div className="rounded-[12px] bg-neon-red/10 border border-neon-red/20 p-3 text-sm text-neon-red">
          {error}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={store.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 0: Skills */}
          {store.step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                Quelles sont tes compétences ?
              </h2>
              <p className="text-text-secondary text-sm">
                Sélectionne toutes les compétences que tu maîtrises.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SKILLS.map((skill) => {
                  const isSelected = store.skills.includes(skill.label);
                  return (
                    <button
                      key={skill.label}
                      onClick={() => toggleArrayItem("skills", skill.label)}
                      className={cn(
                        "flex items-center gap-3 rounded-[12px] border p-3 text-left transition-all duration-200",
                        isSelected
                          ? "border-neon-orange bg-neon-orange-glow text-neon-orange"
                          : "border-border-default bg-bg-secondary text-text-secondary hover:border-border-hover"
                      )}
                    >
                      <skill.icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium">{skill.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Experience */}
          {store.step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                Quel est ton niveau d'expérience ?
              </h2>
              <div className="grid gap-3">
                {EXPERIENCE_LEVELS.map((level) => (
                  <Card
                    key={level.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      store.experienceLevel === level.value
                        ? "border-neon-orange bg-neon-orange-glow"
                        : "hover:border-border-hover"
                    )}
                    onClick={() =>
                      store.setField("experienceLevel", level.value)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {level.label}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {level.desc}
                        </p>
                      </div>
                      {store.experienceLevel === level.value && (
                        <Badge>Sélectionné</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Revenue */}
          {store.step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                Tes revenus actuels et objectifs
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Revenu mensuel actuel (€)</Label>
                  <Input
                    type="number"
                    value={store.currentRevenue || ""}
                    onChange={(e) =>
                      store.setField("currentRevenue", Number(e.target.value))
                    }
                    placeholder="Ex: 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objectif de revenu mensuel (€)</Label>
                  <Input
                    type="number"
                    value={store.targetRevenue || ""}
                    onChange={(e) =>
                      store.setField("targetRevenue", Number(e.target.value))
                    }
                    placeholder="Ex: 30000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Industries */}
          {store.step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                Dans quelles industries as-tu travaillé ?
              </h2>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((industry) => {
                  const isSelected = store.industries.includes(industry);
                  return (
                    <button
                      key={industry}
                      onClick={() => toggleArrayItem("industries", industry)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200",
                        isSelected
                          ? "border-neon-blue bg-neon-blue-glow text-neon-blue"
                          : "border-border-default text-text-secondary hover:border-border-hover"
                      )}
                    >
                      {industry}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Objectives */}
          {store.step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                Quels sont tes objectifs ?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OBJECTIVES.map((obj) => {
                  const isSelected = store.objectives.includes(obj);
                  return (
                    <button
                      key={obj}
                      onClick={() => toggleArrayItem("objectives", obj)}
                      className={cn(
                        "rounded-[12px] border p-3 text-left text-sm font-medium transition-all duration-200",
                        isSelected
                          ? "border-neon-cyan bg-neon-cyan-glow text-neon-cyan"
                          : "border-border-default text-text-secondary hover:border-border-hover"
                      )}
                    >
                      {obj}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Budget */}
          {store.step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                Quel est ton budget pub mensuel ?
              </h2>
              <div className="grid gap-3">
                {BUDGETS.map((budget) => (
                  <Card
                    key={budget.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      store.budgetMonthly === budget.value
                        ? "border-neon-orange bg-neon-orange-glow"
                        : "hover:border-border-hover"
                    )}
                    onClick={() => store.setField("budgetMonthly", budget.value)}
                  >
                    <p className="font-semibold text-text-primary">
                      {budget.label}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="ghost"
          onClick={store.prevStep}
          disabled={store.step === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()}>
          {store.step === 5 ? "Analyser mon marché" : "Suivant"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
