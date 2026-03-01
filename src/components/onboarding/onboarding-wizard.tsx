"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { StepIndicator } from "@/components/shared/step-indicator";
import { StepIdentity } from "@/components/onboarding/step-identity";
import { StepSituation } from "@/components/onboarding/step-situation";
import { StepSkillsVault } from "@/components/onboarding/step-skills-vault";
import { StepExpertise } from "@/components/onboarding/step-expertise";
import { StepParcours } from "@/components/onboarding/step-parcours";
import { StepObjectives } from "@/components/onboarding/step-objectives";
import { StepResources } from "@/components/onboarding/step-resources";
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
  "Identité",
  "Situation",
  "Compétences",
  "Expertise",
  "Parcours",
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
    key: "skills" | "industries" | "objectives" | "formations",
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
      case 0: // Identity
        return store.firstName.trim() !== "" && store.lastName.trim() !== "";
      case 1: // Situation
        return store.situation !== "";
      case 2: // Vault Skills
        return store.vaultSkills.length > 0;
      case 3: // Expertise
        return true; // Optionnel
      case 4: // Parcours
        return store.parcours !== "";
      case 5: // Experience
        return store.experienceLevel !== "";
      case 6: // Revenue
        return store.currentRevenue >= 0 && store.targetRevenue > 0;
      case 7: // Industries
        return store.industries.length > 0;
      case 8: // Objectives
        return store.objectives.length > 0;
      case 9: // Budget
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
          firstName: store.firstName,
          lastName: store.lastName,
          country: store.country,
          language: store.language,
          situation: store.situation,
          situationDetails: store.situationDetails,
          skills: store.skills,
          vaultSkills: store.vaultSkills,
          expertiseAnswers: store.expertiseAnswers,
          parcours: store.parcours,
          experienceLevel: store.experienceLevel,
          currentRevenue: store.currentRevenue,
          targetRevenue: store.targetRevenue,
          industries: store.industries,
          objectives: store.objectives,
          budgetMonthly: store.budgetMonthly,
          hoursPerWeek: store.hoursPerWeek,
          deadline: store.deadline,
          teamSize: store.teamSize,
          formations: store.formations,
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
        onboarding_step: 11,
        first_name: store.firstName,
        last_name: store.lastName,
        country: store.country,
        language: store.language,
        situation: store.situation || null,
        situation_details: store.situationDetails,
        skills: store.skills,
        vault_skills: store.vaultSkills,
        expertise_answers: store.expertiseAnswers,
        parcours: store.parcours || null,
        experience_level: store.experienceLevel as
          | "beginner"
          | "intermediate"
          | "advanced",
        current_revenue: store.currentRevenue,
        target_revenue: store.targetRevenue,
        industries: store.industries,
        objectives: store.objectives,
        budget_monthly: store.budgetMonthly,
        hours_per_week: store.hoursPerWeek,
        deadline: store.deadline,
        team_size: store.teamSize,
        formations: store.formations,
        vault_completed: true,
        selected_market: market.name,
        market_viability_score: market.viability_score,
        niche: market.name,
      })
      .eq("id", user.id);

    router.push("/offer");
    router.refresh();
  };

  const handleNext = () => {
    if (store.step === 9) {
      handleAnalyze();
    } else {
      store.nextStep();
    }
  };

  // Afficher les resultats d'analyse
  if (analysisResult) {
    return (
      <MarketAnalysis
        result={analysisResult}
        onSelect={handleSelectMarket}
      />
    );
  }

  // Afficher le chargement
  if (isAnalyzing) {
    return <AILoading text="Analyse de ton marché en cours" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Indicateur de steps */}
      <StepIndicator steps={STEPS} currentStep={store.step} />

      {/* Erreur */}
      {error && (
        <div className="rounded-[8px] bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Contenu du step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={store.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 0: Identity */}
          {store.step === 0 && <StepIdentity store={store} />}

          {/* Step 1: Situation */}
          {store.step === 1 && <StepSituation store={store} />}

          {/* Step 2: Vault Skills */}
          {store.step === 2 && <StepSkillsVault store={store} />}

          {/* Step 3: Expertise */}
          {store.step === 3 && <StepExpertise store={store} />}

          {/* Step 4: Parcours */}
          {store.step === 4 && <StepParcours store={store} />}

          {/* Step 5: Experience */}
          {store.step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">
                Quel est ton niveau d&apos;expérience ?
              </h2>
              <div className="grid gap-3">
                {EXPERIENCE_LEVELS.map((level) => (
                  <Card
                    key={level.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      store.experienceLevel === level.value
                        ? "border-accent bg-accent-muted"
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

          {/* Step 6: Revenue */}
          {store.step === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">
                Tes revenus actuels et objectifs
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Revenu mensuel actuel (EUR)</Label>
                  <Input
                    type="number"
                    value={store.currentRevenue || ""}
                    onChange={(e) =>
                      store.setField(
                        "currentRevenue",
                        Number(e.target.value)
                      )
                    }
                    placeholder="Ex: 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objectif de revenu mensuel (EUR)</Label>
                  <Input
                    type="number"
                    value={store.targetRevenue || ""}
                    onChange={(e) =>
                      store.setField(
                        "targetRevenue",
                        Number(e.target.value)
                      )
                    }
                    placeholder="Ex: 30000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Industries */}
          {store.step === 7 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">
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
                          ? "border-accent bg-accent-muted text-accent"
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

          {/* Step 8: Objectives & Constraints */}
          {store.step === 8 && (
            <StepObjectives store={store} toggleArrayItem={toggleArrayItem} />
          )}

          {/* Step 9: Budget */}
          {store.step === 9 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">
                Quel est ton budget pub mensuel ?
              </h2>
              <div className="grid gap-3">
                {BUDGETS.map((budget) => (
                  <Card
                    key={budget.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      store.budgetMonthly === budget.value
                        ? "border-accent bg-accent-muted"
                        : "hover:border-border-hover"
                    )}
                    onClick={() =>
                      store.setField("budgetMonthly", budget.value)
                    }
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
          {store.step === 9 ? "Analyser mon marché" : "Suivant"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
