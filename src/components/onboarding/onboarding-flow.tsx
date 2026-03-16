"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import confetti from "canvas-confetti";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils/cn";
import { AnimatedBackground, onboardingBg } from "./animated-background";
import { OnboardingProgressBar } from "./onboarding-progress-bar";
import { OnboardingTopBar } from "./onboarding-top-bar";
import { ChipSelector } from "./chip-selector";
import { MultiChipSelector } from "./multi-chip-selector";
import { OnboardingSummary } from "./onboarding-summary";
import { ParcoursSelector } from "./parcours-selector";
import { SkillMatrixSelector } from "./skill-matrix-selector";
import { ParcoursQuestionsForm } from "./parcours-questions-form";
import { EXPERTISE_PROFONDE_FIELDS } from "./skill-categories";
import { QUESTIONS } from "./questions";
import { AILoading } from "@/components/shared/ai-loading";
import { MarketAnalysis } from "@/components/onboarding/market-analysis";
import type { MarketAnalysisResult } from "@/types/ai";
import type { SituationDetails } from "@/stores/onboarding-store";
import type { SelectedSkill } from "./skill-categories";

/* ─── Initial state ─── */

const INITIAL_FORM_DATA: Record<string, unknown> = {
  firstName: "",
  lastName: "",
  country: "",
  language: "",
  situation: "",
  formations_text: "",
  situationDetails: {},
  vaultSkills: [],
  expertiseProfonde: {},
  parcours: "",
  parcoursAnswers: {},
  targetRevenue: "",
  industries: [],
  objectives: [],
  budgetMonthly: "",
  hoursPerWeek: "",
  deadline: "",
  teamPreference: "",
  hasPayingClients: "",
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
  {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    multiline?: boolean;
  }[]
> = {
  zero: [
    {
      key: "biggest_challenge",
      label: "Qu'est-ce qui te bloque pour démarrer ?",
      placeholder: "Ex : Je ne sais pas quoi vendre, pas d'idée de business...",
    },
  ],
  salarie: [
    {
      key: "poste",
      label: "Quel est ton poste actuel ?",
      placeholder: "Ex : Chef de projet digital",
    },
    {
      key: "secteur",
      label: "Quel secteur ?",
      placeholder: "Ex : Tech, Finance, Santé...",
    },
    {
      key: "biggest_challenge",
      label: "Ton plus gros challenge pour te lancer",
      placeholder: "Ce qui te bloque...",
    },
  ],
  freelance: [
    {
      key: "missions",
      label: "Quel type de missions tu fais ?",
      placeholder: "Ex : Développement web, consulting...",
    },
    {
      key: "client_type",
      label: "Pour quel type de clients ?",
      placeholder: "Ex : PME, startups, agences...",
    },
    {
      key: "ca_actuel",
      label: "CA mensuel moyen (EUR)",
      placeholder: "Ex : 5000",
      type: "number",
    },
    {
      key: "biggest_challenge",
      label: "Qu'est-ce qui te frustre le plus dans ton modèle actuel ?",
      placeholder: "Ex : Je trade mon temps contre de l'argent...",
    },
  ],
  entrepreneur: [
    {
      key: "business",
      label: "Quel est ton business ?",
      placeholder: "Ex : Agence de marketing, coaching fitness...",
    },
    {
      key: "ca_actuel",
      label: "CA mensuel actuel (EUR)",
      placeholder: "Ex : 15000",
      type: "number",
    },
    {
      key: "business_model",
      label: "Comment fonctionne ton business ?",
      placeholder:
        "Ex : Vente de formations en ligne, prestations de service, SaaS...",
      multiline: true,
    },
    {
      key: "delivery_description",
      label: "Que délivres-tu exactement ?",
      placeholder:
        "Ex : Accompagnement 1-to-1 sur 3 mois, formation vidéo + coaching de groupe...",
      multiline: true,
    },
    {
      key: "active_clients",
      label: "Combien de clients actifs ?",
      placeholder: "Ex : 12",
      type: "number",
    },
    {
      key: "delivery_process",
      label: "Quel est ton process de delivery ?",
      placeholder:
        "Ex : Onboarding → audit → plan d'action → suivi hebdo → bilan...",
      multiline: true,
    },
    {
      key: "best_result",
      label: "Ton meilleur résultat client",
      placeholder: "Ex : Client passé de 5K à 20K/mois en 3 mois...",
    },
    {
      key: "biggest_challenge",
      label: "Ton plus gros bottleneck actuel",
      placeholder: "Ex : Pas assez de leads, taux de closing trop bas...",
    },
  ],
  etudiant: [
    {
      key: "etudes",
      label: "Qu'est-ce que tu étudies ?",
      placeholder: "Ex : Marketing digital, commerce, informatique...",
    },
    {
      key: "biggest_challenge",
      label: "Qu'est-ce qui te bloque pour te lancer ?",
      placeholder: "Ex : Pas d'expérience, pas de budget...",
    },
  ],
  reconversion: [
    {
      key: "ancien_poste",
      label: "Ton ancien métier / poste",
      placeholder: "Ex : Commercial B2B, RH, comptable...",
    },
    {
      key: "biggest_challenge",
      label: "Pourquoi tu veux changer ?",
      placeholder: "Ex : Je veux plus de liberté, meilleure rémunération...",
    },
  ],
  sans_emploi: [
    {
      key: "ancien_poste",
      label: "Ton dernier poste / expérience",
      placeholder: "Ex : Responsable marketing, commercial...",
    },
    {
      key: "biggest_challenge",
      label: "Qu'est-ce qui te bloque pour démarrer ?",
      placeholder: "Ex : Je ne sais pas par où commencer...",
    },
  ],
};

/* ─── Helper: build expertise answers object ─── */

function buildExpertiseAnswers(
  formData: Record<string, unknown>,
): Record<string, string> {
  const ea: Record<string, string> = {};
  const val = formData.expertise_q1;
  if (val) ea.q1 = String(val);
  return ea;
}

/* ─── Helper: build profile save payload ─── */

function buildProfilePayload(formData: Record<string, unknown>) {
  return {
    first_name: (formData.firstName as string) || null,
    last_name: (formData.lastName as string) || null,
    country: (formData.country as string) || null,
    language: (formData.language as string) || null,
    situation: (formData.situation as string) || null,
    situation_details: formData.situationDetails || {},
    vault_skills: formData.vaultSkills || [],
    expertise_profonde: formData.expertiseProfonde || {},
    expertise_answers: buildExpertiseAnswers(formData),
    parcours: (formData.parcours as string) || null,
    parcours_answers: formData.parcoursAnswers || {},
    target_revenue: Number(formData.targetRevenue) || 0,
    industries: (formData.industries as string[]) || [],
    objectives: (formData.objectives as string[]) || [],
    budget_monthly: Number(formData.budgetMonthly) || 0,
    hours_per_week: Number(formData.hoursPerWeek) || 0,
    deadline: (formData.deadline as string) || null,
    team_preference: (formData.teamPreference as string) || null,
    has_paying_clients: (formData.hasPayingClients as string) || null,
    formations_text: (formData.formations_text as string) || null,
    vault_completed: true,
  };
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
  const [customWelcomeMessage, setCustomWelcomeMessage] = useState<
    string | null
  >(null);

  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const supabase = createClient();

  /* ── Visible questions (filter showWhen) ── */

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.showWhen || q.showWhen(formData)),
    [formData],
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
          if (profile.expertise_answers) {
            const ea = profile.expertise_answers as Record<string, string>;
            if (ea.q1) r.expertise_q1 = ea.q1;
          }
          if (Array.isArray(profile.vault_skills))
            r.vaultSkills = profile.vault_skills;
          if (profile.expertise_profonde)
            r.expertiseProfonde = profile.expertise_profonde;
          if (profile.parcours) r.parcours = profile.parcours;
          if (profile.parcours_answers)
            r.parcoursAnswers = profile.parcours_answers;
          if (profile.target_revenue)
            r.targetRevenue = String(profile.target_revenue);
          if (Array.isArray(profile.industries))
            r.industries = profile.industries;
          if (Array.isArray(profile.objectives))
            r.objectives = profile.objectives;
          if (profile.budget_monthly != null)
            r.budgetMonthly = String(profile.budget_monthly);
          if (profile.hours_per_week)
            r.hoursPerWeek = String(profile.hours_per_week);
          if (profile.deadline) r.deadline = profile.deadline;
          if (profile.team_preference)
            r.teamPreference = profile.team_preference;
          if (profile.has_paying_clients)
            r.hasPayingClients = profile.has_paying_clients;
          if (profile.formations_text)
            r.formations_text = profile.formations_text;

          // Compute visible questions from restored data for correct step
          const restoredVisible = QUESTIONS.filter(
            (q) => !q.showWhen || q.showWhen(r),
          );
          const resumeStep = Math.min(
            Math.max(profile.onboarding_step || 0, 0),
            restoredVisible.length - 1,
          );

          setFormData(r);
          if (resumeStep > 0) setStep(resumeStep);
        }
      } catch {
        // Profile load failed silently — user will start fresh
      } finally {
        setLoaded(true);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  /* ── Fetch custom onboarding from organization ── */

  useEffect(() => {
    if (userLoading || !profile?.organization_id) return;

    const fetchOrgOnboarding = async () => {
      const { data: org } = await supabase
        .from("organizations")
        .select("custom_welcome_message")
        .eq("id", profile.organization_id as string)
        .maybeSingle();

      if (org?.custom_welcome_message) {
        setCustomWelcomeMessage(org.custom_welcome_message);
      }
    };

    fetchOrgOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.organization_id, userLoading]);

  /* ── Auto-focus inputs on step change ── */

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        "[data-autofocus]",
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
          ...buildProfilePayload(formData),
        })
        .eq("id", user.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, formData],
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
      case "textarea":
        return true; // optional
      case "chips":
        return String(formData[field!] || "").trim() !== "";
      case "parcours-selector":
        return String(formData[field!] || "").trim() !== "";
      case "chips-multi":
        return ((formData[field!] as string[]) || []).length > 0;
      case "multi-field":
        return true;
      case "skill-matrix":
        return true; // optional — user can skip
      case "parcours-questions":
        return true; // optional — user can skip
      case "summary":
        return true;
      default:
        return false;
    }
  }, [currentQuestion, formData]);

  /* ── Skip analysis + complete onboarding ── */

  const handleSkipAnalysis = async () => {
    if (!user) return;
    await saveProgress(totalSteps);

    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: totalSteps,
        ...buildProfilePayload(formData),
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
          country: formData.country,
          language: formData.language,
          situation: formData.situation,
          situationDetails: formData.situationDetails || {},
          skills: [],
          vaultSkills: formData.vaultSkills || [],
          expertiseAnswers: buildExpertiseAnswers(formData),
          parcours: formData.parcours,
          parcoursAnswers: formData.parcoursAnswers || {},
          expertiseProfonde: formData.expertiseProfonde || {},
          targetRevenue: Number(formData.targetRevenue) || 0,
          industries: formData.industries,
          objectives: formData.objectives,
          budgetMonthly: Number(formData.budgetMonthly) || 0,
          hoursPerWeek: Number(formData.hoursPerWeek) || 0,
          deadline: formData.deadline,
          teamPreference: formData.teamPreference,
          hasPayingClients: formData.hasPayingClients,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const msg = errorBody?.error || `Erreur serveur (${res.status})`;
        throw new Error(msg);
      }
      const data: MarketAnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur lors de l'analyse : ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ── Select market + complete onboarding ── */

  const handleSelectMarket = async (marketIndex: number) => {
    if (!user || !analysisResult) {
      const msg = "Session expirée. Recharge la page et réessaie.";
      setError(msg);
      throw new Error(msg);
    }
    const market = analysisResult.markets[marketIndex];
    const payload = {
      onboarding_step: totalSteps,
      ...buildProfilePayload(formData),
      selected_market: market.name,
      market_viability_score: market.viability_score,
      niche: market.name,
    };

    // Use server-side API to bypass RLS and ensure reliable save
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const msg = errorBody?.error || `Erreur serveur (${res.status})`;
      setError(msg);
      throw new Error(msg);
    }

    try {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#34d399", "#2dd4bf", "#06b6d4"],
      });
    } catch {
      // confetti is non-critical
    }

    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  /* ── Keyboard: Enter to advance ── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (!currentQuestion) return;
      const t = currentQuestion.type;
      if (
        t === "textarea" ||
        t === "multi-field" ||
        t === "parcours-selector" ||
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mb-8 h-24 w-24 overflow-hidden rounded-3xl shadow-2xl shadow-emerald-500/30"
            >
              <Image
                src="/icons/icon-192.png"
                alt="ScalingFlow"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl"
            >
              {q.title}
            </motion.h1>
            {(customWelcomeMessage || q.subtitle) && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-10 max-w-md text-lg text-white/50"
              >
                {customWelcomeMessage || q.subtitle}
              </motion.p>
            )}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={goNext}
              className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40"
            >
              C&apos;est parti
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </motion.button>
          </div>
        );

      /* ── Text input ── */
      case "text":
        return (
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
              )}
            </div>
            <input
              data-autofocus
              type="text"
              value={String(fieldValue || "")}
              onChange={(e) => setField(q.field!, e.target.value)}
              placeholder={q.placeholder}
              className="w-full border-b-2 border-white/20 bg-transparent pb-3 text-2xl font-medium text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-emerald-400 focus:shadow-[0_2px_0_0_rgba(52,211,153,0.3)] sm:text-3xl"
            />
          </div>
        );

      /* ── Textarea ── */
      case "textarea":
        return (
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
              )}
            </div>
            <textarea
              data-autofocus
              value={String(fieldValue || "")}
              onChange={(e) => setField(q.field!, e.target.value)}
              placeholder={q.placeholder}
              rows={4}
              className="w-full resize-none rounded-xl border-2 border-white/20 bg-white/5 px-5 py-4 text-lg text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
        );

      /* ── Single-select chips (auto-advance) ── */
      case "chips":
        return (
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
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
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
              )}
            </div>
            <MultiChipSelector
              options={q.chips || []}
              value={(fieldValue as string[]) || []}
              onChange={(v) => setField(q.field!, v)}
            />
          </div>
        );

      /* ── Multi-field (situation details OR expertise profonde) ── */
      case "multi-field": {
        // Expertise profonde (CDC Étape 0.3)
        if (q.field === "expertiseProfonde") {
          const epData =
            (formData.expertiseProfonde as Record<string, string>) || {};
          return (
            <div className="w-full max-w-lg">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {q.title}
                </h2>
                {q.subtitle && (
                  <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
                )}
              </div>
              <div className="space-y-5">
                {EXPERTISE_PROFONDE_FIELDS.map((f, idx) => (
                  <div key={f.key}>
                    <label className="mb-2 block text-sm font-medium text-white/50">
                      {f.label}
                    </label>
                    <input
                      {...(idx === 0 ? { "data-autofocus": true } : {})}
                      type="text"
                      value={epData[f.key] || ""}
                      onChange={(e) => {
                        setField("expertiseProfonde", {
                          ...epData,
                          [f.key]: e.target.value,
                        });
                      }}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border-2 border-white/20 bg-white/5 px-5 py-3.5 text-lg text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Situation details (existing)
        const situation = String(formData.situation || "zero");
        const fields = SITUATION_FIELDS[situation] || SITUATION_FIELDS.zero;
        const details = (formData.situationDetails as SituationDetails) || {};

        return (
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
              )}
            </div>
            <div className="space-y-5">
              {fields.map((f, idx) => (
                <div key={f.key}>
                  <label className="mb-2 block text-sm font-medium text-white/50">
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <textarea
                      {...(idx === 0 ? { "data-autofocus": true } : {})}
                      value={String(
                        details[f.key as keyof SituationDetails] || "",
                      )}
                      onChange={(e) => {
                        const updated = {
                          ...details,
                          [f.key]: e.target.value,
                        };
                        setField("situationDetails", updated);
                      }}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full resize-none rounded-xl border-2 border-white/20 bg-white/5 px-5 py-3.5 text-lg text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  ) : (
                    <input
                      {...(idx === 0 ? { "data-autofocus": true } : {})}
                      type={f.type || "text"}
                      value={String(
                        details[f.key as keyof SituationDetails] || "",
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
                      className="w-full rounded-xl border-2 border-white/20 bg-white/5 px-5 py-3.5 text-lg text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      /* ── Skill matrix (CDC Étape 0.2b — 7 catégories) ── */
      case "skill-matrix":
        return (
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
              )}
            </div>
            <SkillMatrixSelector
              value={(fieldValue as SelectedSkill[]) || []}
              onChange={(v) => setField(q.field!, v)}
            />
          </div>
        );

      /* ── Parcours-specific questions (CDC Phase 1 branches) ── */
      case "parcours-questions":
        return (
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
              )}
            </div>
            <ParcoursQuestionsForm
              parcours={String(formData.parcours || "")}
              value={
                (formData.parcoursAnswers as Record<string, unknown>) || {}
              }
              onChange={(v) => setField("parcoursAnswers", v)}
            />
          </div>
        );

      /* ── Parcours selector ── */
      case "parcours-selector":
        return (
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
              )}
            </div>
            <ParcoursSelector
              value={String(fieldValue || "")}
              onChange={(v) => setField(q.field!, v)}
              formData={formData}
            />
          </div>
        );

      /* ── Summary ── */
      case "summary":
        return (
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
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
      <div className={cn("relative min-h-dvh text-white", onboardingBg)}>
        <AnimatedBackground />
        <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-12">
          <MarketAnalysis
            result={analysisResult}
            onSelect={handleSelectMarket}
          />
          {error && (
            <div className="mt-4 w-full max-w-3xl rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     Screen: Analyzing
     ═══════════════════════════════════════════ */

  if (isAnalyzing) {
    return (
      <div className={cn("relative min-h-dvh text-white", onboardingBg)}>
        <AnimatedBackground />
        <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center">
          <AILoading text="Analyse de ton marché en cours" />
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     Screen: Loading profile
     ═══════════════════════════════════════════ */

  if (!loaded) {
    return (
      <div className={cn("relative min-h-dvh text-white", onboardingBg)}>
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
  const isChips = currentQuestion?.type === "chips";
  const showNav = !isWelcome && !isChips;

  const handleButtonClick = () => {
    if (isSummary) {
      handleAnalyze();
    } else {
      goNext();
    }
  };

  return (
    <div className={cn("relative min-h-dvh text-white", onboardingBg)}>
      <AnimatedBackground />
      <OnboardingProgressBar step={step} total={totalSteps} />

      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* Top bar */}
        <OnboardingTopBar
          onBack={goPrev}
          step={step}
          total={totalSteps}
          isFirst={isWelcome || step === 0}
        />

        {/* Content — vertically centered */}
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion?.id || step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderQuestion()}

              {/* Inline navigation */}
              {showNav && (
                <div className="mt-8 flex items-center gap-4">
                  <button
                    onClick={handleButtonClick}
                    disabled={!canProceed()}
                    aria-label={
                      isSummary ? "Lancer l'analyse IA" : "Étape suivante"
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-xl text-base font-semibold text-white transition-all duration-200 active:scale-[0.97]",
                      isSummary
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-3.5 shadow-lg shadow-emerald-500/25 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50 disabled:hover:scale-100"
                        : "bg-emerald-500 px-6 py-3 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:hover:shadow-none",
                    )}
                  >
                    {isSummary ? (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Lancer l&apos;analyse IA
                      </>
                    ) : (
                      <>
                        OK
                        <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  {isSummary && (
                    <button
                      onClick={handleSkipAnalysis}
                      className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium text-white/60 transition-all hover:border-white/40 hover:text-white/80"
                    >
                      Passer l&apos;analyse
                    </button>
                  )}
                  {!isSummary && (
                    <span className="text-sm text-white/25">
                      Appuie sur{" "}
                      <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
                        Entrée
                      </kbd>
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 max-w-md w-[calc(100%-3rem)] rounded-xl border border-red-500/30 bg-red-500/15 px-5 py-3 text-sm text-red-300 backdrop-blur-md shadow-xl shadow-red-500/10 flex items-center gap-3 animate-in slide-in-from-bottom-3 fade-in">
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="shrink-0 text-red-400/60 hover:text-red-300 transition-colors"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
