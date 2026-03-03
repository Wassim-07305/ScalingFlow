"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import confetti from "canvas-confetti";
import { ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils/cn";
import { AnimatedBackground } from "./animated-background";
import { OnboardingProgressBar } from "./onboarding-progress-bar";
import { OnboardingTopBar } from "./onboarding-top-bar";
import { ChipSelector } from "./chip-selector";
import { MultiChipSelector } from "./multi-chip-selector";
import { OnboardingSkillMatrix } from "./onboarding-skill-matrix";
import { OnboardingSummary } from "./onboarding-summary";
import { QUESTIONS } from "./questions";
import { AILoading } from "@/components/shared/ai-loading";
import { MarketAnalysis } from "@/components/onboarding/market-analysis";
import type { MarketAnalysisResult } from "@/types/ai";
import type {
  VaultSkillCategory,
  SituationDetails,
} from "@/stores/onboarding-store";

/* ─── Initial state ─── */

const INITIAL_FORM_DATA: Record<string, unknown> = {
  firstName: "",
  lastName: "",
  country: "",
  language: "",
  situation: "",
  situationDetails: {},
  vaultSkills: [],
  expertise_q1: "",
  expertise_q2: "",
  expertise_q3: "",
  expertise_q4: "",
  expertise_q5: "",
  expertise_q6: "",
  parcours: "",
  experienceLevel: "",
  currentRevenue: "",
  targetRevenue: "",
  industries: [],
  objectives: [],
  budgetMonthly: "",
};

/* ─── Animation variants ─── */

const slideVariants = {
  enter: (d: number) => ({ y: d > 0 ? 40 : -40, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: number) => ({ y: d > 0 ? -40 : 40, opacity: 0 }),
};

/* ─── Situation-specific fields ─── */

const SITUATION_FIELDS: Record<
  string,
  { key: string; label: string; placeholder: string; type?: string }[]
> = {
  salarie: [
    {
      key: "poste",
      label: "Ton poste actuel",
      placeholder: "Ex: Chef de projet digital",
    },
    {
      key: "secteur",
      label: "Ton secteur",
      placeholder: "Ex: Tech, Finance, Sante...",
    },
    {
      key: "biggest_challenge",
      label: "Ton plus gros challenge",
      placeholder: "Ce qui te bloque pour te lancer...",
    },
  ],
  freelance: [
    {
      key: "missions",
      label: "Tes missions principales",
      placeholder: "Ex: Developpement web, consulting...",
    },
    {
      key: "ca_actuel",
      label: "CA annuel actuel (EUR)",
      placeholder: "Ex: 50000",
      type: "number",
    },
    {
      key: "clients_count",
      label: "Nombre de clients actifs",
      placeholder: "Ex: 5",
      type: "number",
    },
    {
      key: "biggest_challenge",
      label: "Ton plus gros challenge",
      placeholder: "Ce qui t'empeche de scaler...",
    },
  ],
  entrepreneur: [
    {
      key: "ca_actuel",
      label: "CA annuel actuel (EUR)",
      placeholder: "Ex: 200000",
      type: "number",
    },
    {
      key: "clients_count",
      label: "Nombre de clients",
      placeholder: "Ex: 50",
      type: "number",
    },
    {
      key: "biggest_challenge",
      label: "Ton plus gros challenge",
      placeholder: "L'obstacle principal pour passer au next level...",
    },
  ],
  zero: [
    {
      key: "biggest_challenge",
      label: "Qu'est-ce qui te bloque ?",
      placeholder: "Decris ce qui t'empeche de demarrer...",
    },
  ],
};

/* ─── Helper: build expertise answers object ─── */

function buildExpertiseAnswers(
  formData: Record<string, unknown>
): Record<string, string> {
  const ea: Record<string, string> = {};
  for (let i = 1; i <= 6; i++) {
    const val = formData[`expertise_q${i}`];
    if (val) ea[`q${i}`] = String(val);
  }
  return ea;
}

/* ═══════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════ */

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] =
    useState<Record<string, unknown>>(INITIAL_FORM_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<MarketAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  /* ── Visible questions (filter showWhen) ── */

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.showWhen || q.showWhen(formData)),
    [formData]
  );

  const currentQuestion = visibleQuestions[step];
  const totalSteps = visibleQuestions.length;

  /* ── Load profile on mount (resume) ── */

  useEffect(() => {
    if (userLoading || loaded) return;
    if (!user) {
      setLoaded(true);
      return;
    }

    const load = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          const r: Record<string, unknown> = { ...INITIAL_FORM_DATA };
          if (profile.first_name) r.firstName = profile.first_name;
          if (profile.last_name) r.lastName = profile.last_name;
          if (profile.country) r.country = profile.country;
          if (profile.language) r.language = profile.language;
          if (profile.situation) r.situation = profile.situation;
          if (profile.situation_details)
            r.situationDetails = profile.situation_details;
          if (Array.isArray(profile.vault_skills))
            r.vaultSkills = profile.vault_skills;
          if (profile.expertise_answers) {
            const ea = profile.expertise_answers as Record<string, string>;
            Object.entries(ea).forEach(([k, v]) => {
              r[`expertise_${k}`] = v;
            });
          }
          if (profile.parcours) r.parcours = profile.parcours;
          if (profile.experience_level)
            r.experienceLevel = profile.experience_level;
          if (profile.current_revenue)
            r.currentRevenue = String(profile.current_revenue);
          if (profile.target_revenue)
            r.targetRevenue = String(profile.target_revenue);
          if (Array.isArray(profile.industries))
            r.industries = profile.industries;
          if (Array.isArray(profile.objectives))
            r.objectives = profile.objectives;
          if (profile.budget_monthly != null)
            r.budgetMonthly = String(profile.budget_monthly);

          // Compute visible questions from restored data for correct step
          const restoredVisible = QUESTIONS.filter(
            (q) => !q.showWhen || q.showWhen(r)
          );
          const resumeStep = Math.min(
            Math.max(profile.onboarding_step || 0, 0),
            restoredVisible.length - 1
          );

          setFormData(r);
          if (resumeStep > 0) setStep(resumeStep);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoaded(true);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  /* ── Auto-focus inputs on step change ── */

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        "[data-autofocus]"
      );
      el?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, [step]);

  /* ── Field setter ── */

  const setField = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /* ── Progressive save ── */

  const saveProgress = useCallback(
    async (nextStep: number) => {
      if (!user) return;
      await supabase
        .from("profiles")
        .update({
          onboarding_step: nextStep,
          first_name: (formData.firstName as string) || null,
          last_name: (formData.lastName as string) || null,
          country: (formData.country as string) || null,
          language: (formData.language as string) || null,
          situation: (formData.situation as string) || null,
          situation_details: formData.situationDetails || {},
          vault_skills: formData.vaultSkills || [],
          expertise_answers: buildExpertiseAnswers(formData),
          parcours: (formData.parcours as string) || null,
          experience_level: (formData.experienceLevel as string) || null,
          current_revenue: Number(formData.currentRevenue) || 0,
          target_revenue: Number(formData.targetRevenue) || 0,
          industries: (formData.industries as string[]) || [],
          objectives: (formData.objectives as string[]) || [],
          budget_monthly: Number(formData.budgetMonthly) || 0,
        })
        .eq("id", user.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, formData]
  );

  /* ── Navigation ── */

  const goNext = useCallback(() => {
    if (step >= totalSteps - 1) return;
    const next = step + 1;
    setDirection(1);
    setStep(next);
    saveProgress(next);
  }, [step, totalSteps, saveProgress]);

  const goPrev = useCallback(() => {
    if (step <= 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step]);

  /* ── Validation ── */

  const canProceed = useCallback(() => {
    if (!currentQuestion) return false;
    const { type, field } = currentQuestion;

    switch (type) {
      case "welcome":
        return true;
      case "text":
        return String(formData[field!] || "").trim() !== "";
      case "text-euro":
        return String(formData[field!] || "").trim() !== "";
      case "textarea":
        return true; // Expertise questions are optional
      case "chips":
        return String(formData[field!] || "").trim() !== "";
      case "chips-multi":
        return ((formData[field!] as string[]) || []).length > 0;
      case "multi-field":
        return true;
      case "skill-matrix":
        return ((formData[field!] as VaultSkillCategory[]) || []).length > 0;
      case "summary":
        return true;
      default:
        return false;
    }
  }, [currentQuestion, formData]);

  /* ── Market analysis ── */

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    await saveProgress(step);

    try {
      const res = await fetch("/api/ai/analyze-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          country: formData.country,
          language: formData.language,
          situation: formData.situation,
          situationDetails: formData.situationDetails,
          skills: [],
          vaultSkills: formData.vaultSkills,
          expertiseAnswers: buildExpertiseAnswers(formData),
          parcours: formData.parcours,
          experienceLevel: formData.experienceLevel,
          currentRevenue: Number(formData.currentRevenue) || 0,
          targetRevenue: Number(formData.targetRevenue) || 0,
          industries: formData.industries,
          objectives: formData.objectives,
          budgetMonthly: Number(formData.budgetMonthly) || 0,
          hoursPerWeek: 0,
          deadline: "",
          teamSize: 1,
          formations: [],
        }),
      });

      if (!res.ok) throw new Error("Erreur analyse");
      const data: MarketAnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch {
      setError("Erreur lors de l'analyse. Reessaie.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ── Select market + complete onboarding ── */

  const handleSelectMarket = async (marketIndex: number) => {
    if (!user || !analysisResult) return;
    const market = analysisResult.markets[marketIndex];

    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: totalSteps,
        first_name: (formData.firstName as string) || null,
        last_name: (formData.lastName as string) || null,
        country: (formData.country as string) || null,
        language: (formData.language as string) || null,
        situation: (formData.situation as string) || null,
        situation_details: formData.situationDetails || {},
        vault_skills: formData.vaultSkills || [],
        expertise_answers: buildExpertiseAnswers(formData),
        parcours: (formData.parcours as string) || null,
        experience_level: (formData.experienceLevel as string) as
          | "beginner"
          | "intermediate"
          | "advanced",
        current_revenue: Number(formData.currentRevenue) || 0,
        target_revenue: Number(formData.targetRevenue) || 0,
        industries: (formData.industries as string[]) || [],
        objectives: (formData.objectives as string[]) || [],
        budget_monthly: Number(formData.budgetMonthly) || 0,
        hours_per_week: 0,
        deadline: "",
        team_size: 1,
        formations: [],
        vault_completed: true,
        selected_market: market.name,
        market_viability_score: market.viability_score,
        niche: market.name,
      })
      .eq("id", user.id);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#34d399", "#2dd4bf", "#06b6d4"],
    });

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  };

  /* ── Keyboard: Enter to advance ── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (!currentQuestion) return;
      const t = currentQuestion.type;
      // Don't advance for textarea, multi-field, summary, welcome
      if (
        t === "textarea" ||
        t === "multi-field" ||
        t === "summary" ||
        t === "welcome"
      )
        return;
      if (canProceed()) goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentQuestion, canProceed, goNext]);

  /* ═══════════════════════════════════════════
     Render helpers
     ═══════════════════════════════════════════ */

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    const q = currentQuestion;
    const fieldValue = q.field ? formData[q.field] : undefined;

    switch (q.type) {
      /* ── Welcome ── */
      case "welcome":
        return (
          <div className="flex flex-col items-center text-center">
            <Image
              src="/icons/icon-192.png"
              alt="ScalingFlow"
              width={80}
              height={80}
              className="mb-6 rounded-2xl"
            />
            <h1 className="text-3xl font-bold sm:text-4xl">{q.title}</h1>
            {q.subtitle && (
              <p className="mt-4 max-w-md text-base text-white/50">
                {q.subtitle}
              </p>
            )}
          </div>
        );

      /* ── Text input ── */
      case "text":
        return (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{q.title}</h2>
              {q.subtitle && (
                <p className="mt-2 text-sm text-white/50">{q.subtitle}</p>
              )}
            </div>
            <input
              data-autofocus
              type="text"
              value={String(fieldValue || "")}
              onChange={(e) => setField(q.field!, e.target.value)}
              placeholder={q.placeholder}
              className="w-full border-b-2 border-white/20 bg-transparent pb-3 text-center text-2xl font-medium text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
            />
          </div>
        );

      /* ── Euro input ── */
      case "text-euro":
        return (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{q.title}</h2>
            </div>
            <div className="relative">
              <input
                data-autofocus
                type="number"
                value={String(fieldValue || "")}
                onChange={(e) => setField(q.field!, e.target.value)}
                placeholder={q.placeholder}
                className="w-full border-b-2 border-white/20 bg-transparent pb-3 pr-14 text-center text-2xl font-medium text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
              />
              <span className="absolute bottom-3 right-0 text-lg text-white/40">
                EUR
              </span>
            </div>
          </div>
        );

      /* ── Textarea ── */
      case "textarea":
        return (
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold sm:text-2xl">{q.title}</h2>
              {q.subtitle && (
                <p className="mt-2 text-sm text-white/50">{q.subtitle}</p>
              )}
            </div>
            <textarea
              data-autofocus
              value={String(fieldValue || "")}
              onChange={(e) => setField(q.field!, e.target.value)}
              placeholder={q.placeholder}
              rows={4}
              className="w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 p-4 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
            />
          </div>
        );

      /* ── Single-select chips (auto-advance) ── */
      case "chips":
        return (
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{q.title}</h2>
              {q.subtitle && (
                <p className="mt-2 text-sm text-white/50">{q.subtitle}</p>
              )}
            </div>
            <ChipSelector
              options={q.chips || []}
              value={String(fieldValue || "")}
              onChange={(v) => setField(q.field!, v)}
              onAutoAdvance={goNext}
              hasOther={q.hasOther}
              columns={q.chipColumns}
            />
          </div>
        );

      /* ── Multi-select chips ── */
      case "chips-multi":
        return (
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{q.title}</h2>
              {q.subtitle && (
                <p className="mt-2 text-sm text-white/50">{q.subtitle}</p>
              )}
            </div>
            <MultiChipSelector
              options={q.chips || []}
              value={(fieldValue as string[]) || []}
              onChange={(v) => setField(q.field!, v)}
            />
          </div>
        );

      /* ── Multi-field (situation details) ── */
      case "multi-field": {
        const situation = String(formData.situation || "zero");
        const fields = SITUATION_FIELDS[situation] || SITUATION_FIELDS.zero;
        const details = (formData.situationDetails as SituationDetails) || {};

        return (
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{q.title}</h2>
              {q.subtitle && (
                <p className="mt-2 text-sm text-white/50">{q.subtitle}</p>
              )}
            </div>
            <div className="space-y-4">
              {fields.map((f, idx) => (
                <div key={f.key} className="space-y-2">
                  <label className="text-sm font-medium text-white/60">
                    {f.label}
                  </label>
                  <input
                    {...(idx === 0 ? { "data-autofocus": true } : {})}
                    type={f.type || "text"}
                    value={String(
                      details[f.key as keyof SituationDetails] || ""
                    )}
                    onChange={(e) => {
                      const updated = {
                        ...details,
                        [f.key]:
                          f.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      };
                      setField("situationDetails", updated);
                    }}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      /* ── Skill matrix ── */
      case "skill-matrix":
        return (
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{q.title}</h2>
              {q.subtitle && (
                <p className="mt-2 text-sm text-white/50">{q.subtitle}</p>
              )}
            </div>
            <OnboardingSkillMatrix
              value={(fieldValue as VaultSkillCategory[]) || []}
              onChange={(v) => setField(q.field!, v)}
            />
          </div>
        );

      /* ── Summary ── */
      case "summary":
        return (
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{q.title}</h2>
              {q.subtitle && (
                <p className="mt-2 text-sm text-white/50">{q.subtitle}</p>
              )}
            </div>
            <OnboardingSummary
              data={{
                ...formData,
                expertiseAnswers: buildExpertiseAnswers(formData),
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  /* ═══════════════════════════════════════════
     Screen: Market analysis result
     ═══════════════════════════════════════════ */

  if (analysisResult) {
    return (
      <div className="relative min-h-dvh bg-[#0B0E11] text-white">
        <AnimatedBackground />
        <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-12">
          <MarketAnalysis
            result={analysisResult}
            onSelect={handleSelectMarket}
          />
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     Screen: Analyzing
     ═══════════════════════════════════════════ */

  if (isAnalyzing) {
    return (
      <div className="relative min-h-dvh bg-[#0B0E11] text-white">
        <AnimatedBackground />
        <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center">
          <AILoading text="Analyse de ton marche en cours" />
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     Screen: Loading profile
     ═══════════════════════════════════════════ */

  if (!loaded) {
    return (
      <div className="relative min-h-dvh bg-[#0B0E11] text-white">
        <AnimatedBackground />
        <div className="relative z-10 flex min-h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     Screen: Question flow
     ═══════════════════════════════════════════ */

  const isWelcome = currentQuestion?.type === "welcome";
  const isSummary = currentQuestion?.type === "summary";

  let buttonLabel = "Continuer";
  if (isWelcome) buttonLabel = "C'est parti";
  if (isSummary) buttonLabel = "Lancer l'analyse IA";

  const handleButtonClick = () => {
    if (isSummary) {
      handleAnalyze();
    } else {
      goNext();
    }
  };

  if (!loaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0B0E11]">
        <AnimatedBackground />
        <AILoading text="Chargement" />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[#0B0E11] text-white">
      <AnimatedBackground />
      <OnboardingProgressBar step={step} total={totalSteps} />

      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* Top bar (hidden on welcome) */}
        {!isWelcome && (
          <OnboardingTopBar
            onBack={goPrev}
            step={step}
            total={totalSteps}
            isFirst={step === 0}
          />
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-32">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion?.id || step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex w-full max-w-2xl flex-col items-center"
            >
              {renderQuestion()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom button */}
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center bg-gradient-to-t from-[#0B0E11] via-[#0B0E11]/80 to-transparent px-6 pb-8 pt-12">
          <button
            onClick={handleButtonClick}
            disabled={!canProceed()}
            className={cn(
              "flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold transition-all duration-300",
              canProceed()
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40"
                : "cursor-not-allowed bg-white/10 text-white/30"
            )}
          >
            {isSummary ? (
              <>
                <Sparkles className="h-5 w-5" />
                {buttonLabel}
              </>
            ) : (
              <>
                {buttonLabel}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-500/20 px-6 py-3 text-sm text-red-300 backdrop-blur">
          {error}
        </div>
      )}
    </div>
  );
}
