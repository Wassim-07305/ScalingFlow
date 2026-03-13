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
import { OnboardingSkillMatrix } from "./onboarding-skill-matrix";
import { OnboardingSummary } from "./onboarding-summary";
import { ParcoursSelector } from "./parcours-selector";
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
  formations_text: "",
  vaultSkills: [],
  expertise_q1: "",
  expertise_q2: "",
  expertise_q3: "",
  expertise_q4: "",
  hasPayingClients: "",
  payingClientsDetails: {},
  parcours: "",
  // Phase 1 per-parcours
  phase1_a1_motivation: "",
  phase1_a1_quickwin: "",
  phase1_a1_learning: "",
  phase1_a2_transferable: "",
  phase1_a2_transition: "",
  phase1_a2_trigger: "",
  phase1_a3_ideal_offer: "",
  phase1_a3_pricing_blocker: "",
  phase1_a3_acquisition: "",
  phase1_b_channel: "",
  phase1_b_bottleneck: "",
  phase1_b_metrics: "",
  phase1_c_reason: "",
  phase1_c_assets: "",
  phase1_c_positioning: "",
  experienceLevel: "",
  currentRevenue: "",
  targetRevenue: "",
  industries: [],
  objectives: [],
  budgetMonthly: "",
  hoursPerWeek: "",
  deadline: "",
  teamPreference: "",
};

/* ─── Animation variants ─── */

const slideVariants = {
  enter: (d: number) => ({ y: d > 0 ? 40 : -40, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: number) => ({ y: d > 0 ? -40 : 40, opacity: 0 }),
};

/* ─── Situation-specific fields ─── */

/* ─── Paying clients detail fields ─── */

const PAYING_CLIENTS_FIELDS = [
  {
    key: "clients_count",
    label: "Combien de clients payants ?",
    placeholder: "Ex: 12",
    type: "number",
  },
  {
    key: "client_type",
    label: "Quel type de clients ?",
    placeholder: "Ex: Coachs fitness, e-commercants...",
  },
  {
    key: "best_result",
    label: "Quel resultat tu leur as apporte ?",
    placeholder: "Ex: +200% de leads en 3 mois...",
  },
];

/* ─── Situation-specific fields (aligned with CDC) ─── */

const SITUATION_FIELDS: Record<
  string,
  { key: string; label: string; placeholder: string; type?: string }[]
> = {
  salarie: [
    {
      key: "poste",
      label: "Quel est ton poste actuel ?",
      placeholder: "Ex: Chef de projet digital",
    },
    {
      key: "secteur",
      label: "Quel secteur ?",
      placeholder: "Ex: Tech, Finance, Sante...",
    },
    {
      key: "duree_poste",
      label: "Depuis combien de temps ?",
      placeholder: "Ex: 5 ans",
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
      placeholder: "Ex: Developpement web, consulting...",
    },
    {
      key: "client_type",
      label: "Pour quel type de clients ?",
      placeholder: "Ex: PME, startups, agences...",
    },
    {
      key: "ca_actuel",
      label: "CA mensuel moyen (EUR)",
      placeholder: "Ex: 5000",
      type: "number",
    },
    {
      key: "clients_count",
      label: "Combien de clients en simultane ?",
      placeholder: "Ex: 5",
      type: "number",
    },
    {
      key: "tarif_actuel",
      label: "Ton tarif actuel",
      placeholder: "Ex: TJM 400EUR, forfait 2000EUR...",
    },
    {
      key: "biggest_challenge",
      label: "Qu'est-ce qui te frustre le plus dans ton modele actuel ?",
      placeholder: "Ex: Je trade mon temps contre de l'argent...",
    },
  ],
  entrepreneur: [
    {
      key: "business",
      label: "Quel est ton business ?",
      placeholder: "Ex: Agence de marketing, coaching fitness...",
    },
    {
      key: "ca_actuel",
      label: "CA mensuel actuel (EUR)",
      placeholder: "Ex: 15000",
      type: "number",
    },
    {
      key: "clients_count",
      label: "Nombre de clients actifs",
      placeholder: "Ex: 20",
      type: "number",
    },
    {
      key: "biggest_challenge",
      label: "Ton plus gros bottleneck actuel",
      placeholder: "Ex: Pas assez de leads, taux de closing trop bas...",
    },
  ],
  etudiant: [
    {
      key: "etudes",
      label: "Qu'est-ce que tu etudies ?",
      placeholder: "Ex: Marketing digital, commerce, informatique...",
    },
    {
      key: "biggest_challenge",
      label: "Qu'est-ce qui te bloque pour te lancer ?",
      placeholder: "Ex: Pas d'experience, pas de budget...",
    },
  ],
  reconversion: [
    {
      key: "ancien_poste",
      label: "Ton ancien metier / poste",
      placeholder: "Ex: Commercial B2B, RH, comptable...",
    },
    {
      key: "duree_experience",
      label: "Combien d'annees d'experience ?",
      placeholder: "Ex: 8 ans",
    },
    {
      key: "biggest_challenge",
      label: "Pourquoi tu veux changer ?",
      placeholder: "Ex: Je veux plus de liberte, meilleure remuneration...",
    },
  ],
  sans_emploi: [
    {
      key: "ancien_poste",
      label: "Ton dernier poste / experience",
      placeholder: "Ex: Responsable marketing, commercial...",
    },
    {
      key: "biggest_challenge",
      label: "Qu'est-ce qui te bloque pour demarrer ?",
      placeholder: "Ex: Je ne sais pas par ou commencer...",
    },
  ],
};

/* ─── Helper: build expertise answers object ─── */

function buildExpertiseAnswers(
  formData: Record<string, unknown>,
): Record<string, string> {
  const ea: Record<string, string> = {};
  for (let i = 1; i <= 4; i++) {
    const val = formData[`expertise_q${i}`];
    if (val) ea[`q${i}`] = String(val);
  }
  // Include phase1 per-parcours answers
  const phase1 = buildPhase1Answers(formData);
  for (const [label, answer] of Object.entries(phase1)) {
    ea[`phase1_${label}`] = answer;
  }
  return ea;
}

/* ─── Helper: build paying clients details ─── */

function buildPayingClientsDetails(
  formData: Record<string, unknown>,
): Record<string, unknown> {
  const details = (formData.payingClientsDetails as Record<string, unknown>) || {};
  return {
    ...details,
    has_paying_clients: formData.hasPayingClients === "oui",
  };
}

/* ─── Helper: build phase1 per-parcours answers ─── */

const PHASE1_FIELDS: Record<string, { field: string; label: string }[]> = {
  A1: [
    { field: "phase1_a1_motivation", label: "Motivation" },
    { field: "phase1_a1_quickwin", label: "Quick-win ideal" },
    { field: "phase1_a1_learning", label: "Style d'apprentissage" },
  ],
  A2: [
    { field: "phase1_a2_transferable", label: "Expertise transferable" },
    { field: "phase1_a2_transition", label: "Plan de transition" },
    { field: "phase1_a2_trigger", label: "Declencheur" },
  ],
  A3: [
    { field: "phase1_a3_ideal_offer", label: "Offre ideale scalable" },
    { field: "phase1_a3_pricing_blocker", label: "Blocage pricing" },
    { field: "phase1_a3_acquisition", label: "Acquisition ideale" },
  ],
  B: [
    { field: "phase1_b_channel", label: "Canal d'acquisition actuel" },
    { field: "phase1_b_bottleneck", label: "Bottleneck croissance" },
    { field: "phase1_b_metrics", label: "Metriques suivies" },
  ],
  C: [
    { field: "phase1_c_reason", label: "Raison du pivot" },
    { field: "phase1_c_assets", label: "Assets reutilisables" },
    { field: "phase1_c_positioning", label: "Positionnement ideal" },
  ],
};

function buildPhase1Answers(
  formData: Record<string, unknown>,
): Record<string, string> {
  const parcours = String(formData.parcours || "");
  const fields = PHASE1_FIELDS[parcours];
  if (!fields) return {};
  const answers: Record<string, string> = {};
  for (const { field, label } of fields) {
    const val = formData[field];
    if (val) answers[label] = String(val);
  }
  return answers;
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
          if (Array.isArray(profile.vault_skills))
            r.vaultSkills = profile.vault_skills;
          if (profile.expertise_answers) {
            const ea = profile.expertise_answers as Record<string, string>;
            Object.entries(ea).forEach(([k, v]) => {
              if (k.startsWith("phase1_")) {
                // Reverse-map phase1 labels back to form fields
                const parcours = String(profile.parcours || "");
                const fields = PHASE1_FIELDS[parcours] || [];
                const match = fields.find((f) => `phase1_${f.label}` === k);
                if (match) r[match.field] = v;
              } else {
                r[`expertise_${k}`] = v;
              }
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
          if (profile.hours_per_week)
            r.hoursPerWeek = String(profile.hours_per_week);
          if (profile.deadline) r.deadline = profile.deadline;
          if (profile.team_size != null) {
            r.teamPreference =
              profile.team_size === 0
                ? "recruter"
                : profile.team_size >= 2
                  ? "equipe"
                  : "seul";
          }
          if (
            Array.isArray(profile.formations) &&
            profile.formations.length > 0
          )
            r.formations_text = profile.formations[0];
          // Restore paying clients
          const sd = profile.situation_details as Record<string, unknown> | null;
          if (sd?.paying_clients) {
            const pc = sd.paying_clients as Record<string, unknown>;
            r.hasPayingClients = pc.has_paying_clients ? "oui" : "non";
            r.payingClientsDetails = pc;
          }

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
          first_name: (formData.firstName as string) || null,
          last_name: (formData.lastName as string) || null,
          country: (formData.country as string) || null,
          language: (formData.language as string) || null,
          situation: (formData.situation as string) || null,
          situation_details: {
            ...(formData.situationDetails || {}),
            paying_clients: buildPayingClientsDetails(formData),
          },
          vault_skills: formData.vaultSkills || [],
          expertise_answers: buildExpertiseAnswers(formData),
          parcours: (formData.parcours as string) || null,
          experience_level: (formData.experienceLevel as string) || null,
          current_revenue: Number(formData.currentRevenue) || 0,
          target_revenue: Number(formData.targetRevenue) || 0,
          industries: (formData.industries as string[]) || [],
          objectives: (formData.objectives as string[]) || [],
          budget_monthly: Number(formData.budgetMonthly) || 0,
          hours_per_week: Number(formData.hoursPerWeek) || 0,
          deadline: (formData.deadline as string) || "",
          team_size: formData.teamPreference === "equipe" ? 2 : formData.teamPreference === "recruter" ? 0 : 1,
          formations: formData.formations_text ? [String(formData.formations_text)] : [],
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
      case "text-euro":
        return String(formData[field!] || "").trim() !== "";
      case "textarea":
        return true; // Expertise questions are optional
      case "chips":
        return String(formData[field!] || "").trim() !== "";
      case "parcours-selector":
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

  /* ── Skip analysis + complete onboarding ── */

  const handleSkipAnalysis = async () => {
    if (!user) return;
    await saveProgress(totalSteps);

    const completionData = {
      onboarding_completed: true,
      onboarding_step: totalSteps,
      first_name: (formData.firstName as string) || null,
      last_name: (formData.lastName as string) || null,
      country: (formData.country as string) || null,
      language: (formData.language as string) || null,
      situation: (formData.situation as string) || null,
      situation_details: {
        ...(formData.situationDetails || {}),
        paying_clients: buildPayingClientsDetails(formData),
      },
      vault_skills: formData.vaultSkills || [],
      expertise_answers: buildExpertiseAnswers(formData),
      parcours: (formData.parcours as string) || null,
      experience_level: (formData.experienceLevel as string) || null,
      current_revenue: Number(formData.currentRevenue) || 0,
      target_revenue: Number(formData.targetRevenue) || 0,
      industries: (formData.industries as string[]) || [],
      objectives: (formData.objectives as string[]) || [],
      budget_monthly: Number(formData.budgetMonthly) || 0,
      hours_per_week: Number(formData.hoursPerWeek) || 0,
      deadline: (formData.deadline as string) || "",
      team_size: formData.teamPreference === "equipe" ? 2 : formData.teamPreference === "recruter" ? 0 : 1,
      formations: formData.formations_text ? [String(formData.formations_text)] : [],
      vault_completed: true,
    };

    await supabase
      .from("profiles")
      .update(completionData)
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
          lastName: formData.lastName,
          country: formData.country,
          language: formData.language,
          situation: formData.situation,
          situationDetails: {
            ...(formData.situationDetails || {}),
            paying_clients: buildPayingClientsDetails(formData),
          },
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
          hoursPerWeek: Number(formData.hoursPerWeek) || 0,
          deadline: (formData.deadline as string) || "",
          teamSize: formData.teamPreference === "equipe" ? 2 : 1,
          formations: formData.formations_text ? [String(formData.formations_text)] : [],
          phase1Answers: buildPhase1Answers(formData),
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
        situation_details: {
          ...(formData.situationDetails || {}),
          paying_clients: buildPayingClientsDetails(formData),
        },
        vault_skills: formData.vaultSkills || [],
        expertise_answers: buildExpertiseAnswers(formData),
        parcours: (formData.parcours as string) || null,
        experience_level: (formData.experienceLevel as string) || null,
        current_revenue: Number(formData.currentRevenue) || 0,
        target_revenue: Number(formData.targetRevenue) || 0,
        industries: (formData.industries as string[]) || [],
        objectives: (formData.objectives as string[]) || [],
        budget_monthly: Number(formData.budgetMonthly) || 0,
        hours_per_week: Number(formData.hoursPerWeek) || 0,
        deadline: (formData.deadline as string) || "",
        team_size: formData.teamPreference === "equipe" ? 2 : formData.teamPreference === "recruter" ? 0 : 1,
        formations: formData.formations_text ? [String(formData.formations_text)] : [],
        vault_completed: true,
        selected_market: market.name,
        market_viability_score: market.viability_score,
        niche: market.name,
      })
      .eq("id", user.id);

    // Attribuer XP pour l'onboarding (non bloquant)
    fetch("/api/gamification/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityType: "onboarding.completed" }),
    }).catch(() => {});

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
            {q.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-10 max-w-md text-lg text-white/50"
              >
                {q.subtitle}
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
              className="w-full border-b-2 border-white/20 bg-transparent pb-3 text-2xl font-medium text-white outline-none placeholder:text-white/25 transition-colors focus:border-emerald-400 sm:text-3xl"
            />
          </div>
        );

      /* ── Euro input ── */
      case "text-euro":
        return (
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
            </div>
            <div className="relative">
              <input
                data-autofocus
                type="number"
                value={String(fieldValue || "")}
                onChange={(e) => setField(q.field!, e.target.value)}
                placeholder={q.placeholder}
                className="w-full border-b-2 border-white/20 bg-transparent pb-3 pr-14 text-2xl font-medium text-white outline-none placeholder:text-white/25 transition-colors focus:border-emerald-400 sm:text-3xl"
              />
              <span className="absolute bottom-3 right-0 text-lg text-white/30">
                EUR
              </span>
            </div>
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
              rows={3}
              className="w-full resize-none rounded-xl border-2 border-white/20 bg-white/5 px-5 py-4 text-lg text-white outline-none placeholder:text-white/25 transition-colors focus:border-emerald-400"
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

      /* ── Multi-field (situation details OR paying clients details) ── */
      case "multi-field": {
        const isPayingClients = q.field === "payingClientsDetails";
        const situation = String(formData.situation || "etudiant");
        const fields = isPayingClients
          ? PAYING_CLIENTS_FIELDS
          : (SITUATION_FIELDS[situation] || SITUATION_FIELDS.etudiant);
        const detailsKey = isPayingClients ? "payingClientsDetails" : "situationDetails";
        const details = (formData[detailsKey] as SituationDetails) || {};

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
                      setField(detailsKey, updated);
                    }}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border-2 border-white/20 bg-white/5 px-5 py-3.5 text-lg text-white outline-none placeholder:text-white/25 transition-colors focus:border-emerald-400"
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
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-2 text-base text-white/40">{q.subtitle}</p>
              )}
            </div>
            <OnboardingSkillMatrix
              value={(fieldValue as VaultSkillCategory[]) || []}
              onChange={(v) => setField(q.field!, v)}
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
        {/* Top bar — always visible, back invisible on welcome */}
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

              {/* Inline navigation — below question, left-aligned (Rivia style) */}
              {showNav && (
                <div className="mt-8 flex items-center gap-4">
                  <button
                    onClick={handleButtonClick}
                    disabled={!canProceed()}
                    aria-label={
                      isSummary ? "Lancer l'analyse IA" : "Étape suivante"
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-xl text-base font-semibold text-white transition-all",
                      isSummary
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-3.5 shadow-lg shadow-emerald-500/25 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50"
                        : "bg-emerald-500 px-6 py-3 hover:bg-emerald-400 disabled:opacity-50",
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
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-500/20 px-6 py-3 text-sm text-red-300 backdrop-blur">
          {error}
        </div>
      )}
    </div>
  );
}
